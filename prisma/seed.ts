import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  ADMIN_PERMISSIONS,
  CUSTOMER_PERMISSIONS,
  PERMISSIONS,
  ROLE_KEYS,
  STAFF_PRESETS,
  VENDOR_PERMISSIONS,
} from "../src/lib/permissions";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

const CATEGORY_IMAGES: Record<string, string> = {
  "African Food and Groceries": "/categories/cat-food.jpg",
  "Fashion and Clothing": "/categories/cat-fashion.jpg",
  "Traditional and Cultural Wear": "/categories/cat-traditional.jpg",
  Footwear: "/categories/cat-footwear.jpg",
  "Bags and Accessories": "/categories/cat-bags.jpg",
  "Beauty and Skincare": "/categories/cat-beauty.jpg",
  "Hair Products and Hair Accessories": "/categories/cat-hair.jpg",
  Jewellery: "/categories/cat-jewellery.jpg",
  "Home and Living": "/categories/cat-home.jpg",
  "Furniture and Furnishings": "/categories/cat-home.jpg",
  "Art and Handmade Crafts": "/categories/cat-art.jpg",
  "African Artwork and Decor": "/categories/cat-art.jpg",
  "Books and Educational Materials": "/categories/cat-home.jpg",
  "Music and Entertainment Products": "/categories/cat-music.jpg",
  "Electronics and Technology Accessories": "/categories/cat-jewellery.jpg",
  "Health and Personal Care Products": "/categories/cat-beauty.jpg",
  "Agricultural Products and Supplies": "/categories/cat-food.jpg",
  "Kitchenware and Household Goods": "/categories/cat-kitchen.jpg",
  "Baby and Children's Products": "/categories/cat-home.jpg",
  "Sports and Fitness": "/categories/cat-footwear.jpg",
  "Gifts and Souvenirs": "/categories/cat-bags.jpg",
  "Business and Office Supplies": "/categories/cat-home.jpg",
  "Other Approved African Products": "/categories/cat-food.jpg",
};

const CATEGORIES: {
  name: string;
  featured?: boolean;
  attrs?: { key: string; label: string; required?: boolean }[];
}[] = [
  {
    name: "African Food and Groceries",
    featured: true,
    attrs: [
      { key: "ingredients", label: "Ingredients", required: true },
      { key: "allergens", label: "Allergens" },
      { key: "net_weight", label: "Net weight" },
      { key: "storage", label: "Storage instructions" },
    ],
  },
  {
    name: "Fashion and Clothing",
    featured: true,
    attrs: [
      { key: "size", label: "Size", required: true },
      { key: "colour", label: "Colour" },
      { key: "material", label: "Material" },
      { key: "fit", label: "Gender / fit" },
    ],
  },
  { name: "Traditional and Cultural Wear", featured: true, attrs: [{ key: "material", label: "Material" }] },
  { name: "Footwear", attrs: [{ key: "size", label: "UK size", required: true }] },
  { name: "Bags and Accessories" },
  {
    name: "Beauty and Skincare",
    featured: true,
    attrs: [
      { key: "ingredients", label: "Ingredients" },
      { key: "volume", label: "Volume" },
      { key: "usage", label: "Usage instructions" },
    ],
  },
  { name: "Hair Products and Hair Accessories" },
  { name: "Jewellery" },
  { name: "Home and Living", featured: true },
  {
    name: "Furniture and Furnishings",
    attrs: [
      { key: "dimensions", label: "Dimensions" },
      { key: "materials", label: "Materials" },
      { key: "assembly", label: "Assembly" },
    ],
  },
  { name: "Art and Handmade Crafts", featured: true, attrs: [{ key: "artist", label: "Artist or maker" }] },
  { name: "African Artwork and Decor", attrs: [{ key: "origin", label: "Origin" }] },
  {
    name: "Books and Educational Materials",
    attrs: [
      { key: "author", label: "Author" },
      { key: "isbn", label: "ISBN" },
      { key: "language", label: "Language" },
    ],
  },
  { name: "Music and Entertainment Products" },
  {
    name: "Electronics and Technology Accessories",
    attrs: [
      { key: "brand", label: "Brand" },
      { key: "model", label: "Model" },
      { key: "warranty", label: "Warranty" },
    ],
  },
  { name: "Health and Personal Care Products" },
  { name: "Agricultural Products and Supplies" },
  { name: "Kitchenware and Household Goods" },
  { name: "Baby and Children's Products" },
  { name: "Sports and Fitness" },
  { name: "Gifts and Souvenirs" },
  { name: "Business and Office Supplies" },
  { name: "Other Approved African Products" },
];

