import { slugify } from "./utils";

export const CATEGORY_SHORT_NAMES: Record<string, string> = {
  "African Food and Groceries": "Food and groceries",
  "Fashion and Clothing": "Fashion",
  "Traditional and Cultural Wear": "Traditional wear",
  "Bags and Accessories": "Bags",
  "Beauty and Skincare": "Beauty",
  "Hair Products and Hair Accessories": "Hair",
  "Home and Living": "Home and living",
  "Furniture and Furnishings": "Furniture",
  "Art and Handmade Crafts": "Art and crafts",
  "African Artwork and Decor": "Artwork and decor",
  "Books and Educational Materials": "Books",
  "Music and Entertainment Products": "Music",
  "Electronics and Technology Accessories": "Electronics",
  "Health and Personal Care Products": "Health and care",
  "Agricultural Products and Supplies": "Agriculture",
  "Kitchenware and Household Goods": "Kitchenware",
  "Baby and Children's Products": "Baby and kids",
  "Sports and Fitness": "Sports",
  "Gifts and Souvenirs": "Gifts",
  "Business and Office Supplies": "Office",
  "Other Approved African Products": "More products",
};

export const CATEGORY_IMAGES: Record<string, string> = {
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

export function categoryLabel(name: string) {
  return CATEGORY_SHORT_NAMES[name] ?? name;
}

export function categoryImage(name: string, stored: string | null | undefined) {
  return stored || CATEGORY_IMAGES[name] || null;
}

export function staticCategories() {
  return Object.entries(CATEGORY_IMAGES).map(([name, image]) => ({
    id: slugify(name),
    name,
    slug: slugify(name),
    image,
  }));
}

export function categoryBySlug(slug: string) {
  return staticCategories().find((category) => category.slug === slug) ?? null;
}