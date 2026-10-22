"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, requirePermission, requireUser } from "@/lib/auth";
import { checkoutActor } from "@/lib/checkout-actor";
import { readCheckoutDraft, writeCheckoutDraft } from "@/lib/checkout-draft";
import { addDemoCartItem, setDemoCartQuantity } from "@/lib/demo-cart";
import { addGuestCartItem, setGuestCartQuantity } from "@/lib/guest-cart";
import { demoProductById } from "@/lib/demo-catalog";
import { buildCheckoutDraft } from "@/lib/store-checkout";
import { audit, notify } from "@/lib/audit";
import {
  adjustStock,
  assertListingLimit,
  CommerceError,
  confirmCustomerDelivery,
  completePayout,
  confirmPayment,
  refundVendorOrder,
  releaseDisputeHold,
  requestWithdrawal,
  trimPublishedListings,
  vendorHasChosenPlan,
} from "@/lib/commerce";
import { slugify, uniqueSlug } from "@/lib/utils";
import { resolveUkAddress } from "@/lib/uk-address";
import { parseGbpToPence } from "@/lib/money";
import { normaliseUkBank } from "@/lib/wallet";
import { getSetting, setSetting, truthy } from "@/lib/settings";
import { savePrivateUpload, savePublicUpload } from "@/lib/uploads";
import { assertNotLastAdmin } from "@/lib/last-admin";
import { applyKycDecision, applySylmeraSession } from "@/lib/kyc";
import { createSylmeraSession, getSylmeraSession, isSylmeraConfigured, type SylmeraKind } from "@/lib/sylmera";

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findFirst({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

export async function addToCartFromForm(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "") || undefined;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  return addToCart(productId, quantity, variantId);
}

export async function addToCart(productId: string, quantity = 1, variantId?: string) {
  if (productId.startsWith("demo-")) {
    if (!demoProductById(productId)) return { error: "This product cannot be purchased." };
    await addDemoCartItem(productId, quantity);
    revalidatePath("/cart");
    revalidatePath("/");
    revalidatePath("/products");
    return { ok: true };
  }
  const user = await getSessionUser();
  if (!user) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { vendor: true, variants: true },
      });
      if (!product || product.status !== "PUBLISHED") return { error: "This product cannot be purchased." };
      const variant = variantId
        ? product.variants.find((item) => item.id === variantId)
        : product.variants[0];
      if (!variant) return { error: "This product has no purchasable option." };
      await addGuestCartItem({
        productId: product.id,
        variantId: variant.id,
        quantity,
        name: product.name,
        unitPence: variant.pricePence ?? product.salePricePence ?? product.pricePence,
        vendor: product.vendor.storeName,
      });
      revalidatePath("/cart");
      revalidatePath("/");
      revalidatePath("/products");
      return { ok: true };
    } catch (error) {
      console.error("[cart] guest add failed", error instanceof Error ? error.message : error);
      return { error: "This product could not be added just now." };
    }
  }
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "PUBLISHED") return { error: "This product cannot be purchased." };
  const cart = await getOrCreateCart(user.id);
  const variant = variantId
    ? await prisma.productVariant.findUnique({ where: { id: variantId } })
    : await prisma.productVariant.findFirst({ where: { productId } });
  if (!variant) return { error: "This product has no purchasable option." };
  await prisma.cartItem.upsert({
    where: {
      cartId_productId_variantId: {
        cartId: cart.id,
        productId,
        variantId: variant.id,
      },
    },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId, variantId: variant.id, quantity },
  });
  revalidatePath("/cart");
  revalidatePath("/");
  revalidatePath("/products");
  return { ok: true };
}

export async function updateCartItem(itemId: string, quantity: number) {
  if (itemId.startsWith("demo-")) {
    await setDemoCartQuantity(itemId, quantity);
    revalidatePath("/cart");
    revalidatePath("/");
    return;
  }
  if (itemId.startsWith("guest:")) {
    await setGuestCartQuantity(itemId.slice("guest:".length), quantity);
    revalidatePath("/cart");
    revalidatePath("/");
    return;
  }
  const user = await getSessionUser();
  if (!user) return { error: "Sign in to change this item." };
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId: user.id } },
  });
  if (!item) return { error: "Item not found." };
  if (quantity <= 0) await prisma.cartItem.delete({ where: { id: itemId } });
  else await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  revalidatePath("/cart");
  revalidatePath("/");
}

export async function toggleWishlistForm(formData: FormData) {
  return toggleWishlist(String(formData.get("productId") ?? ""));
}

export async function toggleWishlist(productId: string) {
  const user = await requirePermission("customer.wishlist.manage");
  if (!productId) return { error: "Product missing." };
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (existing) await prisma.wishlistItem.delete({ where: { id: existing.id } });
  else await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  revalidatePath("/account/wishlist");
  revalidatePath("/");
  revalidatePath("/products");
  return { ok: true };
}

