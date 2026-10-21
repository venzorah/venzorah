import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { saveVendorStore } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { Button, Field, Input, PageHeader, Textarea } from "@/components/ui";

export default async function VendorStorePage() {
  const user = await requirePermission("vendor.store.manage");
  const vendor = await prisma.vendorProfile.findUniqueOrThrow({ where: { id: user.vendorId! } });
  return (
    <>
      <PageHeader title="Store profile" description={`Public URL /vendors/${vendor.storeSlug}`} />
      <ActionForm action={saveVendorStore} className="grid max-w-xl gap-3">
        <Field label="Store name">
          <Input name="storeName" defaultValue={vendor.storeName} required />
        </Field>
        <Field label="Description">
          <Textarea name="description" defaultValue={vendor.description ?? ""} />
        </Field>
        <Field label="Policies">
          <Textarea name="policies" defaultValue={vendor.policies ?? ""} />
        </Field>
        <Field label="Returns">
          <Textarea name="returnPolicy" defaultValue={vendor.returnPolicy ?? ""} />
        </Field>
        <Field label="Business email">
          <Input name="businessEmail" type="email" defaultValue={vendor.businessEmail ?? ""} />
        </Field>
        <Field label="Phone">
          <Input name="businessPhone" defaultValue={vendor.businessPhone ?? ""} />
        </Field>
        <Field label="City">
          <Input name="city" defaultValue={vendor.city ?? ""} />
        </Field>
        <Field label="Postcode">
          <Input name="postcode" defaultValue={vendor.postcode ?? ""} />
        </Field>
        <Button type="submit">Save store</Button>
      </ActionForm>
    </>
  );
}
