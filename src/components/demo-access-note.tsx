export function DemoAccessNote({ staff = false }: { staff?: boolean }) {
  return (
    <details className="mt-6 rounded-2xl bg-card p-4 text-sm text-muted ring-1 ring-border">
      <summary className="cursor-pointer font-semibold text-ink">Demo access</summary>
      {staff ? (
        <p className="mt-3">Staff: venzorah.app@gmail.com / Utomobong#@01</p>
      ) : (
        <ul className="mt-3 grid gap-1">
          <li>Buyer: customer@venzorah.com / VenzorahCustomer!23</li>
          <li>Sellers: vendor@venzorah.com, vendor2@venzorah.com or house@venzorah.com / VenzorahVendor!23</li>
        </ul>
      )}
    </details>
  );
}
