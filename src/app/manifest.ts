import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Venzorah",
    short_name: "Venzorah",
    description: "African products marketplace for UK customers.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#002168",
    lang: "en-GB",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Shop", url: "/products" },
      { name: "Cart", url: "/cart" },
      { name: "Account", url: "/account" },
    ],
  };
}
