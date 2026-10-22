import type { ProductCardProduct } from "@/components/product-card";
import { CATEGORY_IMAGES } from "@/lib/category-display";
import { slugify } from "@/lib/utils";

const GALLERY = [
  "/products/palm-oil.jpg",
  "/products/white-garri.jpg",
  "/products/ground-egusi.jpg",
  "/products/plantain-chips.jpg",
  "/products/yellow-garri.jpg",
  "/categories/cat-food.jpg",
  "/categories/cat-fashion.jpg",
  "/slides/slide-beauty.jpg",
];

const VENDORS = {
  mama: { storeName: "Mama Ada's Pantry Ltd", storeSlug: "aminas-pantry" },
  steel: { storeName: "Steel City African Store Ltd", storeSlug: "lagos-threads" },
  house: { storeName: "Accra House UK", storeSlug: "accra-house-uk" },
  official: { storeName: "Venzorah Official", storeSlug: "venzorah-official" },
} as const;

type VendorKey = keyof typeof VENDORS;

type Listing = {
  category: string;
  name: string;
  price: number;
  description: string;
  image: string;
  vendor: VendorKey;
  featured?: boolean;
  pack?: string;
  reviewCount?: number;
};

const CATALOG: { category: string; name: string; price: number; description: string }[] = [
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

const LISTINGS: Listing[] = [
  {
    category: "African Food and Groceries",
    name: "Red Palm Oil",
    price: 699,
    description: "Deep red palm oil for soups and stews.",
    image: "/products/palm-oil.jpg",
    vendor: "mama",
    pack: "1 litre",
    reviewCount: 12,
  },
  {
    category: "African Food and Groceries",
    name: "Ijebu Garri (White)",
    price: 549,
    description: "Crisp white Ijebu garri for eba and snacks.",
    image: "/products/white-garri.jpg",
    vendor: "mama",
    pack: "1.5 kg",
    reviewCount: 10,
  },
  {
    category: "African Food and Groceries",
    name: "Ground Egusi",
    price: 799,
    description: "Finely ground egusi melon seeds.",
    image: "/products/ground-egusi.jpg",
    vendor: "steel",
    featured: true,
    pack: "500 g",
    reviewCount: 14,
  },
  {
    category: "African Food and Groceries",
    name: "Plantain Chips — Lightly Salted",
    price: 199,
    description: "Crunchy lightly salted plantain chips.",
    image: "/products/plantain-chips.jpg",
    vendor: "steel",
    featured: true,
    pack: "80 g bag",
    reviewCount: 8,
  },
  {
    category: "African Food and Groceries",
    name: "Yellow Garri",
    price: 599,
    description: "Yellow garri for eba, soaking and recipes.",
    image: "/products/yellow-garri.jpg",
    vendor: "steel",
    pack: "1.5 kg",
    reviewCount: 9,
  },
  {
    category: "African Food and Groceries",
    name: "Jollof rice spice mix 200g",
    price: 695,
    description: "Aromatic spice blend for homestyle jollof.",
    image: "/products/ground-egusi.jpg",
    vendor: "mama",
    pack: "200 g",
  },
  {
    category: "Fashion and Clothing",
    name: "Ankara wrap skirt",
    price: 4500,
    description: "Handmade wrap skirt in mixed Ankara print.",
    image: "/slides/slide-fashion.jpg",
    vendor: "steel",
  },
  {
    category: "Fashion and Clothing",
    name: "Kente-inspired scarf",
    price: 2200,
    description: "Lightweight scarf inspired by kente patterns.",
    image: "/slides/slide-fashion.jpg",
    vendor: "steel",
  },
  ...CATALOG.map((listing, index) => ({
    ...listing,
    image: CATEGORY_IMAGES[listing.category] ?? "/slides/slide-market.jpg",
    vendor: (index % 2 === 0 ? "house" : "official") as VendorKey,
    featured: index < 6,
  })),
];

export type DemoProduct = ProductCardProduct & {
  description: string;
  categoryName: string;
  categorySlug: string;
};

function gallery(name: string, featured: string) {
  const pool = GALLERY.filter((url) => url !== featured);
  const start = name.length % pool.length;
  const extra = [pool[start], pool[(start + 3) % pool.length]];
  return [
    { url: featured, alt: name },
    ...extra.map((url) => ({ url, alt: name })),
  ];
}

function toProduct(listing: Listing): DemoProduct {
  const slug = slugify(listing.name);
  return {
    id: `demo-${slug}`,
    name: listing.name,
    slug,
    description: listing.description,
    categoryName: listing.category,
    categorySlug: slugify(listing.category),
    pricePence: listing.price,
    salePricePence: null,
    featured: Boolean(listing.featured),
    images: gallery(listing.name, listing.image),
    vendor: VENDORS[listing.vendor],
    variants: [{ id: `demo-variant-${slug}` }],
    attributes: listing.pack ? [{ key: "net_weight", value: listing.pack }] : [],
    reviews: listing.reviewCount
      ? Array.from({ length: listing.reviewCount }, (_, index) => ({ rating: 4 + (index % 2) }))
      : [],
  };
}

const PRODUCTS = LISTINGS.map(toProduct);

export function demoProducts() {
  return [...PRODUCTS].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

export function demoProductsForStore(slug: string) {
  return demoProducts().filter((product) => product.vendor.storeSlug === slug);
}

export function demoProductsForCategory(slug: string) {
  return demoProducts().filter((product) => product.categorySlug === slug);
}

export function demoProductBySlug(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug) ?? null;
}

export function demoProductById(id: string) {
  return PRODUCTS.find((product) => product.id === id) ?? null;
}

export function filterDemoProducts(query?: string, category?: string) {
  const needle = query?.trim().toLowerCase();
  return demoProducts().filter((product) => {
    if (category && product.categorySlug !== category) return false;
    if (!needle) return true;
    return (
      product.name.toLowerCase().includes(needle) || product.description.toLowerCase().includes(needle)
    );
  });
}
