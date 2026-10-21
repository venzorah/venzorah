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
    images?: { url: string; alt: string | null; sortOrder: number }[];
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
      {product?.images?.length ? (
        <div className="flex gap-2 overflow-x-auto">
          {product.images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="w-16 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="aspect-square w-full rounded-xl object-cover" />
              <p className="mt-1 text-center text-[11px] text-muted">{index === 0 ? "Featured" : "Gallery"}</p>
            </div>
          ))}
        </div>
      ) : null}
      <Field label="Featured image" hint="This is the main photo on the product card and page.">
        <Input name="featured" type="file" accept="image/*" />
      </Field>
      <Field label="Gallery" hint="Extra photos shoppers can browse after the featured image.">
        <Input name="gallery" type="file" accept="image/*" multiple />
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
