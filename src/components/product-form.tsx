"use client";

import { useMemo, useState } from "react";
import { saveProduct } from "@/app/actions/marketplace";
import { ActionForm } from "./forms";
import { Button, Field, Input, Textarea } from "./ui";

type CategoryOption = {
  id: string;
  name: string;
  attributes: { key: string; label: string; required: boolean; fieldType: string }[];
};

export function ProductForm({
  categories,
  product,
}: {
  categories: CategoryOption[];
  product?: {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    pricePence: number;
    sku: string | null;
    originCountry: string;
    handlingDays: number;
    attributes: { key: string; value: string }[];
  };
}) {
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const selected = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? categories[0],
    [categories, categoryId],
  );

  return (
    <ActionForm action={saveProduct} className="grid max-w-xl gap-3">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <Field label="Name">
        <Input name="name" required defaultValue={product?.name} />
      </Field>
      <Field label="Description">
        <Textarea name="description" required defaultValue={product?.description} />
      </Field>
      <Field label="Category">
        <select
          name="categoryId"
          className="tap-target rounded-xl border border-border bg-card px-3 text-ink"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Price (GBP)">
        <Input
          name="price"
          inputMode="decimal"
          required
          defaultValue={product ? (product.pricePence / 100).toFixed(2) : "12.00"}
        />
      </Field>
      <Field label="SKU">
        <Input name="sku" defaultValue={product?.sku ?? ""} />
      </Field>
      {product ? null : (
        <Field label="Stock">
          <Input name="stock" type="number" min={0} defaultValue={10} />
        </Field>
      )}
      <Field label="Product photo" hint="Use the camera on a phone, or pick an existing image.">
        <Input name="image" type="file" accept="image/*" capture="environment" />
      </Field>
      <Field label="Origin country">
        <Input name="originCountry" defaultValue={product?.originCountry ?? "NG"} />
      </Field>
      <Field label="Handling days">
        <Input name="handlingDays" type="number" min={0} defaultValue={product?.handlingDays ?? 2} />
      </Field>
      {selected?.attributes.length ? (
        <div className="grid gap-3 rounded-2xl border border-border bg-surface p-3">
          <p className="text-sm font-semibold text-ink">Fields for {selected.name}</p>
          {selected.attributes.map((a) => (
            <Field key={a.key} label={`${a.label}${a.required ? " *" : ""}`}>
              <Input
                name={`attr_${a.key}`}
                required={a.required}
                defaultValue={product?.attributes.find((v) => v.key === a.key)?.value ?? ""}
              />
            </Field>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">This category has no extra attributes yet.</p>
      )}
      <Button type="submit" name="status" value="DRAFT">
        Save draft
      </Button>
      <Button type="submit" name="status" value="PUBLISHED" variant="navy">
        Submit for sale
      </Button>
    </ActionForm>
  );
}
