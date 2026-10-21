"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { CartPromptProvider } from "./cart-prompt";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <CartPromptProvider>{children}</CartPromptProvider>
    </ThemeProvider>
  );
}
