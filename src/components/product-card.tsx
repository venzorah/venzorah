import Link from "next/link";
import { formatGbp } from "@/lib/money";
import { QuickAddButton, WishlistButton } from "./product-actions";

export type ProductCardProduct = {
  id: string;
  name: string;
  slug: string;
  pricePence: number;
  salePricePence: number | null;
  createdAt?: Date;
  featured?: boolean;
  images: { url: string; alt: string | null }[];
  vendor: { storeName: string; storeSlug: string };
  variants?: { id: string }[];
  attributes?: { key: string; value: string }[];
  reviews?: { rating: number }[];
};

function packSize(product: ProductCardProduct) {
  return product.attributes?.find((a) => a.key === "net_weight" || a.key === "volume")?.value;
}

function ratingSummary(reviews: { rating: number }[] | undefined) {
  if (!reviews?.length) return null;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { avg, count: reviews.length };
}

export function ProductCard({
  product,
  wished,
}: {
  product: ProductCardProduct;
  wished?: boolean;
}) {
  const price = product.salePricePence ?? product.pricePence;
  const image = product.images[0];
  const rating = ratingSummary(product.reviews);
  const isNew =
    product.featured ||
    (product.createdAt ? Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 45 : false);

  return (
    <article className="relative rounded-2xl bg-card p-2.5 shadow-sm ring-1 ring-border">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-[#eef1f6]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.alt ?? product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">No image</div>
          )}
          {isNew ? (
            <span className="absolute left-3 top-3 rounded-md bg-navy px-2 py-0.5 text-[11px] font-semibold text-white">
              New
            </span>
          ) : null}
        </div>
        <div className="space-y-1 px-1 pb-12 pt-3">
          <p className="text-xs text-muted">{product.vendor.storeName}</p>
          <h3 className="line-clamp-2 text-sm font-bold text-ink">{product.name}</h3>
          {rating ? (
            <p className="flex items-center gap-1 text-xs text-ink">
              <span aria-hidden className="text-gold">
                ★
              </span>
              <span className="font-semibold">{rating.avg.toFixed(1)}</span>
              <span className="text-muted">({rating.count})</span>
            </p>
          ) : (
            <p className="text-xs text-muted">No reviews yet</p>
          )}
          <p className="text-lg font-extrabold text-ink">{formatGbp(price)}</p>
          {packSize(product) ? <p className="text-xs text-muted">{packSize(product)}</p> : null}
        </div>
      </Link>
      <WishlistButton productId={product.id} wished={wished} />
      <QuickAddButton productId={product.id} variantId={product.variants?.[0]?.id} />
    </article>
  );
}
