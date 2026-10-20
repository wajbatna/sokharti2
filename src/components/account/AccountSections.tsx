"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Home, MapPin, Pencil, Plus, RefreshCw, Star, Trash2, Truck } from "lucide-react";
import { Alert, Button, Card, EmptyState, Field, Input, Select, StarPicker, Tabs, Textarea } from "@/components/ui";
import { useCart, useToast, type CartStore } from "@/components/providers";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction, submitReviewAction, updateProfileAction } from "@/lib/actions/account";
import { cancelOrderAction } from "@/lib/actions/orders";
import { CITIES, STATUS_COLOR, STATUS_LABEL, formatDateAr, money, type Result } from "@/lib/utils";

const initial: Result | null = null;

/* ------------------------------- PROFILE --------------------------------- */

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null; city: string | null } }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  return (
    <Card className="max-w-xl space-y-4">
      <h2 className="text-lg font-extrabold text-[#111827]">الملف الشخصي</h2>
      <form action={action} className="space-y-4">
        <Field label="الاسم الكامل">
          <Input name="name" defaultValue={user.name} required />
        </Field>
        <Field label="البريد الإلكتروني">
          <Input value={user.email} disabled dir="ltr" className="bg-gray-50" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رقم الهاتف">
            <Input name="phone" defaultValue={user.phone ?? ""} dir="ltr" />
          </Field>
          <Field label="المدينة">
            <Select name="city" defaultValue={user.city ?? "برشيد"}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="كلمة مرور جديدة" hint="اتركها فارغة إذا ما بغيتيش تبدلها">
          <Input name="password" type="password" dir="ltr" />
        </Field>
        {state && !state.ok ? <Alert>{state.error}</Alert> : null}
        {state?.ok ? <Alert tone="success">تم حفظ التغييرات ✓</Alert> : null}
        <Button type="submit" loading={pending}>
          حفظ التغييرات
        </Button>
      </form>
    </Card>
  );
}

/* ------------------------------ ADDRESSES -------------------------------- */

type AddressRow = {
  id: number;
  label: string;
  city: string;
  street: string;
  details: string | null;
  notes: string | null;
  isDefault: boolean;
};

