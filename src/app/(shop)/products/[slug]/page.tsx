import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatGbp } from "@/lib/money";
import { addToCartFromForm, toggleWishlist } from "@/app/actions/marketplace";
import { Button, Badge } from "@/components/ui";
import { ActionForm } from "@/components/forms";
import { ShareButton } from "@/components/share-button";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
  if (!product || product.status !== "PUBLISHED") notFound();
  const price = product.salePricePence ?? product.pricePence;

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt={product.name} className="w-full object-cover" />
        ) : (
          <div className="flex aspect-square items-center justify-center text-muted">No image</div>
        )}
      </div>
      <div>
        <Badge>{product.category.name}</Badge>
        <h1 className="mt-3 text-3xl font-bold text-ink">{product.name}</h1>
        <p className="mt-1 text-sm text-muted">Sold by {product.vendor.storeName}</p>
        <p className="mt-4 text-2xl font-extrabold">{formatGbp(price)}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{product.description}</p>
        {product.attributes.length ? (
          <dl className="mt-4 grid gap-2 text-sm">
            {product.attributes.map((a) => (
              <div key={a.id} className="flex justify-between gap-4 border-b border-border py-1">
                <dt className="text-muted">{a.key}</dt>
                <dd>{a.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <ActionForm className="mt-6 grid gap-3" action={addToCartFromForm}>
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="variantId" value={product.variants[0]?.id ?? ""} />
          <input type="hidden" name="quantity" value="1" />
          <Button type="submit">Add to cart</Button>
        </ActionForm>
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
            {product.reviews.map((r) => (
              <article key={r.id} className="rounded-xl border border-border p-3">
                <p className="font-semibold">
                  {r.rating}/5 · {r.user.name}
                </p>
                <p className="text-sm">{r.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
