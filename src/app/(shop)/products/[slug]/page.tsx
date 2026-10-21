import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatGbp } from "@/lib/money";
import { toggleWishlist } from "@/app/actions/marketplace";
import { Button, Badge } from "@/components/ui";
import { AddToCartButton } from "@/components/product-actions";
import { ProductGallery } from "@/components/product-gallery";
import { ShareButton } from "@/components/share-button";
import { demoProductBySlug, type DemoProduct } from "@/lib/demo-catalog";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        vendor: true,
        category: true,
        variants: true,
        attributes: true,
        reviews: { include: { user: true }, where: { status: "PUBLISHED" } },
      },
    });
    if (product?.status === "PUBLISHED") {
      const price = product.salePricePence ?? product.pricePence;
      return (
        <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} />
          <div>
            <Badge>{product.category.name}</Badge>
            <h1 className="mt-3 text-3xl font-bold text-ink">{product.name}</h1>
            <p className="mt-1 text-sm text-muted">Sold by {product.vendor.storeName}</p>
            <p className="mt-4 text-2xl font-extrabold">{formatGbp(price)}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{product.description}</p>
            {product.attributes.length ? (
              <dl className="mt-4 grid gap-2 text-sm">
                {product.attributes.map((attribute) => (
                  <div key={attribute.id} className="flex justify-between gap-4 border-b border-border py-1">
                    <dt className="text-muted">{attribute.key}</dt>
                    <dd>{attribute.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="mt-6">
              <AddToCartButton
                productId={product.id}
                variantId={product.variants[0]?.id}
                name={product.name}
              />
            </div>
            <div className="mt-3">
              <ShareButton title={product.name} text={`Shop ${product.name} on Venzorah`} />
            </div>
            <form
              action={async () => {
                "use server";
                await toggleWishlist(product.id);
              }}
            >
              <Button type="submit" variant="ghost">
                Save to wishlist
              </Button>
            </form>
            <section className="mt-10">
              <h2 className="font-bold">Reviews</h2>
              <div className="mt-3 grid gap-3">
                {product.reviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-border p-3">
                    <p className="font-semibold">
                      {review.rating}/5 · {review.user.name}
                    </p>
                    <p className="text-sm">{review.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      );
    }
    if (product) notFound();
  } catch (error) {
    console.error("Product page skipped the database:", error instanceof Error ? error.message : error);
  }

  const demo = demoProductBySlug(slug);
  if (!demo) notFound();
  return <DemoProductPage product={demo} />;
}

function DemoProductPage({ product }: { product: DemoProduct }) {
  const price = product.salePricePence ?? product.pricePence;
  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2">
      <ProductGallery images={product.images} name={product.name} />
      <div>
        <Badge>{product.categoryName}</Badge>
        <h1 className="mt-3 text-3xl font-bold text-ink">{product.name}</h1>
        <p className="mt-1 text-sm text-muted">Sold by {product.vendor.storeName}</p>
        <p className="mt-4 text-2xl font-extrabold">{formatGbp(price)}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{product.description}</p>
        {product.attributes?.length ? (
          <dl className="mt-4 grid gap-2 text-sm">
            {product.attributes.map((attribute) => (
              <div key={attribute.key} className="flex justify-between gap-4 border-b border-border py-1">
                <dt className="text-muted">{attribute.key}</dt>
                <dd>{attribute.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="mt-3">
          <ShareButton title={product.name} text={`Shop ${product.name} on Venzorah`} />
        </div>
        {product.reviews?.length ? (
          <p className="mt-6 text-sm text-muted">
            {product.reviews.length} verified review{product.reviews.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </main>
  );
}