const CATALOG_LISTINGS: { category: string; name: string; price: number; description: string }[] = [
  { category: "African Food and Groceries", name: "Smoked crayfish 100g", price: 495, description: "Sun-dried crayfish for soups and stews." },
  { category: "Fashion and Clothing", name: "Dashiki cotton shirt", price: 2800, description: "Relaxed-fit embroidered dashiki for everyday wear." },
  { category: "Traditional and Cultural Wear", name: "Aso-oke headwrap", price: 1850, description: "Woven aso-oke gele ready for ceremonies." },
  { category: "Footwear", name: "Leather sandals UK 7", price: 3200, description: "Hand-finished leather sandals in UK size 7." },
  { category: "Bags and Accessories", name: "Kente tote bag", price: 1650, description: "Sturdy tote with kente-inspired panels." },
  { category: "Beauty and Skincare", name: "Raw shea butter 250ml", price: 899, description: "Unrefined shea butter for skin and hair." },
  { category: "Hair Products and Hair Accessories", name: "Black soap shampoo bar", price: 650, description: "African black soap bar for scalp and coils." },
  { category: "Jewellery", name: "Beaded statement necklace", price: 2400, description: "Hand-strung beads in gold and navy." },
  { category: "Home and Living", name: "Wax-print cushion cover", price: 1295, description: "Cotton cushion cover in Ankara print." },
  { category: "Furniture and Furnishings", name: "Folding okrika stool", price: 4500, description: "Compact wooden stool with carved sides." },
  { category: "Art and Handmade Crafts", name: "Calabash bead bowl", price: 2100, description: "Decorated calabash bowl from a UK-based maker." },
  { category: "African Artwork and Decor", name: "Adinkra wall print", price: 1750, description: "Framed adinkra symbol print for home walls." },
  { category: "Books and Educational Materials", name: "West African recipes handbook", price: 1299, description: "Illustrated cookbook for UK kitchens." },
  { category: "Music and Entertainment Products", name: "Djembe practice pad", price: 1995, description: "Quiet practice pad for djembe rhythms." },
  { category: "Electronics and Technology Accessories", name: "Ankara laptop sleeve 13in", price: 1895, description: "Padded sleeve for 13-inch laptops." },
  { category: "Health and Personal Care Products", name: "Neem toothpaste 100ml", price: 495, description: "Herbal neem toothpaste for daily care." },
  { category: "Agricultural Products and Supplies", name: "Heirloom okra seeds pack", price: 395, description: "Okra seeds for UK garden growers." },
  { category: "Kitchenware and Household Goods", name: "Wooden mortar and pestle", price: 2750, description: "Hardwood mortar for pounding spices." },
  { category: "Baby and Children's Products", name: "Ankara baby bib set", price: 895, description: "Two cotton bibs in mixed African prints." },
  { category: "Sports and Fitness", name: "Resistance band set", price: 1195, description: "Three bands for home workouts." },
  { category: "Gifts and Souvenirs", name: "Ghana flag enamel pin", price: 450, description: "Gift pin with a UK-ready backing card." },
  { category: "Business and Office Supplies", name: "Ankara A5 notebook", price: 795, description: "Lined notebook with wax-print cover." },
  { category: "Other Approved African Products", name: "Multi-purpose shea balm", price: 695, description: "Travel tin of shea balm for lips and hands." },
];

