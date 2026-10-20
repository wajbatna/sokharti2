import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata: Metadata = { title: "السلة", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-extrabold text-[#111827]">السلة</h1>
      <CartPageClient />
    </div>
  );
}
