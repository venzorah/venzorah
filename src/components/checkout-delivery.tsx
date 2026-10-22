"use client";

import { useState } from "react";
import { checkoutAction } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { UkAddressFields } from "@/components/uk-address-fields";
import { Button, Field, Input } from "@/components/ui";

export type SavedDeliveryAddress = {
  id: string;
  label: string;
  line1: string;
  city: string;
  region: string;
  postcode: string;
  isDefault: boolean;
};

export function CheckoutDelivery({
  buyerName,
  addresses,
}: {
  buyerName: string;
  addresses: SavedDeliveryAddress[];
}) {
  const initial = addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? "new";
  const [selected, setSelected] = useState(initial);
  const usingNew = selected === "new";

  return (
    <ActionForm action={checkoutAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
      <Field label="Full name">
        <Input name="shippingName" defaultValue={buyerName} required autoComplete="name" />
      </Field>
      {addresses.length ? (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-ink">Deliver to</legend>
          {addresses.map((address) => (
            <label key={address.id} className="flex cursor-pointer gap-3 rounded-xl border border-border px-3 py-2 text-sm">
              <input
                type="radio"
                name="addressId"
                value={address.id}
                checked={selected === address.id}
                onChange={() => setSelected(address.id)}
              />
              <span>
                <span className="font-semibold text-ink">
                  {address.label}
                  {address.isDefault ? " · default" : ""}
                </span>
                <span className="mt-0.5 block text-muted">
                  {address.line1}, {address.city}
                  {address.region ? `, ${address.region}` : ""} {address.postcode}
                </span>
              </span>
            </label>
          ))}
          <label className="flex cursor-pointer gap-3 rounded-xl border border-border px-3 py-2 text-sm">
            <input type="radio" name="addressId" value="new" checked={usingNew} onChange={() => setSelected("new")} />
            <span className="font-semibold text-ink">Use a different address</span>
          </label>
        </fieldset>
      ) : (
        <input type="hidden" name="addressId" value="new" />
      )}
      {usingNew ? (
        <>
          <Field label="Label">
            <Input name="label" defaultValue="Delivery" />
          </Field>
          <UkAddressFields
            line1Name="shippingLine1"
            cityName="shippingCity"
            regionName="shippingRegion"
            postcodeName="shippingPostcode"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="saveAddress" defaultChecked />
            Save this address for next time
          </label>
        </>
      ) : null}
      <Field label="Coupon (optional)">
        <Input name="coupon" />
      </Field>
      <Button type="submit" className="rounded-full">
        Continue to payment
      </Button>
    </ActionForm>
  );
}
