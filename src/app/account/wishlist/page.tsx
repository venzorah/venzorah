import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addToCart, toggleWishlist } from "@/app/actions/marketplace";
import { ProductCard } from "@/components/product-card";
import { Button, EmptyState, PageHeader } from "@/components/ui";

export default async function WishlistPage() {
  const user = await requireUser();
  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { images: true, vendor: true, variants: true } } },
  });
  return (
    <>
      <PageHeader title="Wishlist" />
      {items.length === 0 ? (
        <EmptyState title="No saved products." />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="grid gap-2">
              <ProductCard product={item.product} />
              <form
                action={async () => {
                  "use server";
                  await addToCart(item.productId, 1, item.product.variants[0]?.id);
                }}
              >
                <Button type="submit" className="w-full">
                  Move to cart
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await toggleWishlist(item.productId);
                }}
              >
                <Button type="submit" variant="ghost" className="w-full">
                  Remove
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
