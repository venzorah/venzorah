import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PwaRegister } from "@/components/pwa";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Venzorah",
    template: "%s · Venzorah",
  },
  description:
    "Venzorah is a UK marketplace for African products — food, fashion, beauty, art, homewares and more from independent vendors.",
  applicationName: "Venzorah",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/icon.png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Venzorah",
    statusBarStyle: "black-translucent",
  },
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#002168",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
