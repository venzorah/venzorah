import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { HomeHero } from "@/components/home-hero";
import { CategoryCarousel } from "@/components/category-carousel";
import { getSetting } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";
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
  return (
    <main>
      <HomeHero slides={FALLBACK_SLIDES} categories={[]} />
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Products</h2>
        <p className="mt-3 text-sm text-muted">The catalogue is not available yet. Reload in a moment.</p>
      </section>
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
        reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 10,
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

  return (
    <main>
      <HomeHero slides={slides.length ? slides : FALLBACK_SLIDES} categories={categories} />

      <CategoryCarousel
        items={categories.map((category) => ({ name: category.name, slug: category.slug, image: category.image }))}
      />

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Products</h2>
          <Link href="/products" className="text-sm text-muted hover:text-ink">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} wished={wishedIds.has(product.id)} />
          ))}
        </div>
      </section>
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