export async function saveAddress(formData: FormData) {
  const user = await requirePermission("customer.address.manage");
  const id = String(formData.get("id") ?? "");
  const located = await resolveUkAddress({
    city: String(formData.get("city") ?? ""),
    region: String(formData.get("region") ?? ""),
    postcode: String(formData.get("postcode") ?? ""),
  });
  if ("error" in located) return located;
  const data = {
    label: String(formData.get("label") ?? "Home"),
    line1: String(formData.get("line1") ?? "").trim(),
    line2: String(formData.get("line2") ?? "") || null,
    city: located.city,
    region: located.region,
    postcode: located.postcode,
    country: "GB",
    isDefault: formData.get("isDefault") === "on",
  };
  if (data.line1.trim().length < 3) return { error: "Enter a complete UK address." };
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }
  if (id) {
    await prisma.address.updateMany({ where: { id, userId: user.id }, data });
  } else {
    await prisma.address.create({ data: { ...data, userId: user.id } });
  }
  revalidatePath("/account/addresses");
}

export async function deleteAddress(id: string) {
  const user = await requirePermission("customer.address.manage");
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/account/addresses");
}

export async function updateProfile(formData: FormData) {
  const user = await requirePermission("customer.profile.edit");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (name.length < 2) return { error: "Enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  const current = await prisma.user.findUnique({ where: { id: user.id } });
  if (!current) return { error: "Profile changes need the live database." };
  const taken = await prisma.user.findFirst({ where: { email, NOT: { id: user.id } }, select: { id: true } });
  if (taken) return { error: "That email is already used by another account." };
  let image: string | undefined;
  const picture = formData.get("picture");
  if (picture instanceof File && picture.size > 0) {
    try {
      image = await savePublicUpload(picture, "avatars");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "That picture could not be saved." };
    }
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: phone || null,
      email,
      emailVerifiedAt: email === current.email ? current.emailVerifiedAt : null,
      ...(image ? { image } : {}),
    },
  });
  revalidatePath("/account/profile");
  revalidatePath("/account");
}

export async function checkoutAction(formData: FormData) {
  const user = await checkoutActor();
  if (!user) redirect("/login?next=/checkout");
  const shippingName = String(formData.get("shippingName") ?? user.name).trim();
  const shippingLine1 = String(formData.get("shippingLine1") ?? "").trim();
  const located = await resolveUkAddress({
    city: String(formData.get("shippingCity") ?? ""),
    region: String(formData.get("shippingRegion") ?? ""),
    postcode: String(formData.get("shippingPostcode") ?? ""),
  });
  if ("error" in located) return located;
  if (shippingName.length < 2 || shippingLine1.length < 3) {
    return { error: "Enter a full name and a complete UK delivery address." };
  }
  const coupon = String(formData.get("coupon") ?? "").trim();
  const shippingMethodIds: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && key.startsWith("method_")) shippingMethodIds[key.slice("method_".length)] = value;
  }
  const built = await buildCheckoutDraft(
    user,
    {
      shippingName,
      shippingLine1,
      shippingCity: located.city,
      shippingRegion: located.region,
      shippingPostcode: located.postcode,
    },
    coupon || undefined,
    shippingMethodIds,
  );
  if ("error" in built) return built;
  await writeCheckoutDraft(built.draft);
  redirect("/checkout/pay");
}

export async function updateCheckoutDelivery(formData: FormData) {
  const user = await checkoutActor();
  if (!user) redirect("/login?next=/checkout");
  const draft = await readCheckoutDraft();
  if (!draft || draft.userId !== user.id) return { error: "This checkout has expired." };
  const shippingMethodIds: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && key.startsWith("method_")) shippingMethodIds[key.slice("method_".length)] = value;
  }
  const built = await buildCheckoutDraft(
    user,
    {
      shippingName: draft.shippingName,
      shippingLine1: draft.shippingLine1,
      shippingCity: draft.shippingCity,
      shippingRegion: draft.shippingRegion,
      shippingPostcode: draft.shippingPostcode,
    },
    draft.coupon,
    shippingMethodIds,
  );
  if ("error" in built) return built;
  await writeCheckoutDraft(built.draft);
  redirect("/checkout/pay");
}

export async function completeSandboxPayment(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order) return { error: "Order not found." };
  if (order.paymentStatus === "PAID") return { ok: true };
  try {
    await confirmPayment(order.id, `sandbox_${order.id}`, `pay_${order.id}`);
  } catch (error) {
    console.error("completeSandboxPayment", error);
    return { error: error instanceof CommerceError ? error.message : "Payment confirmation failed." };
  }
  redirect(`/account/orders/${orderId}?paid=1`);
}

