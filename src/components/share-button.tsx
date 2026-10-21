"use client";

import { useState } from "react";
import { Button } from "./ui";

export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          await navigator.share({ title, text, url }).catch(() => undefined);
          return;
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }}
    >
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
