"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, CreditCard, Home, MapPin, Phone, ShoppingBag, Tag, User, Wallet } from "lucide-react";
import { Alert, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { useCart, useLocation, useToast } from "@/components/providers";
import { placeOrderAction, validateCouponAction } from "@/lib/actions/orders";
import { CITIES, cn, money } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/payments";

type AddressItem = {
  id: number;
  label: string;
  city: string;
  street: string;
  details: string | null;
  isDefault: boolean;
  lat: number | null;
  lng: number | null;
};

const ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4.5 w-4.5" />,
  card: <CreditCard className="h-4.5 w-4.5" />,
  online: <Wallet className="h-4.5 w-4.5" />,
};

export function CheckoutClient({
  user,
  addresses,
  paymentMethods,
}: {
  user: { name: string; phone: string } | null;
  addresses: AddressItem[];
  paymentMethods: { id: PaymentMethod; label: string; hint: string; enabled: boolean }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const { store, lines, subtotal, serviceFee, deliveryFee, clear, hydrated } = useCart();
  const { location } = useLocation();

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<number | "manual">(defaultAddress ? defaultAddress.id : "manual");
  const [city, setCity] = useState(location?.city ?? defaultAddress?.city ?? "برشيد");
  const [street, setStreet] = useState(location?.address ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number; freeDelivery: boolean } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.sessionStorage.getItem("sakhrti.coupon") : null;
    if (saved) setCoupon(saved);
  }, []);

  useEffect(() => {
    if (hydrated && !lines.length) router.replace("/cart");
  }, [hydrated, lines.length, router]);

  if (!hydrated || !store || !lines.length) {
    return <div className="skeleton h-72 w-full rounded-3xl" />;
  }

  const effectiveDelivery = applied?.freeDelivery ? 0 : deliveryFee;
  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal + effectiveDelivery + serviceFee - discount);
  const selectedAddress = addresses.find((a) => a.id === addressId);
  const addressText = selectedAddress ? `${selectedAddress.street}${selectedAddress.details ? ` - ${selectedAddress.details}` : ""}، ${selectedAddress.city}` : `${street}، ${city}`;

  const applyCoupon = async () => {
    setCouponMsg("");
    const res = await validateCouponAction({ code: coupon, storeId: store.id, subtotal });
    if (!res.ok) {
      setApplied(null);
      setCouponMsg(res.error);
      return;
    }
    setApplied(res.data!);
    setCouponMsg("");
  };

  const submit = async () => {
    setError("");
    if (name.trim().length < 3) return setError("المرجو إدخال الاسم");
    if (phone.trim().length < 9) return setError("المرجو إدخال رقم هاتف صحيح");
    if (!selectedAddress && street.trim().length < 5) return setError("المرجو إدخال عنوان التوصيل");

    setSubmitting(true);
    const res = await placeOrderAction({
      storeId: store.id,
      lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, notes: l.notes, extraIds: l.extras.map((e) => e.id) })),
      contactName: name.trim(),
      phone: phone.trim(),
      addressText,
      addressLabel: selectedAddress?.label ?? "other",
      lat: selectedAddress?.lat ?? location?.lat ?? null,
      lng: selectedAddress?.lng ?? location?.lng ?? null,
      notes,
      couponCode: applied?.code,
      paymentMethod: payment,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      toast.push(res.error, "error");
      return;
    }
    clear();
    window.sessionStorage.removeItem("sakhrti.coupon");
    router.push(`/checkout/success/${res.data!.code}`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-[#111827]">
            <MapPin className="h-4.5 w-4.5 text-[#FF6B35]" /> عنوان التوصيل
          </h2>

          {addresses.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAddressId(a.id)}
                  className={cn(
                    "rounded-2xl border p-3 text-right transition",
                    addressId === a.id ? "border-[#FF6B35] bg-[#FFF1EB]" : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#111827]">
                    <Home className="h-3.5 w-3.5" /> {a.label === "home" ? "المنزل" : a.label === "work" ? "العمل" : "آخر"}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {a.street}، {a.city}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setAddressId("manual")}
                className={cn(
                  "rounded-2xl border border-dashed p-3 text-right text-xs font-bold transition",
                  addressId === "manual" ? "border-[#FF6B35] bg-[#FFF1EB] text-[#E4551F]" : "border-gray-300 text-gray-500",
                )}
              >
                + عنوان جديد
              </button>
            </div>
          ) : null}

          {addressId === "manual" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="المدينة">
                <Select value={city} onChange={(e) => setCity(e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="العنوان">
                <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="الحي، الزنقة، الرقم" />
              </Field>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-[#111827]">
            <User className="h-4.5 w-4.5 text-[#FF6B35]" /> معلومات التواصل
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم الكامل">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" />
            </Field>
            <Field label="رقم الهاتف">
              <div className="relative">
                <Phone className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06xxxxxxxx" dir="ltr" className="ps-10 text-right" />
              </div>
            </Field>
          </div>
          {!user ? (
            <p className="text-xs text-gray-500">
              عندك حساب؟{" "}
              <Link href="/login" className="font-bold text-[#FF6B35] hover:underline">
                سجل الدخول
              </Link>{" "}
              باش تتبع طلباتك.
            </p>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-[#111827]">
            <CreditCard className="h-4.5 w-4.5 text-[#FF6B35]" /> طريقة الأداء
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                disabled={!m.enabled}
                onClick={() => setPayment(m.id)}
                className={cn(
                  "rounded-2xl border p-3 text-right transition disabled:opacity-50",
                  payment === m.id ? "border-[#FF6B35] bg-[#FFF1EB]" : "border-gray-200 hover:border-gray-300",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-extrabold text-[#111827]">
                  {ICONS[m.id]} {m.label}
                </span>
                <span className="mt-1 block text-[11px] text-gray-500">{m.hint}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-extrabold text-[#111827]">تعليمات التوصيل</h2>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: الطابق الثاني، الجرس على اليمين" />
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-[#111827]">
            <ShoppingBag className="h-4.5 w-4.5 text-[#FF6B35]" /> ملخص الطلب
          </h2>

          <div className="flex items-center gap-2 rounded-2xl bg-gray-50 p-3">
            {store.logoUrl ? <Image src={store.logoUrl} alt={store.name} width={36} height={36} className="h-9 w-9 rounded-lg object-cover" /> : null}
            <div>
              <p className="text-sm font-extrabold text-[#111827]">{store.name}</p>
              <p className="text-[11px] text-gray-500">
                {store.etaMin}–{store.etaMax} دقيقة
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {lines.map((l) => (
              <li key={l.key} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-gray-600">
                  <span className="font-extrabold text-[#111827]">{l.quantity}×</span> {l.name}
                  {l.extras.length ? <span className="block text-[11px] text-gray-400">+ {l.extras.map((e) => e.name).join("، ")}</span> : null}
                </span>
                <span className="font-bold text-gray-700">{money((l.basePrice + l.extras.reduce((s, e) => s + e.price, 0)) * l.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="كود الخصم" className="h-11 pe-9 ps-3 text-sm" />
            </div>
            <Button variant="outline" onClick={applyCoupon}>
              تطبيق
            </Button>
          </div>
          {couponMsg ? <p className="text-xs font-bold text-rose-600">{couponMsg}</p> : null}
          {applied ? <p className="text-xs font-bold text-emerald-600">تم تطبيق {applied.code} ✓</p> : null}

          <dl className="space-y-1.5 border-t border-dashed border-gray-200 pt-3 text-sm">
            <Row label="المجموع الفرعي" value={money(subtotal)} />
            <Row label="رسوم التوصيل" value={effectiveDelivery === 0 ? "مجاني" : money(effectiveDelivery)} />
            <Row label="رسوم الخدمة" value={money(serviceFee)} />
            {discount ? <Row label="الخصم" value={`- ${money(discount)}`} tone="green" /> : null}
            <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-base font-extrabold text-[#111827]">
              <span>المجموع</span>
              <span>{money(total)}</span>
            </div>
          </dl>

          {error ? <Alert>{error}</Alert> : null}

          <Button size="lg" className="w-full" onClick={submit} loading={submitting}>
            تأكيد الطلب · {money(total)}
          </Button>
          <p className="text-center text-[11px] text-gray-400">بالضغط على تأكيد الطلب فأنت موافق على شروط الاستخدام</p>
        </Card>
      </aside>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={tone === "green" ? "font-bold text-emerald-600" : "font-bold text-gray-800"}>{value}</dd>
    </div>
  );
}