export async function cancelOrder(orderId: string) {
  const user = await requirePermission("customer.order.cancel");
  const hours = Number(await getSetting("cancellationWindowHours")) || 2;
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { vendorOrders: { include: { items: true } } },
  });
  if (!order) return { error: "Order not found." };
  const cutoff = new Date(order.placedAt.getTime() + hours * 60 * 60 * 1000);
  const alreadyShipped = order.vendorOrders.some((v) =>
    ["DISPATCHED", "DELIVERED", "SETTLED"].includes(v.status),
  );
  if (alreadyShipped || new Date() > cutoff) {
    return { error: "This order is no longer eligible for cancellation." };
  }
  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await tx.vendorOrder.updateMany({ where: { orderId: order.id }, data: { status: "CANCELLED" } });
    for (const vo of order.vendorOrders) {
      for (const item of vo.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              delta: item.quantity,
              reason: "ORDER_CANCEL",
            },
          });
        }
      }
    }
  });
  revalidatePath("/account/orders");
}

export async function changePassword(formData: FormData) {
  const user = await requireUser();
  const next = String(formData.get("password") ?? "");
  if (next.length < 10) return { error: "Password must be at least 10 characters." };
  const { hashPassword } = await import("@/lib/auth");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });
  revalidatePath("/account/security");
  return { ok: true };
}

export async function requestPrivacyAction(formData: FormData) {
  const user = await requireUser();
  await prisma.supportTicket.create({
    data: {
      number: `TCK-${Date.now().toString(36).toUpperCase()}`,
      requesterId: user.id,
      category: "PRIVACY",
      subject: String(formData.get("type") ?? "DATA_EXPORT"),
      messages: {
        create: {
          authorId: user.id,
          body: String(formData.get("notes") ?? "Privacy request submitted from the customer dashboard."),
        },
      },
    },
  });
  revalidatePath("/account/privacy");
}

export async function replyTicket(formData: FormData) {
  const user = await requireUser();
  const ticketId = String(formData.get("ticketId"));
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, requesterId: user.id },
  });
  if (!ticket) return { error: "Ticket not found." };
  await prisma.ticketMessage.create({
    data: { ticketId, authorId: user.id, body: String(formData.get("body") ?? "") },
  });
  revalidatePath(`/account/support/${ticketId}`);
}