export function AddressManager({ addresses }: { addresses: AddressRow[] }) {
  const [editing, setEditing] = useState<AddressRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [state, action, pending] = useActionState(saveAddressAction, initial);
  const [, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    if (state?.ok) {
      setEditing(null);
      setCreating(false);
    }
  }, [state]);

  const showForm = creating || editing;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-[#111827]">عناويني</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          <Plus className="h-4 w-4" /> عنوان جديد
        </Button>
      </div>

      {showForm ? (
        <Card>
          <form action={action} className="space-y-4">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="النوع">
                <Select name="label" defaultValue={editing?.label ?? "home"}>
                  <option value="home">المنزل</option>
                  <option value="work">العمل</option>
                  <option value="other">آخر</option>
                </Select>
              </Field>
              <Field label="المدينة">
                <Select name="city" defaultValue={editing?.city ?? "برشيد"}>
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="العنوان">
              <Input name="street" defaultValue={editing?.street ?? ""} placeholder="الحي، الزنقة، الرقم" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="تفاصيل إضافية">
                <Input name="details" defaultValue={editing?.details ?? ""} placeholder="الطابق، الشقة" />
              </Field>
              <Field label="ملاحظة للسائق">
                <Input name="notes" defaultValue={editing?.notes ?? ""} placeholder="الجرس على اليمين" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <input type="checkbox" name="isDefault" defaultChecked={editing?.isDefault} className="h-4 w-4 accent-[#FF6B35]" />
              اجعله العنوان الافتراضي
            </label>
            {state && !state.ok ? <Alert>{state.error}</Alert> : null}
            <div className="flex gap-2">
              <Button type="submit" loading={pending}>
                حفظ العنوان
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {!addresses.length && !showForm ? (
        <EmptyState icon={<MapPin className="h-7 w-7" />} title="ما عندك حتى عنوان" description="زيد عنوان باش يسهل عليك الطلب." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <Card key={a.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-extrabold text-[#111827]">
                  <Home className="h-4 w-4 text-[#FF6B35]" />
                  {a.label === "home" ? "المنزل" : a.label === "work" ? "العمل" : "آخر"}
                </span>
                {a.isDefault ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">افتراضي</span> : null}
              </div>
              <p className="text-sm text-gray-600">
                {a.street}، {a.city}
              </p>
              {a.details ? <p className="text-xs text-gray-400">{a.details}</p> : null}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                  <Pencil className="h-3.5 w-3.5" /> تعديل
                </Button>
                {!a.isDefault ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startTransition(async () => {
                      await setDefaultAddressAction(a.id);
                      toast.push("تم تعيين العنوان الافتراضي");
                    })}
                  >
                    تعيين كافتراضي
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600"
                  onClick={() => startTransition(async () => {
                    await deleteAddressAction(a.id);
                    toast.push("تم حذف العنوان");
                  })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- ORDERS --------------------------------- */

export type OrderRow = {
  id: number;
  code: string;
  status: string;
  total: number;
  createdAt: string;
  store: CartStore & { name: string };
  items: { id: number; productId: number | null; name: string; imageUrl: string | null; unitPrice: number; quantity: number }[];
};

export function OrdersTabs({ orders }: { orders: OrderRow[] }) {
  const [tab, setTab] = useState("current");
  const { addLine, setDrawerOpen } = useCart();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [reviewFor, setReviewFor] = useState<OrderRow | null>(null);

  const current = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const previous = orders.filter((o) => o.status === "delivered");
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const list = tab === "current" ? current : tab === "previous" ? previous : cancelled;

  const reorder = (order: OrderRow) => {
    order.items.forEach((item) => {
      if (!item.productId) return;
      addLine(order.store, {
        productId: item.productId,
        name: item.name,
        imageUrl: item.imageUrl,
        basePrice: item.unitPrice,
        quantity: item.quantity,
        notes: "",
        extras: [],
      });
    });
    toast.push("تزادو المنتجات للسلة ✓");
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold text-[#111827]">طلباتي</h2>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "current", label: "الحالية", count: current.length },
          { id: "previous", label: "السابقة", count: previous.length },
          { id: "cancelled", label: "الملغاة", count: cancelled.length },
        ]}
      />

      {!list.length ? (
        <EmptyState
          icon={<Truck className="h-7 w-7" />}
          title="ما كاين حتى طلب هنا"
          description="ملي تطلب غادي يبان ليك هنا وتقدر تتبعو مباشرة."
          action={
            <Link href="/restaurants">
              <Button>اطلب دابا</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map((order) => (
            <Card key={order.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {order.store.logoUrl ? (
                    <Image src={order.store.logoUrl} alt={order.store.name} width={44} height={44} className="h-11 w-11 rounded-xl object-cover" />
                  ) : null}
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">{order.store.name}</p>
                    <p className="text-xs text-gray-500">
                      #{order.code} · {formatDateAr(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                  <p className="mt-1 text-sm font-extrabold text-[#111827]">{money(order.total)}</p>
                </div>
              </div>

              <p className="truncate text-xs text-gray-500">{order.items.map((i) => `${i.quantity}× ${i.name}`).join("، ")}</p>

              <div className="flex flex-wrap gap-2">
                <Link href={`/orders/${order.code}`}>
                  <Button size="sm" variant="outline">
                    تتبع الطلب
                  </Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={() => reorder(order)}>
                  <RefreshCw className="h-3.5 w-3.5" /> إعادة الطلب
                </Button>
                {order.status === "delivered" ? (
                  <Button size="sm" variant="ghost" onClick={() => setReviewFor(order)}>
                    <Star className="h-3.5 w-3.5" /> قيّم
                  </Button>
                ) : null}
                {["received", "confirmed"].includes(order.status) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await cancelOrderAction(order.id);
                        toast.push(res.ok ? "تم إلغاء الطلب" : res.error, res.ok ? "success" : "error");
                      })
                    }
                  >
                    إلغاء
                  </Button>
                ) : null}
              </div>

              {reviewFor?.id === order.id ? <ReviewForm order={order} onDone={() => setReviewFor(null)} /> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ order, onDone }: { order: OrderRow; onDone: () => void }) {
  const [state, action, pending] = useActionState(submitReviewAction, initial);
  const [rating, setRating] = useState(5);
  const [delivery, setDelivery] = useState(5);
  const toast = useToast();

  useEffect(() => {
    if (state?.ok) {
      toast.push("شكراً على تقييمك، غادي ينشر بعد المراجعة");
      onDone();
    }
  }, [state, onDone, toast]);

  return (
    <form action={action} className="space-y-3 rounded-2xl bg-gray-50 p-4">
      <input type="hidden" name="storeId" value={order.store.id} />
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="deliveryRating" value={delivery} />
      <input type="hidden" name="productRating" value={rating} />
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="mb-1 text-xs font-extrabold text-gray-600">تقييم المحل</p>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div>
          <p className="mb-1 text-xs font-extrabold text-gray-600">تقييم التوصيل</p>
          <StarPicker value={delivery} onChange={setDelivery} />
        </div>
      </div>
      <Textarea name="comment" rows={2} placeholder="شنو عجبك فالطلب؟" />
      {state && !state.ok ? <Alert>{state.error}</Alert> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          إرسال التقييم
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