async function main() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: perm,
      create: perm,
    });
  }

  const roleDefs = [
    { key: ROLE_KEYS.CUSTOMER, name: "Customer", perms: CUSTOMER_PERMISSIONS },
    { key: ROLE_KEYS.VENDOR, name: "Vendor", perms: [...CUSTOMER_PERMISSIONS, ...VENDOR_PERMISSIONS] },
    { key: ROLE_KEYS.VERIFIED_VENDOR, name: "Verified vendor", perms: [...CUSTOMER_PERMISSIONS, ...VENDOR_PERMISSIONS] },
    { key: ROLE_KEYS.ADMIN, name: "Administrator", perms: ADMIN_PERMISSIONS },
    { key: ROLE_KEYS.SUPPORT_AGENT, name: "Support agent", perms: STAFF_PRESETS[ROLE_KEYS.SUPPORT_AGENT] },
    { key: ROLE_KEYS.PRODUCT_MODERATOR, name: "Product moderator", perms: STAFF_PRESETS[ROLE_KEYS.PRODUCT_MODERATOR] },
    { key: ROLE_KEYS.KYC_OFFICER, name: "KYC officer", perms: STAFF_PRESETS[ROLE_KEYS.KYC_OFFICER] },
    { key: ROLE_KEYS.FINANCE_OFFICER, name: "Finance officer", perms: STAFF_PRESETS[ROLE_KEYS.FINANCE_OFFICER] },
    { key: ROLE_KEYS.DISPUTE_MANAGER, name: "Order and dispute manager", perms: STAFF_PRESETS[ROLE_KEYS.DISPUTE_MANAGER] },
  ];

  for (const def of roleDefs) {
    const role = await prisma.role.upsert({
      where: { key: def.key },
      update: { name: def.name, system: true },
      create: { key: def.key, name: def.name, system: true },
    });
    for (const key of def.perms) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  const plans = [
    { key: "free", name: "Free", interval: "NONE", pricePence: 0, commissionBps: 500, maxActiveProducts: 5, sortOrder: 0 },
    { key: "monthly", name: "Monthly", interval: "MONTH", pricePence: 3500, commissionBps: 300, maxActiveProducts: null, sortOrder: 1 },
    { key: "six_month", name: "6-Month", interval: "SIX_MONTH", pricePence: 18000, commissionBps: 300, maxActiveProducts: null, sortOrder: 2, autoRenew: false },
    { key: "annual", name: "Annual", interval: "YEAR", pricePence: 33600, commissionBps: 300, maxActiveProducts: null, sortOrder: 3, autoRenew: false },
  ];
  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { key: plan.key },
      update: { name: plan.name, pricePence: plan.pricePence, commissionBps: plan.commissionBps, maxActiveProducts: plan.maxActiveProducts },
      create: plan,
    });
  }

  const reminders = [
    { name: "Four weeks before renewal", eventType: "RENEWAL", offsetDays: -28 },
    { name: "Two weeks before renewal", eventType: "RENEWAL", offsetDays: -14 },
    { name: "One week before renewal", eventType: "RENEWAL", offsetDays: -7 },
    { name: "Three days before renewal", eventType: "RENEWAL", offsetDays: -3 },
    { name: "Renewal day", eventType: "RENEWAL", offsetDays: 0 },
    { name: "Failed payment", eventType: "FAILED_PAYMENT", offsetDays: 0 },
  ];
  if ((await prisma.reminderRule.count()) === 0) {
    await prisma.reminderRule.createMany({ data: reminders });
  }

  await prisma.notificationTemplate.upsert({
    where: { key: "verify-email" },
    update: {},
    create: {
      key: "verify-email",
      name: "Verify email",
      subject: "Verify your Venzorah email",
      body: "Hello {{name}}, verify your email: {{link}}",
    },
  });
  await prisma.notificationTemplate.upsert({
    where: { key: "reset-password" },
    update: {},
    create: {
      key: "reset-password",
      name: "Reset password",
      subject: "Reset your Venzorah password",
      body: "Hello {{name}}, reset your password: {{link}}",
    },
  });

  let i = 0;
  for (const cat of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {
        featured: Boolean(cat.featured),
        sortOrder: i,
        image: CATEGORY_IMAGES[cat.name],
        enabled: true,
      },
      create: {
        name: cat.name,
        slug: slugify(cat.name),
        featured: Boolean(cat.featured),
        sortOrder: i,
        enabled: true,
        image: CATEGORY_IMAGES[cat.name],
        description: `Shop ${cat.name} from African vendors on Venzorah.`,
      },
    });
    if (cat.attrs) {
      for (const attr of cat.attrs) {
        const exists = await prisma.categoryAttribute.findFirst({
          where: { categoryId: row.id, key: attr.key },
        });
        if (!exists) {
          await prisma.categoryAttribute.create({
            data: { categoryId: row.id, key: attr.key, label: attr.label, required: Boolean(attr.required) },
          });
        }
      }
    }
    i += 1;
  }

  const uk = await prisma.shippingZone.upsert({
    where: { id: "seed-uk" },
    update: {},
    create: {
      id: "seed-uk",
      name: "United Kingdom",
      country: "GB",
      postcodePrefixes: "GB,*",
    },
  });

  const pages = [
    { slug: "about", title: "About Venzorah", body: "Venzorah is a UK-first marketplace for African products across food, fashion, beauty, art, home and more." },
    { slug: "terms", title: "Terms and conditions", body: "These terms are placeholders pending legal review." },
    { slug: "privacy", title: "Privacy policy", body: "We process personal data to operate the marketplace. Export and deletion requests are handled from the customer dashboard." },
    { slug: "returns", title: "Returns policy", body: "Customers may request returns within the configured window. Disputes place a hold on related vendor earnings only." },
    { slug: "shipping", title: "Shipping policy", body: "Each vendor configures zones and rates. Checkout rejects destinations that cannot be served." },
    { slug: "subscription-terms", title: "Subscription terms", body: "Monthly plans renew automatically when authorised. Six-month and annual plans follow administrator-configured renewal rules." },
    { slug: "contact", title: "Contact", body: "Use the in-app support form or email support@venzorah.local in development." },
    { slug: "faq", title: "FAQ", body: "How do I become a vendor? Register with a UK business location, complete KYC, then list products subject to plan limits." },
  ];
  for (const page of pages) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, body: page.body },
      create: page,
    });
  }

  const bannerSlides = [
    {
      id: "seed-banner-food",
      title: "Shop African pantry staples",
      href: "/c/african-food-and-groceries",
      image: "/slides/slide-market.jpg",
      sortOrder: 0,
    },
    {
      id: "seed-banner-fashion",
      title: "Order from our cultural fashion edit",
      href: "/c/fashion-and-clothing",
      image: "/slides/slide-fashion.jpg",
      sortOrder: 1,
    },
    {
      id: "seed-banner-beauty",
      title: "Shea, oils and haircare",
      href: "/c/beauty-and-skincare",
      image: "/slides/slide-beauty.jpg",
      sortOrder: 2,
    },
  ];
  for (const banner of bannerSlides) {
    await prisma.cmsBanner.upsert({
      where: { id: banner.id },
      update: { title: banner.title, href: banner.href, image: banner.image, enabled: true, sortOrder: banner.sortOrder },
      create: { ...banner, enabled: true, placement: "HOME_HERO" },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENT", value: 1000, minSubtotalPence: 2000, enabled: true },
  });

  const password = await bcrypt.hash("Utomobong#@01", 12);
  const vendorPass = await bcrypt.hash("VenzorahVendor!23", 12);
  const customerPass = await bcrypt.hash("VenzorahCustomer!23", 12);
  const adminEmail = "venzorah.app@gmail.com";

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: ROLE_KEYS.ADMIN } });
  const customerRole = await prisma.role.findUniqueOrThrow({ where: { key: ROLE_KEYS.CUSTOMER } });
  const vendorRole = await prisma.role.findUniqueOrThrow({ where: { key: ROLE_KEYS.VENDOR } });
  const verifiedRole = await prisma.role.findUniqueOrThrow({ where: { key: ROLE_KEYS.VERIFIED_VENDOR } });
  const free = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "free" } });
  const monthly = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "monthly" } });
  const annual = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "annual" } });
  const food = await prisma.category.findUniqueOrThrow({ where: { slug: "african-food-and-groceries" } });
  const fashion = await prisma.category.findUniqueOrThrow({ where: { slug: "fashion-and-clothing" } });

  const legacyAdmin = await prisma.user.findUnique({ where: { email: "admin@venzorah.com" } });
  if (legacyAdmin && legacyAdmin.email !== adminEmail) {
    const taken = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!taken) {
      await prisma.user.update({
        where: { id: legacyAdmin.id },
        data: { email: adminEmail, passwordHash: password, name: "Venzorah Admin", emailVerifiedAt: new Date() },
      });
    }
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: password, name: "Venzorah Admin", emailVerifiedAt: new Date() },
    create: {
      email: adminEmail,
      name: "Venzorah Admin",
      passwordHash: password,
      emailVerifiedAt: new Date(),
      customer: { create: {} },
      roles: { create: { roleId: adminRole.id } },
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@venzorah.com" },
    update: {},
    create: {
      email: "customer@venzorah.com",
      name: "Ada Customer",
      passwordHash: customerPass,
      emailVerifiedAt: new Date(),
      customer: { create: {} },
      roles: { create: { roleId: customerRole.id } },
      addresses: {
        create: {
          label: "Home",
          line1: "10 Market Street",
          city: "London",
          postcode: "E1 6AN",
          isDefault: true,
        },
      },
    },
  });

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const longEnd = new Date();
  longEnd.setFullYear(longEnd.getFullYear() + 10);

  const vendorUser = await prisma.user.upsert({
    where: { email: "vendor@venzorah.com" },
    update: {},
    create: {
      email: "vendor@venzorah.com",
      name: "Amina Vendor",
      passwordHash: vendorPass,
      emailVerifiedAt: new Date(),
      customer: { create: {} },
      roles: { create: [{ roleId: customerRole.id }, { roleId: vendorRole.id }, { roleId: verifiedRole.id }] },
      vendor: {
        create: {
          storeName: "Amina's Pantry",
          storeSlug: "aminas-pantry",
          description: "West African groceries shipped across the UK.",
          kycStatus: "APPROVED",
          payoutEligible: true,
          city: "Manchester",
          postcode: "M1 1AE",
          subscriptions: {
            create: { planId: free.id, status: "ACTIVE", currentPeriodEnd: longEnd, provider: "none" },
          },
        },
      },
    },
  });

  const vendor2 = await prisma.user.upsert({
    where: { email: "vendor2@venzorah.com" },
    update: {},
    create: {
      email: "vendor2@venzorah.com",
      name: "Kwame Vendor",
      passwordHash: vendorPass,
      emailVerifiedAt: new Date(),
      customer: { create: {} },
      roles: { create: [{ roleId: customerRole.id }, { roleId: vendorRole.id }, { roleId: verifiedRole.id }] },
      vendor: {
        create: {
          storeName: "Lagos Threads",
          storeSlug: "lagos-threads",
          description: "Ankara fashion and accessories.",
          kycStatus: "APPROVED",
          payoutEligible: true,
          subscriptions: {
            create: { planId: monthly.id, status: "ACTIVE", currentPeriodEnd: periodEnd, provider: "sandbox" },
          },
        },
      },
    },
  });

  async function ensureRole(userId: string, roleId: string) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  await ensureRole(admin.id, adminRole.id);
  await ensureRole(admin.id, customerRole.id);
  await ensureRole(admin.id, vendorRole.id);
  await ensureRole(admin.id, verifiedRole.id);

  const official = await prisma.vendorProfile.upsert({
    where: { userId: admin.id },
    update: {
      storeName: "Venzorah Official",
      kycStatus: "APPROVED",
      payoutEligible: true,
      canPublish: true,
      sellerType: "BUSINESS",
      status: "ACTIVE",
    },
    create: {
      userId: admin.id,
      storeName: "Venzorah Official",
      storeSlug: "venzorah-official",
      businessName: "Venzorah Ltd",
      description: "Official Venzorah house listings across every category.",
      kycStatus: "APPROVED",
      payoutEligible: true,
      sellerType: "BUSINESS",
      city: "London",
      postcode: "EC1A 1BB",
      subscriptions: {
        create: { planId: annual.id, status: "ACTIVE", currentPeriodEnd: longEnd, provider: "none" },
      },
    },
  });
  if ((await prisma.vendorSubscription.count({ where: { vendorId: official.id } })) === 0) {
    await prisma.vendorSubscription.create({
      data: { vendorId: official.id, planId: annual.id, status: "ACTIVE", currentPeriodEnd: longEnd, provider: "none" },
    });
  }

  const houseUser = await prisma.user.upsert({
    where: { email: "house@venzorah.com" },
    update: {},
    create: {
      email: "house@venzorah.com",
      name: "Accra House",
      passwordHash: vendorPass,
      emailVerifiedAt: new Date(),
      customer: { create: {} },
      roles: { create: [{ roleId: customerRole.id }, { roleId: vendorRole.id }, { roleId: verifiedRole.id }] },
      vendor: {
        create: {
          storeName: "Accra House UK",
          storeSlug: "accra-house-uk",
          description: "A UK warehouse vendor listing African products in every Venzorah category.",
          kycStatus: "APPROVED",
          payoutEligible: true,
          sellerType: "BUSINESS",
          city: "Birmingham",
          postcode: "B1 1AA",
          subscriptions: {
            create: { planId: annual.id, status: "ACTIVE", currentPeriodEnd: longEnd, provider: "none" },
          },
        },
      },
    },
  });
  await ensureRole(houseUser.id, vendorRole.id);
  await ensureRole(houseUser.id, verifiedRole.id);

  const v1 = await prisma.vendorProfile.findUniqueOrThrow({ where: { userId: vendorUser.id } });
  const v2 = await prisma.vendorProfile.findUniqueOrThrow({ where: { userId: vendor2.id } });
  const house = await prisma.vendorProfile.findUniqueOrThrow({ where: { userId: houseUser.id } });
  await prisma.vendorProfile.update({
    where: { id: v1.id },
    data: { storeName: "Mama Ada's Pantry Ltd" },
  });
  await prisma.vendorProfile.update({
    where: { id: v2.id },
    data: { storeName: "Steel City African Store Ltd" },
  });

  await prisma.shippingMethod.upsert({
    where: { id: "seed-ship-1" },
    update: {},
    create: {
      id: "seed-ship-1",
      vendorId: v1.id,
      zoneId: uk.id,
      name: "Royal Mail Tracked 48",
      code: "STANDARD",
      carrier: "Royal Mail",
      pricePence: 495,
    },
  });
  await prisma.shippingMethod.upsert({
    where: { id: "seed-ship-2" },
    update: {},
    create: {
      id: "seed-ship-2",
      vendorId: v2.id,
      zoneId: uk.id,
      name: "UPS Standard",
      code: "STANDARD",
      carrier: "UPS",
      pricePence: 695,
    },
  });
  await prisma.shippingMethod.upsert({
    where: { id: "seed-ship-official" },
    update: { vendorId: official.id },
    create: {
      id: "seed-ship-official",
      vendorId: official.id,
      zoneId: uk.id,
      name: "Royal Mail Tracked 24",
      code: "EXPRESS",
      carrier: "Royal Mail",
      pricePence: 595,
    },
  });
  await prisma.shippingMethod.upsert({
    where: { id: "seed-ship-house" },
    update: { vendorId: house.id },
    create: {
      id: "seed-ship-house",
      vendorId: house.id,
      zoneId: uk.id,
      name: "Evri Standard",
      code: "STANDARD",
      carrier: "Evri",
      pricePence: 395,
    },
  });

  async function product(opts: {
    vendorId: string;
    categoryId: string;
    name: string;
    price: number;
    stock: number;
    description: string;
    image: string;
    featured?: boolean;
    pack?: string;
    ratings?: number[];
  }) {
    const slug = slugify(opts.name);
    const row = await prisma.product.upsert({
      where: { slug },
      update: {
        status: "PUBLISHED",
        pricePence: opts.price,
        featured: Boolean(opts.featured),
        name: opts.name,
        description: opts.description,
      },
      create: {
        vendorId: opts.vendorId,
        categoryId: opts.categoryId,
        name: opts.name,
        slug,
        description: opts.description,
        status: "PUBLISHED",
        featured: Boolean(opts.featured),
        publishedAt: new Date(),
        pricePence: opts.price,
        variants: {
          create: {
            name: "Default",
            stock: opts.stock,
            pricePence: opts.price,
            sku: slug.slice(0, 12).toUpperCase(),
          },
        },
      },
    });
    await prisma.productImage.deleteMany({ where: { productId: row.id } });
    await prisma.productImage.create({ data: { productId: row.id, url: opts.image, alt: opts.name } });
    if (opts.pack) {
      await prisma.productAttributeValue.upsert({
        where: { productId_key: { productId: row.id, key: "net_weight" } },
        update: { value: opts.pack },
        create: { productId: row.id, key: "net_weight", value: opts.pack },
      });
    }
    if (opts.ratings?.length && (await prisma.review.count({ where: { productId: row.id } })) === 0) {
      for (const rating of opts.ratings) {
        await prisma.review.create({
          data: {
            userId: rating % 2 === 0 ? admin.id : customer.id,
            productId: row.id,
            rating: 4 + (rating % 2),
            body: "Arrived fresh and packed well for UK delivery.",
            verified: true,
          },
        });
      }
    }
    return row;
  }

  await product({
    vendorId: v1.id,
    categoryId: food.id,
    name: "Red Palm Oil",
    price: 699,
    stock: 40,
    description: "Deep red palm oil for soups and stews.",
    image: "/products/palm-oil.jpg",
    pack: "1 litre",
    ratings: Array.from({ length: 12 }, (_, i) => i),
  });
  await product({
    vendorId: v1.id,
    categoryId: food.id,
    name: "Ijebu Garri (White)",
    price: 549,
    stock: 36,
    description: "Crisp white Ijebu garri for eba and snacks.",
    image: "/products/white-garri.jpg",
    pack: "1.5 kg",
    ratings: Array.from({ length: 10 }, (_, i) => i),
  });
  await product({
    vendorId: v2.id,
    categoryId: food.id,
    name: "Ground Egusi",
    price: 799,
    stock: 28,
    featured: true,
    description: "Finely ground egusi melon seeds.",
    image: "/products/ground-egusi.jpg",
    pack: "500 g",
    ratings: Array.from({ length: 14 }, (_, i) => i),
  });
  await product({
    vendorId: v2.id,
    categoryId: food.id,
    name: "Plantain Chips — Lightly Salted",
    price: 199,
    stock: 50,
    featured: true,
    description: "Crunchy lightly salted plantain chips.",
    image: "/products/plantain-chips.jpg",
    pack: "80 g bag",
    ratings: Array.from({ length: 8 }, (_, i) => i),
  });
  await product({
    vendorId: v2.id,
    categoryId: food.id,
    name: "Yellow Garri",
    price: 599,
    stock: 30,
    description: "Yellow garri for eba, soaking and recipes.",
    image: "/products/yellow-garri.jpg",
    pack: "1.5 kg",
    ratings: Array.from({ length: 9 }, (_, i) => i),
  });
  await prisma.product.updateMany({
    where: { slug: "palm-oil-500ml" },
    data: { status: "ARCHIVED" },
  });

  await product({
    vendorId: v1.id,
    categoryId: food.id,
    name: "Jollof rice spice mix 200g",
    price: 695,
    stock: 40,
    description: "Aromatic spice blend for homestyle jollof.",
    image: "/products/ground-egusi.jpg",
    pack: "200 g",
  });
  await product({
    vendorId: v2.id,
    categoryId: fashion.id,
    name: "Ankara wrap skirt",
    price: 4500,
    stock: 12,
    description: "Handmade wrap skirt in mixed Ankara print.",
    image: "/slides/slide-fashion.jpg",
  });
  await product({
    vendorId: v2.id,
    categoryId: fashion.id,
    name: "Kente-inspired scarf",
    price: 2200,
    stock: 18,
    description: "Lightweight scarf inspired by kente patterns.",
    image: "/slides/slide-fashion.jpg",
  });

  for (const [index, listing] of CATALOG_LISTINGS.entries()) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: slugify(listing.category) } });
    await product({
      vendorId: index % 2 === 0 ? house.id : official.id,
      categoryId: category.id,
      name: listing.name,
      price: listing.price,
      stock: 20 + index,
      description: listing.description,
      image: CATEGORY_IMAGES[listing.category] ?? "/slides/slide-market.jpg",
      featured: index < 6,
    });
  }

  console.info("Seeded Venzorah demo data.");
  console.info("Admin    venzorah.app@gmail.com / Utomobong#@01 (also vendor store Venzorah Official)");
  console.info("Customer customer@venzorah.com / VenzorahCustomer!23");
  console.info("Vendors  vendor@venzorah.com, vendor2@venzorah.com, house@venzorah.com / VenzorahVendor!23");
  void admin;
  void customer;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