export async function adminReviewKyc(id: string, status: string, notes?: string) {
  const actor = await requirePermission("admin.kyc.review");
  const submission = await prisma.kycSubmission.update({
    where: { id },
    data: { status, notes, reviewedAt: new Date(), reviewerId: actor.id },
  });
  await applyKycDecision(submission.vendorId, status, actor.id);
  await audit({ actorId: actor.id, action: "kyc.review", entity: "KycSubmission", entityId: id, metadata: { status } });
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${submission.vendorId}`);
}

export async function adminResolveDispute(id: string, status: string, refundPence?: number) {
  const actor = await requirePermission("admin.order.manage");
  const dispute = await prisma.dispute.update({
    where: { id },
    data: { status, resolvedAt: new Date() },
    include: { vendorOrder: true },
  });
  await releaseDisputeHold(dispute.vendorOrderId);
  if (refundPence && refundPence > 0) {
    const eligible =
      dispute.vendorOrder.allocationVersion >= 2
        ? dispute.vendorOrder.subtotalPence - dispute.vendorOrder.discountPence
        : dispute.vendorOrder.subtotalPence;
    await refundVendorOrder({
      vendorOrderId: dispute.vendorOrderId,
      productRefundPence: Math.min(refundPence, Math.max(0, eligible)),
      shippingRefundPence: 0,
      reason: `Dispute ${id}`,
      idempotencyKey: `dispute_${id}`,
      disputeId: id,
    });
  }
  await audit({ actorId: actor.id, action: "dispute.resolve", entity: "Dispute", entityId: id, metadata: { status } });
  revalidatePath("/admin/orders");
}

export async function customerConfirmDelivery(vendorOrderId: string) {
  const user = await requireUser();
  await confirmCustomerDelivery(vendorOrderId, user.id);
  revalidatePath("/account/orders");
}

export async function requestReturn(formData: FormData) {
  const user = await requirePermission("customer.return.request");
  const vendorOrderId = String(formData.get("vendorOrderId"));
  const vo = await prisma.vendorOrder.findFirst({
    where: { id: vendorOrderId, order: { userId: user.id } },
  });
  if (!vo) return { error: "Order not found." };
  await prisma.dispute.create({
    data: {
      vendorOrderId,
      type: String(formData.get("type") ?? "RETURN"),
      reason: String(formData.get("reason") ?? ""),
      status: "OPEN",
    },
  });
  await prisma.ledgerEntry.create({
    data: {
      vendorId: vo.vendorId,
      vendorOrderId,
      type: "HOLD",
      amountPence: vo.vendorNetPence,
      note: "Dispute hold",
    },
  });
  revalidatePath("/account/orders");
}

export async function createReview(formData: FormData) {
  const user = await requirePermission("customer.review.create");
  const productId = String(formData.get("productId"));
  const requirePurchase = truthy(await getSetting("reviewsRequirePurchase"));
  if (requirePurchase) {
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        vendorOrder: { order: { userId: user.id, paymentStatus: "PAID" } },
      },
    });
    if (!purchased) return { error: "Only verified purchasers can review this product." };
  }
  await prisma.review.create({
    data: {
      userId: user.id,
      productId,
      rating: Number(formData.get("rating") ?? 5),
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      verified: true,
    },
  });
  revalidatePath("/account/reviews");
}

export async function createTicket(formData: FormData) {
  const user = await requirePermission("customer.support.create");
  const ticket = await prisma.supportTicket.create({
    data: {
      number: `TCK-${Date.now().toString(36).toUpperCase()}`,
      requesterId: user.id,
      category: String(formData.get("category") ?? "GENERAL"),
      subject: String(formData.get("subject") ?? ""),
      messages: {
        create: {
          authorId: user.id,
          body: String(formData.get("body") ?? ""),
        },
      },
    },
  });
  redirect(`/account/support/${ticket.id}`);
}

export async function saveVendorStore(formData: FormData) {
  const user = await requirePermission("vendor.store.manage");
  if (!user.vendorId) return { error: "Vendor profile missing." };
  await prisma.vendorProfile.update({
    where: { id: user.vendorId },
    data: {
      storeName: String(formData.get("storeName") ?? ""),
      description: String(formData.get("description") ?? ""),
      policies: String(formData.get("policies") ?? ""),
      returnPolicy: String(formData.get("returnPolicy") ?? ""),
      businessEmail: String(formData.get("businessEmail") ?? ""),
      businessPhone: String(formData.get("businessPhone") ?? ""),
      city: String(formData.get("city") ?? ""),
      postcode: String(formData.get("postcode") ?? ""),
    },
  });
  revalidatePath("/vendor/store");
}

export async function startSylmeraKyc(formData: FormData) {
  const user = await requirePermission("vendor.kyc.submit");
  if (!user.vendorId) return { error: "Vendor profile missing." };
  if (!isSylmeraConfigured()) {
    return { error: "Sylmera identity verification is not configured. Add SYLMERA_API_KEY." };
  }
  const kind: SylmeraKind = String(formData.get("kind") ?? "person") === "business" ? "business" : "person";
  const sellerType = kind === "business" ? "BUSINESS" : "INDIVIDUAL";
  let session;
  try {
    session = await createSylmeraSession({
      clientReference: `vendor:${user.vendorId}:${kind}`,
      kind,
      returnUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/vendor/kyc?sylmera=1`,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not start Sylmera verification." };
  }
  await prisma.vendorProfile.update({
    where: { id: user.vendorId },
    data: { sellerType, kycStatus: "PENDING" },
  });
  await prisma.kycSubmission.create({
    data: {
      vendorId: user.vendorId,
      kind,
      provider: "sylmera",
      providerSessionId: session.id,
      providerStatus: session.status ?? "created",
      hostedUrl: session.url,
      status: "PENDING",
      notes: kind === "business" ? "UK business verification" : "Individual seller verification",
    },
  });
  revalidatePath("/vendor/kyc");
  redirect(session.url!);
}

export async function syncSylmeraKyc() {
  const user = await requirePermission("vendor.kyc.submit");
  if (!user.vendorId || !isSylmeraConfigured()) return;
  const pending = await prisma.kycSubmission.findMany({
    where: {
      vendorId: user.vendorId,
      provider: "sylmera",
      providerSessionId: { not: null },
      status: { in: ["PENDING"] },
    },
  });
  for (const row of pending) {
    try {
      const session = await getSylmeraSession(row.providerSessionId!);
      await applySylmeraSession(row.id, session);
    } catch {
      // Keep the local pending row if Sylmera is briefly unreachable.
    }
  }
  revalidatePath("/vendor/kyc");
}

export async function submitKyc(formData: FormData) {
  const user = await requirePermission("vendor.kyc.submit");
  if (!user.vendorId) return { error: "Vendor profile missing." };
  const document = formData.get("document");
  let documentRefs = "storage/private/kyc/no-file";
  if (document instanceof File && document.size > 0) {
    try {
      documentRefs = await savePrivateUpload(document, `kyc/${user.vendorId}`);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Could not store that document." };
    }
  }
  const kind = String(formData.get("kind") ?? "person") === "business" ? "business" : "person";
  await prisma.kycSubmission.create({
    data: {
      vendorId: user.vendorId,
      kind,
      provider: "manual",
      status: "PENDING",
      notes: String(formData.get("notes") ?? ""),
      documentRefs,
    },
  });
  await prisma.vendorProfile.update({
    where: { id: user.vendorId },
    data: {
      sellerType: kind === "business" ? "BUSINESS" : "INDIVIDUAL",
      kycStatus: "PENDING",
    },
  });
  revalidatePath("/vendor/kyc");
}

