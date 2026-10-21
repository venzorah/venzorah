export function listingLimitReached(activeCount: number, maxActiveProducts: number | null) {
  return maxActiveProducts != null && activeCount >= maxActiveProducts;
}
