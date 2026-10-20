"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Alert, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { saveStoreAction } from "@/lib/actions/admin";
import { toDh, type Result } from "@/lib/utils";
import { CITIES } from "@/lib/utils";

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const initial: Result<{ id: number }> | null = null;

export type StoreFormData = {
  id?: number;
  name?: string;
  nameEn?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  categoryId?: number | null;
  kind?: string;
  deliveryFee?: number;
  minOrder?: number;
  deliveryRadiusKm?: number;
  deliveryMinMinutes?: number;
  deliveryMaxMinutes?: number;
  commissionRate?: number;
  status?: string;
  isOpen?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  freeDelivery?: boolean;
  discountLabel?: string | null;
  ownerId?: number | null;
  hours?: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[];
};

export function StoreForm({
  store,
  categories,
  vendors,
  vendorMode = false,
}: {
  store?: StoreFormData;
  categories: { id: number; name: string; kind: string }[];
  vendors: { id: number; name: string }[];
  vendorMode?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveStoreAction, initial);

  useEffect(() => {
    if (state?.ok && !vendorMode) router.push("/admin/stores");
  }, [state, router, vendorMode]);

  const hour = (day: number, key: "openTime" | "closeTime") =>
    store?.hours?.find((h) => h.dayOfWeek === day)?.[key] ?? (key === "openTime" ? "09:00" : "23:30");

  return (
    <form action={action} className="space-y-5">
      {store?.id ? <input type="hidden" name="id" value={store.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card className="space-y-4">
            <h2 className="text-base font-extrabold text-[#111827]">معلومات المحل</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم المحل (بالعربية)">
                <Input name="name" defaultValue={store?.name ?? ""} required />
              </Field>
              <Field label="الاسم اللاتيني (للرابط)">
                <Input name="nameEn" defaultValue={store?.nameEn ?? ""} dir="ltr" />
              </Field>
            </div>
            <Field label="الوصف">
              <Textarea name="description" rows={3} defaultValue={store?.description ?? ""} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="النوع">
                <Select name="kind" defaultValue={store?.kind ?? "restaurant"} disabled={vendorMode}>
                  <option value="restaurant">مطعم</option>
                  <option value="store">متجر</option>
                </Select>
              </Field>
              <Field label="التصنيف">
                <Select name="categoryId" defaultValue={String(store?.categoryId ?? "")}>
                  <option value="">— اختر تصنيف —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.kind === "store" ? "متجر" : "مطعم"})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الهاتف">
                <Input name="phone" defaultValue={store?.phone ?? ""} dir="ltr" />
              </Field>
              <Field label="المدينة">
                <Select name="city" defaultValue={store?.city ?? "برشيد"}>
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="العنوان">
              <Input name="address" defaultValue={store?.address ?? ""} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="خط العرض (Latitude)">
                <Input name="lat" type="number" step="0.0001" defaultValue={store?.lat ?? 33.2667} dir="ltr" />
              </Field>
              <Field label="خط الطول (Longitude)">
                <Input name="lng" type="number" step="0.0001" defaultValue={store?.lng ?? -7.5869} dir="ltr" />
              </Field>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-extrabold text-[#111827]">التوصيل والعمولة</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="رسوم التوصيل (د.م)">
                <Input name="deliveryFee" type="number" step="0.5" defaultValue={toDh(store?.deliveryFee ?? 1000)} />
              </Field>
              <Field label="الحد الأدنى (د.م)">
                <Input name="minOrder" type="number" step="1" defaultValue={toDh(store?.minOrder ?? 5000)} />
              </Field>
              <Field label="نطاق التوصيل (كلم)">
                <Input name="deliveryRadiusKm" type="number" step="0.5" defaultValue={store?.deliveryRadiusKm ?? 8} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="أقل مدة (دقيقة)">
                <Input name="deliveryMinMinutes" type="number" defaultValue={store?.deliveryMinMinutes ?? 25} />
              </Field>
              <Field label="أقصى مدة (دقيقة)">
                <Input name="deliveryMaxMinutes" type="number" defaultValue={store?.deliveryMaxMinutes ?? 40} />
              </Field>
              <Field label="نسبة العمولة (%)">
                <Input name="commissionRate" type="number" step="0.5" defaultValue={store?.commissionRate ?? 10} disabled={vendorMode} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-extrabold text-[#111827]">أوقات العمل</h2>
            <div className="space-y-2">
              {DAYS.map((day, index) => (
                <div key={day} className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">{day}</span>
                  <Input name={`open_${index}`} type="time" defaultValue={hour(index, "openTime")} className="h-10" />
                  <Input name={`close_${index}`} type="time" defaultValue={hour(index, "closeTime")} className="h-10" />
                  <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                    <input
                      type="checkbox"
                      name={`closed_${index}`}
                      defaultChecked={store?.hours?.find((h) => h.dayOfWeek === index)?.isClosed}
                      className="h-3.5 w-3.5 accent-[#FF6B35]"
                    />
                    مغلق
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-4">
            <ImageUploader name="logoUrl" label="شعار المحل" defaultValue={store?.logoUrl} aspect="aspect-square" />
            <ImageUploader name="coverUrl" label="صورة الغلاف" defaultValue={store?.coverUrl} />
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-extrabold text-[#111827]">الحالة والإبراز</h2>
            {!vendorMode ? (
              <Field label="حالة المحل">
                <Select name="status" defaultValue={store?.status ?? "approved"}>
                  <option value="approved">منشور</option>
                  <option value="pending">فانتظار الموافقة</option>
                  <option value="suspended">موقوف</option>
                </Select>
              </Field>
            ) : null}
            <Field label="شارة الخصم">
              <Input name="discountLabel" defaultValue={store?.discountLabel ?? ""} placeholder="-20%" />
            </Field>
            {!vendorMode ? (
              <Field label="التاجر المالك">
                <Select name="ownerId" defaultValue={String(store?.ownerId ?? "")}>
                  <option value="">— بدون —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <div className="space-y-2 pt-1">
              <Check name="isOpen" label="مفتوح الآن" defaultChecked={store?.isOpen ?? true} />
              <Check name="freeDelivery" label="توصيل مجاني" defaultChecked={store?.freeDelivery} />
              <Check name="isFeatured" label="محل مميز" defaultChecked={store?.isFeatured} />
              <Check name="isNew" label="محل جديد" defaultChecked={store?.isNew} />
            </div>
          </Card>

          {state && !state.ok ? <Alert>{state.error}</Alert> : null}
          {state?.ok ? <Alert tone="success">تم الحفظ والنشر ✓</Alert> : null}

          <Button type="submit" size="lg" className="w-full" loading={pending}>
            حفظ ونشر
          </Button>
        </div>
      </div>
    </form>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#FF6B35]" />
      {label}
    </label>
  );
}