export async function saveProduct(formData: FormData) {
  const user = await requirePermission("vendor.product.create");
  if (!user.vendorId) return { error: "Vendor profile missing." };
  if (!(await vendorHasChosenPlan(user.vendorId))) {
    return { error: "Choose a subscription plan before listing a product." };
  }
  const id = String(formData.get("id") ?? "");
  const statusIntent = String(formData.get("status") ?? "DRAFT");
  const needsApproval = truthy(await getSetting("productsRequireApproval"));
  let status = statusIntent;
  if (statusIntent === "PUBLISHED") {
    try {
      await assertListingLimit(user.vendorId);
    } catch (error) {
      return { error: error instanceof CommerceError ? error.message : "Listing limit reached." };
    }
    status = needsApproval ? "PENDING_REVIEW" : "PUBLISHED";
  }
  const data = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    pricePence: parseGbpToPence(String(formData.get("price") ?? "0")),
    sku: String(formData.get("sku") ?? "") || null,
    originCountry: String(formData.get("originCountry") ?? "NG"),
    handlingDays: Number(formData.get("handlingDays") ?? 2),
    status,
    publishedAt: status === "PUBLISHED" ? new Date() : null,
  };
  let featuredUrl: string | null = null;
  const galleryUrls: string[] = [];
  try {
    const featured = formData.get("featured") ?? formData.get("image");
    if (featured instanceof File && featured.size > 0) {
      featuredUrl = await savePublicUpload(featured, "products");
    }
    for (const file of formData.getAll("gallery")) {
      if (file instanceof File && file.size > 0) {
        galleryUrls.push(await savePublicUpload(file, "products"));
      }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not store that image." };
  }
  const imageRows = [
    ...(featuredUrl ? [{ url: featuredUrl, alt: data.name, sortOrder: 0 }] : []),
    ...galleryUrls.map((url, index) => ({
      url,
      alt: data.name,
      sortOrder: (featuredUrl ? 1 : 0) + index,
    })),
  ];
  let productId = id;
  if (id) {
    await prisma.product.update({ where: { id, vendorId: user.vendorId }, data });
    if (featuredUrl) {
      const current = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { sortOrder: "asc" },
      });
      if (current) {
        await prisma.productImage.update({
          where: { id: current.id },
          data: { url: featuredUrl, alt: data.name, sortOrder: 0 },
        });
      } else {
        await prisma.productImage.create({
          data: { productId: id, url: featuredUrl, alt: data.name, sortOrder: 0 },
        });
      }
    }
    if (galleryUrls.length) {
      const last = await prisma.productImage.aggregate({
        where: { productId: id },
        _max: { sortOrder: true },
      });
      let sortOrder = (last._max.sortOrder ?? -1) + 1;
      if (featuredUrl) sortOrder = Math.max(sortOrder, 1);
      for (const url of galleryUrls) {
        await prisma.productImage.create({
          data: { productId: id, url, alt: data.name, sortOrder },
        });
        sortOrder += 1;
      }
    }
  } else {
    const created = await prisma.product.create({
      data: {
        ...data,
        vendorId: user.vendorId,
        slug: uniqueSlug(data.name),
        variants: {
          create: {
            name: "Default",
            sku: data.sku,
            stock: Number(formData.get("stock") ?? 0),
            pricePence: data.pricePence,
          },
        },
        images: imageRows.length ? { create: imageRows } : undefined,
      },
    });
    productId = created.id;
  }
  const attrs = await prisma.categoryAttribute.findMany({ where: { categoryId: data.categoryId } });
  for (const attr of attrs) {
    const value = String(formData.get(`attr_${attr.key}`) ?? "");
    if (!value && attr.required) return { error: `${attr.label} is required for this category.` };
    if (value) {
      await prisma.productAttributeValue.upsert({
        where: { productId_key: { productId, key: attr.key } },
        update: { value },
        create: { productId, key: attr.key, value },
      });
    }
  }
  revalidatePath("/vendor/products");
  redirect("/vendor/products");
}

export async function updateVendorStock(variantId: string, stock: number) {
  const user = await requirePermission("vendor.inventory.manage");
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, product: { vendorId: user.vendorId ?? "" } },
  });
  if (!variant) return { error: "Variant not found." };
  await adjustStock(variantId, stock - variant.stock, "MANUAL_ADJUSTMENT");
  revalidatePath("/vendor/inventory");
}

