"use client";

import { useState, type ReactNode } from "react";
import { Alert } from "./ui";

export function ActionForm({
  action,
  children,
  className,
  successMessage = "Saved.",
  encType,
}: {
  action: (formData: FormData) => Promise<{ error?: string; ok?: boolean } | void>;
  children: ReactNode;
  className?: string;
  successMessage?: string | null;
  encType?: "multipart/form-data" | "application/x-www-form-urlencoded";
}) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className={className}
      encType={encType}
      action={async (formData) => {
        setError(null);
        setOk(false);
        const result = await action(formData);
        if (result && "error" in result && result.error) setError(result.error);
        else setOk(true);
      }}
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      {ok && !error && successMessage ? <Alert tone="success">{successMessage}</Alert> : null}
      {children}
    </form>
  );
}
