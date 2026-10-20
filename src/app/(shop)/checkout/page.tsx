import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { getCurrentUser } from "@/lib/auth";
import { listAddresses } from "@/lib/queries";
import { PAYMENT_METHODS } from "@/lib/payments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "إتمام الطلب", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const addresses = user ? await listAddresses(user.id) : [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-extrabold text-[#111827] md:text-3xl">إتمام الطلب</h1>
      <CheckoutClient
        user={user ? { name: user.name, phone: user.phone ?? "" } : null}
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          city: a.city,
          street: a.street,
          details: a.details,
          isDefault: a.isDefault,
          lat: a.lat,
          lng: a.lng,
        }))}
        paymentMethods={PAYMENT_METHODS}
      />
    </div>
  );
}