export async function updateVendorOrderStatus(id: string, status: string, tracking?: string) {
  const user = await requirePermission("vendor.order.manage");
  const vo = await prisma.vendorOrder.findFirst({ where: { id, vendorId: user.vendorId ?? "" } });
  if (!vo) return { error: "Order not found." };
  await prisma.vendorOrder.update({
    where: { id },
    data: {
      status,
      trackingNumber: tracking || vo.trackingNumber,
      dispatchedAt: status === "DISPATCHED" ? new Date() : vo.dispatchedAt,
      deliveredAt: status === "DELIVERED" ? new Date() : vo.deliveredAt,
    },
  });
  if (status === "DISPATCHED") {
    await prisma.shipment.create({
      data: {
        vendorOrderId: id,
        trackingNumber: tracking,
        status: "DISPATCHED",
        events: { create: { status: "DISPATCHED", message: "Handed to carrier" } },
      },
    });
  }
  revalidatePath("/vendor/orders");
}

export async function saveShippingMethod(formData: FormData) {
  const user = await requirePermission("vendor.shipping.manage");
  await prisma.shippingMethod.create({
    data: {
      vendorId: user.vendorId,
      zoneId: String(formData.get("zoneId")),
      name: String(formData.get("name")),
      code: String(formData.get("code") ?? "STANDARD"),
      carrier: String(formData.get("carrier") ?? "Royal Mail"),
      pricePence: parseGbpToPence(String(formData.get("price") ?? "0")),
      minDays: Number(formData.get("minDays") ?? 2),
      maxDays: Number(formData.get("maxDays") ?? 5),
    },
  });
  revalidatePath("/vendor/shipping");
}

export async function saveVendorBankAction(formData: FormData) {
  const user = await requirePermission("vendor.payout.request");
  if (!user.vendorId) return { error: "Vendor profile missing." };
  const accountName = String(formData.get("accountName") ?? "").trim();
  const bank = normaliseUkBank(String(formData.get("sortCode") ?? ""), String(formData.get("accountNumber") ?? ""));
  if (accountName.length < 2 || !bank) {
    return { error: "Enter the account name, a 6-digit sort code and an 8-digit account number." };
  }
  await prisma.payoutMethod.updateMany({ where: { vendorId: user.vendorId }, data: { isDefault: false } });
  await prisma.payoutMethod.create({
    data: {
      vendorId: user.vendorId,
      type: "BANK_UK",
      label: accountName,
      details: `${bank.sortCode} · ${bank.accountNumber}`,
      isDefault: true,
    },
  });
  revalidatePath("/vendor/payouts");
}

export async function requestPayoutAction(formData: FormData) {
  const user = await requirePermission("vendor.payout.request");
  if (!user.vendorId) return { error: "Vendor profile missing." };
  try {
    await requestWithdrawal(user.vendorId, parseGbpToPence(String(formData.get("amount") ?? "0")));
  } catch (error) {
    return { error: error instanceof CommerceError ? error.message : "Payout failed." };
  }
  revalidatePath("/vendor/payouts");
  revalidatePath("/vendor/earnings");
}

export async function subscribePlan(planId: string) {
  const user = await requirePermission("vendor.subscription.manage");
  if (!user.vendorId) return { error: "Vendor profile missing." };
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.openForSignup) return { error: "This plan is not available." };
  const end = new Date();
  if (plan.interval === "MONTH") end.setMonth(end.getMonth() + 1);
  else if (plan.interval === "SIX_MONTH") end.setMonth(end.getMonth() + 6);
  else if (plan.interval === "YEAR") end.setFullYear(end.getFullYear() + 1);
  else end.setFullYear(end.getFullYear() + 10);
  const sub = await prisma.vendorSubscription.create({
    data: {
      vendorId: user.vendorId,
      planId: plan.id,
      status: "ACTIVE",
      currentPeriodEnd: end,
      provider: process.env.PAYMENT_PROVIDER ?? "sandbox",
      billingEvents: {
        create: {
          type: "SUBSCRIBE",
          amountPence: plan.pricePence,
          idempotencyKey: `sub_${user.vendorId}_${plan.id}_${Date.now()}`,
        },
      },
    },
  });
  await prisma.vendorSubscription.updateMany({
    where: { vendorId: user.vendorId, id: { not: sub.id }, status: "ACTIVE" },
    data: { status: "REPLACED" },
  });
  const trimmed = await trimPublishedListings(user.vendorId, plan.maxActiveProducts);
  const draftNote =
    trimmed.deactivated > 0
      ? ` ${trimmed.deactivated} newer listing${trimmed.deactivated === 1 ? "" : "s"} moved to draft. Nothing was deleted.`
      : "";
  await notify(
    user.id,
    "Subscription updated",
    `You are now on the ${plan.name} plan.${draftNote}`,
    "/vendor/subscription",
  );
  revalidatePath("/vendor/subscription");
  revalidatePath("/vendor/products");
}

