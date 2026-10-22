import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteAddress, saveAddress } from "@/app/actions/marketplace";
import { ActionForm } from "@/components/forms";
import { UkAddressFields } from "@/components/uk-address-fields";
import { Button, Field, Input, PageHeader, Card } from "@/components/ui";

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: user.id } });
  return (
    <>
      <PageHeader title="Delivery addresses" description="UK postcodes are required. Unsupported destinations are blocked at checkout." />
      <div className="grid gap-3">
        {addresses.map((a) => (
          <Card key={a.id}>
            <p className="font-semibold">
              {a.label} {a.isDefault ? "(default)" : ""}
            </p>
            <p className="text-sm">
              {a.line1}, {a.city}
              {a.region ? `, ${a.region}` : ""} {a.postcode}
            </p>
            <form action={async () => { "use server"; await deleteAddress(a.id); }}>
              <Button type="submit" variant="ghost">
                Delete
              </Button>
            </form>
          </Card>
        ))}
      </div>
      <h2 className="mt-8 mb-3 font-bold">Add address</h2>
      <ActionForm action={saveAddress} className="grid max-w-lg gap-3">
        <Field label="Label">
          <Input name="label" defaultValue="Home" />
        </Field>
        <UkAddressFields line1Name="line1" cityName="city" regionName="region" postcodeName="postcode" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isDefault" /> Default address
        </label>
        <Button type="submit">Save address</Button>
      </ActionForm>
    </>
  );
}
