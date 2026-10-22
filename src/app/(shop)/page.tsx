import { prisma } from "@/lib/db";
import { HomeHero } from "@/components/home-hero";
import { CategoryCarousel } from "@/components/category-carousel";
import { ProductShelves } from "@/components/product-shelf";
import { getSetting } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";
import { staticCategories } from "@/lib/category-display";
import { demoProducts } from "@/lib/demo-catalog";
import { dbErrorText, ensureDemoCatalog } from "@/lib/ensure-catalog";

const FALLBACK_SLIDES = [
  {
    kicker: "Exclusive offer 10% off this week",
    title: "Shop African pantry staples",
    body: "Starting from £1.99",
    href: "/c/african-food-and-groceries",
    image: "/slides/slide-market.jpg",
    cta: "Shop now",
  },
  {
    kicker: "New season drops",
    title: "Fashion and cultural wear",
    body: "Ankara, kente-inspired pieces and everyday style.",
    href: "/c/fashion-and-clothing",
    image: "/slides/slide-fashion.jpg",
    cta: "Shop now",
  },
  {
    kicker: "Beauty edit",
    title: "Shea, oils and haircare",
    body: "From African makers, delivered in the UK.",
    href: "/c/beauty-and-skincare",
    image: "/slides/slide-beauty.jpg",
    cta: "Shop now",
  },
];

function HomeFallback() {
  const categories = staticCategories();
  const products = demoProducts().slice(0, 10);
  return (
    <main>
      <HomeHero slides={FALLBACK_SLIDES} categories={categories} />
      <CategoryCarousel
        items={categories.map((category) => ({ name: category.name, slug: category.slug, image: category.image }))}
      />
      <ProductShelves products={products} />
    </main>
  );
}

async function HomeCatalog() {
  const user = await getSessionUser();
  const [tagline, banners, categories, products, wished] = await Promise.all([
    getSetting("tagline"),
    prisma.cmsBanner.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({
      where: { enabled: true, parentId: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        vendor: true,
        variants: true,
        attributes: true,
        category: { select: { name: true, slug: true } },
        reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 80,
    }),
    user
      ? prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);

  const wishedIds = new Set(wished.map((item) => item.productId));
  const slideCopy = [
    { kicker: "Exclusive offer 10% off this week", body: "Starting from £1.99" },
    { kicker: "New season drops", body: "Ankara, kente-inspired pieces and everyday style." },
    { kicker: "Beauty edit", body: "Shea, oils and haircare from African makers." },
  ];
  const slides = banners
    .filter((banner) => banner.image)
    .map((banner, index) => ({
      title: banner.title,
      href: banner.href || "/products",
      image: banner.image as string,
      body: slideCopy[index]?.body ?? tagline,
      kicker: slideCopy[index]?.kicker ?? "Venzorah marketplace",
      cta: "Shop now",
    }));

  const categoryTiles = categories.length ? categories : staticCategories();
  const catalog = products.length
    ? products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        pricePence: product.pricePence,
        salePricePence: product.salePricePence,
        createdAt: product.createdAt,
        featured: product.featured,
        images: product.images,
        vendor: { storeName: product.vendor.storeName, storeSlug: product.vendor.storeSlug },
        variants: product.variants,
        attributes: product.attributes,
        reviews: product.reviews,
        categoryName: product.category.name,
        categorySlug: product.category.slug,
      }))
    : demoProducts();

  return (
    <main>
      <HomeHero slides={slides.length ? slides : FALLBACK_SLIDES} categories={categoryTiles} />

      <CategoryCarousel
        items={categoryTiles.map((category) => ({
          name: category.name,
          slug: category.slug,
          image: category.image,
        }))}
      />

      <ProductShelves products={catalog} wishedIds={wishedIds} />
    </main>
  );
}

export default async function HomePage() {
  const ready = await ensureDemoCatalog();
  if (!ready) return <HomeFallback />;
  try {
    return await HomeCatalog();
  } catch (error) {
    console.error("Homepage skipped the database:", dbErrorText(error));
    return <HomeFallback />;
  }
}