export async function adminSaveSetting(formData: FormData) {
  const user = await requirePermission("admin.settings.manage");
  const key = String(formData.get("key"));
  const value = String(formData.get("value"));
  await setSetting(key, value, user.id);
  revalidatePath("/admin/settings");
}

export async function adminSaveCategory(formData: FormData) {
  const user = await requirePermission("admin.category.manage");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const data = {
    name,
    slug: String(formData.get("slug") ?? uniqueSlug(name)),
    description: String(formData.get("description") ?? ""),
    enabled: formData.get("enabled") === "on",
    featured: formData.get("featured") === "on",
    seoTitle: String(formData.get("seoTitle") ?? "") || null,
    parentId: String(formData.get("parentId") ?? "") || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  };
  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });
  await audit({ actorId: user.id, action: "category.save", entity: "Category", entityId: id || name });
  revalidatePath("/admin/categories");
}

export async function adminAddCategoryAttribute(formData: FormData) {
  await requirePermission("admin.category.manage");
  await prisma.categoryAttribute.create({
    data: {
      categoryId: String(formData.get("categoryId")),
      key: String(formData.get("key")),
      label: String(formData.get("label")),
      fieldType: String(formData.get("fieldType") ?? "text"),
      required: formData.get("required") === "on",
      options: String(formData.get("options") ?? "") || null,
    },
  });
  revalidatePath("/admin/categories");
}

export async function adminModerateProduct(id: string, status: string, reason?: string) {
  const user = await requirePermission("admin.product.moderate");
  await prisma.product.update({
    where: { id },
    data: { status, rejectionReason: reason, publishedAt: status === "PUBLISHED" ? new Date() : undefined },
  });
  const product = await prisma.product.findUnique({ where: { id }, include: { vendor: true } });
  if (product) {
    await notify(
      product.vendor.userId,
      `Product ${status.toLowerCase()}`,
      reason || `${product.name} is now ${status}.`,
      "/vendor/products",
    );
  }
  await audit({ actorId: user.id, action: "product.moderate", entity: "Product", entityId: id, metadata: { status, reason } });
  revalidatePath("/admin/products");
}

export async function adminSetUserStatus(userId: string, status: string, reason: string) {
  const actor = await requirePermission("admin.customer.manage");
  if (status !== "ACTIVE") await assertNotLastAdmin(userId, "suspend this administrator");
  await prisma.user.update({ where: { id: userId }, data: { status } });
  await prisma.accountRestriction.create({
    data: { userId, actorId: actor.id, kind: status, reason, active: status !== "ACTIVE" },
  });
  await audit({ actorId: actor.id, action: "user.status", entity: "User", entityId: userId, metadata: { status, reason } });
  revalidatePath("/admin/customers");
}

export async function adminSetVendorFlags(formData: FormData) {
  const actor = await requirePermission("admin.vendor.manage");
  const id = String(formData.get("id"));
  await prisma.vendorProfile.update({
    where: { id },
    data: {
      status: String(formData.get("status") ?? "ACTIVE"),
      kycStatus: String(formData.get("kycStatus") ?? "UNVERIFIED"),
      canPublish: formData.get("canPublish") === "on",
      canAcceptOrders: formData.get("canAcceptOrders") === "on",
      canEditListings: formData.get("canEditListings") === "on",
      canUsePromotions: formData.get("canUsePromotions") === "on",
      canRequestPayouts: formData.get("canRequestPayouts") === "on",
      payoutEligible: formData.get("payoutEligible") === "on",
    },
  });
  await audit({ actorId: actor.id, action: "vendor.flags", entity: "VendorProfile", entityId: id });
  revalidatePath("/admin/vendors");
}

export async function adminSavePlan(formData: FormData) {
  await requirePermission("admin.subscription.manage");
  const id = String(formData.get("id") ?? "");
  const data = {
    name: String(formData.get("name")),
    pricePence: parseGbpToPence(String(formData.get("price") ?? "0")),
    commissionBps: Number(formData.get("commissionBps") ?? 300),
    maxActiveProducts: String(formData.get("maxActiveProducts") ?? "")
      ? Number(formData.get("maxActiveProducts"))
      : null,
    openForSignup: formData.get("openForSignup") === "on",
    autoRenew: formData.get("autoRenew") === "on",
  };
  if (id) await prisma.subscriptionPlan.update({ where: { id }, data });
  revalidatePath("/admin/plans");
}

