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
      update: { featured: Boolean(cat.featured), sortOrder: i, image: CATEGORY_IMAGES[cat.name] },
      create: {
        name: cat.name,
        slug: slugify(cat.name),
        featured: Boolean(cat.featured),
        sortOrder: i,
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

  const password = await bcrypt.hash("VenzorahAdmin!23", 12);
  const vendorPass = await bcrypt.hash("VenzorahVendor!23", 12);
  const customerPass = await bcrypt.hash("VenzorahCustomer!23", 12);

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: ROLE_KEYS.ADMIN } });
  const customerRole = await prisma.role.findUniqueOrThrow({ where: { key: ROLE_KEYS.CUSTOMER } });
  const vendorRole = await prisma.role.findUniqueOrThrow({ where: { key: ROLE_KEYS.VENDOR } });
  const verifiedRole = await prisma.role.findUniqueOrThrow({ where: { key: ROLE_KEYS.VERIFIED_VENDOR } });
  const free = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "free" } });
  const monthly = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: "monthly" } });
  const food = await prisma.category.findUniqueOrThrow({ where: { slug: "african-food-and-groceries" } });
  const fashion = await prisma.category.findUniqueOrThrow({ where: { slug: "fashion-and-clothing" } });

  const admin = await prisma.user.upsert({
    where: { email: "admin@venzorah.com" },
    update: {},
    create: {
      email: "admin@venzorah.com",
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

  const v1 = await prisma.vendorProfile.findUniqueOrThrow({ where: { userId: vendorUser.id } });
  const v2 = await prisma.vendorProfile.findUniqueOrThrow({ where: { userId: vendor2.id } });
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

  console.info("Seeded Venzorah demo data.");
  console.info("Admin    admin@venzorah.com / VenzorahAdmin!23");
  console.info("Customer customer@venzorah.com / VenzorahCustomer!23");
  console.info("Vendors  vendor@venzorah.com and vendor2@venzorah.com / VenzorahVendor!23");
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