export async function adminCreatePlan(formData: FormData) {
  await requirePermission("admin.subscription.manage");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Give the plan a name." };
  const interval = String(formData.get("interval") ?? "MONTH");
  if (!["NONE", "MONTH", "SIX_MONTH", "YEAR"].includes(interval)) return { error: "Choose a billing interval." };
  const key = slugify(name) || `plan-${Date.now()}`;
  const taken = await prisma.subscriptionPlan.findUnique({ where: { key } });
  if (taken) return { error: "A plan with that name already exists." };
  const sortOrder = (await prisma.subscriptionPlan.count()) + 1;
  await prisma.subscriptionPlan.create({
    data: {
      key,
      name,
      interval,
      pricePence: parseGbpToPence(String(formData.get("price") ?? "0")),
      commissionBps: Number(formData.get("commissionBps") ?? 300),
      maxActiveProducts: String(formData.get("maxActiveProducts") ?? "")
        ? Number(formData.get("maxActiveProducts"))
        : null,
      openForSignup: true,
      autoRenew: interval === "MONTH",
      sortOrder,
    },
  });
  revalidatePath("/admin/plans");
  revalidatePath("/vendor/subscription");
}

export async function adminDeletePlan(formData: FormData) {
  await requirePermission("admin.subscription.manage");
  const id = String(formData.get("id") ?? "");
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) return { error: "Plan not found." };
  if (plan.key === "free") return { error: "The Free plan stays available so vendors can downgrade." };
  const inUse = await prisma.vendorSubscription.count({
    where: { planId: id, status: { in: ["ACTIVE", "GRACE"] } },
  });
  if (inUse > 0) return { error: "Move vendors off this plan before removing it." };
  try {
    await prisma.subscriptionPlan.delete({ where: { id } });
  } catch (error) {
    console.error("[plans] delete failed", error instanceof Error ? error.message : error);
    return {
      error: "This plan has past subscriptions, so it stays on record. Turn off Open for vendors to stop new sign-ups.",
    };
  }
  revalidatePath("/admin/plans");
  revalidatePath("/vendor/subscription");
}

export async function adminSaveReminder(formData: FormData) {
  await requirePermission("admin.subscription.manage");
  await prisma.reminderRule.create({
    data: {
      name: String(formData.get("name")),
      eventType: String(formData.get("eventType")),
      offsetDays: Number(formData.get("offsetDays") ?? 0),
      enabled: true,
    },
  });
  revalidatePath("/admin/reminders");
}

export async function adminReviewPayout(id: string, status: string, reason?: string) {
  const user = await requirePermission("admin.finance.manage");
  await completePayout(id, status, user.id, reason);
  await audit({ actorId: user.id, action: "payout.review", entity: "WithdrawalRequest", entityId: id, metadata: { status } });
  revalidatePath("/admin/payouts");
}

export async function adminSaveCms(formData: FormData) {
  await requirePermission("admin.cms.manage");
  const slug = String(formData.get("slug"));
  await prisma.cmsPage.upsert({
    where: { slug },
    update: {
      title: String(formData.get("title")),
      body: String(formData.get("body")),
      status: "PUBLISHED",
    },
    create: {
      slug,
      title: String(formData.get("title")),
      body: String(formData.get("body")),
      status: "PUBLISHED",
    },
  });
  revalidatePath("/admin/cms");
}

export async function adminSaveCoupon(formData: FormData) {
  await requirePermission("admin.promotion.manage");
  await prisma.coupon.create({
    data: {
      code: String(formData.get("code")).toUpperCase(),
      type: String(formData.get("type") ?? "PERCENT"),
      value: Number(formData.get("value") ?? 0),
      minSubtotalPence: parseGbpToPence(String(formData.get("minSubtotal") ?? "0")),
      enabled: true,
    },
  });
  revalidatePath("/admin/promotions");
}

export async function adminToggleRolePermission(roleId: string, permissionId: string, enabled: boolean) {
  const actor = await requirePermission("admin.permission.manage");
  if (enabled) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  } else {
    await prisma.rolePermission.delete({ where: { roleId_permissionId: { roleId, permissionId } } });
  }
  await prisma.permissionChangeLog.create({
    data: {
      actorId: actor.id,
      targetId: roleId,
      summary: `${enabled ? "Granted" : "Revoked"} permission ${permissionId}`,
    },
  });
  revalidatePath("/admin/permissions");
}

export async function adminReplyTicket(formData: FormData) {
  const user = await requirePermission("admin.support.manage");
  const ticketId = String(formData.get("ticketId"));
  await prisma.ticketMessage.create({
    data: {
      ticketId,
      authorId: user.id,
      body: String(formData.get("body") ?? ""),
      internal: formData.get("internal") === "on",
    },
  });
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "PENDING" } });
  revalidatePath("/admin/support");
}

export async function subscribeNewsletter(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const audience = String(formData.get("audience") ?? "").toUpperCase();
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (audience !== "MALE" && audience !== "FEMALE") return { error: "Choose Male or Female." };
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { audience },
    create: { email, audience },
  });
  return { ok: true };
}

export async function markNotificationsRead() {
  const user = await getSessionUser();
  if (!user) return;
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/account/notifications");
}
