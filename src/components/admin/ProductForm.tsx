"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Alert, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { saveProductAction } from "@/lib/actions/admin";
import { toDh, type Result } from "@/lib/utils";

const initial: Result<{ id: number }> | null = null;

export type ProductFormData = {
  id?: number;
  storeId?: number;
  sectionId?: number | null;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number;
  oldPrice?: number | null;
  isPopular?: boolean;
  isAvailable?: boolean;
  stock?: number;
  sortOrder?: number;
  extras?: { name: string; price: number }[];
};

export function ProductForm({
  product,
  stores,
  sections,
  backHref = "/admin/products",
  lockedStoreId,
}: {
  product?: ProductFormData;
  stores: { id: number; name: string }[];
  sections: { id: number; name: string; storeId: number }[];
  backHref?: string;
  lockedStoreId?: number;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const [storeId, setStoreId] = useState<number>(lockedStoreId ?? product?.storeId ?? stores[0]?.id ?? 0);
  const [extras, setExtras] = useState<{ name: string; price: number }[]>(product?.extras ?? []);

  useEffect(() => {
    if (state?.ok) router.push(backHref);
  }, [state, router, backHref]);

  const storeSections = sections.filter((s) => s.storeId === storeId);

  return (
    <form action={action} className="space-y-5">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="storeId" value={storeId} />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card className="space-y-4">
            <h2 className="text-base font-extrabold text-[#111827]">معلومات المنتج</h2>
            <Field label="اسم المنتج">
              <Input name="name" defaultValue={product?.name ?? ""} required />
            </Field>
            <Field label="الوصف">
              <Textarea name="description" rows={3} defaultValue={product?.description ?? ""} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="المحل">
                <Select value={storeId} onChange={(e) => setStoreId(Number(e.target.value))} disabled={Boolean(lockedStoreId)}>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="القسم داخل المنيو">
                <Select name="sectionId" defaultValue={String(product?.sectionId ?? "")}>
                  <option value="">— بدون —</option>
                  {storeSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="الثمن (د.م)">
                <Input name="price" type="number" step="0.5" defaultValue={product?.price ? toDh(product.price) : ""} required />
              </Field>
              <Field label="الثمن القديم (د.م)">
                <Input name="oldPrice" type="number" step="0.5" defaultValue={product?.oldPrice ? toDh(product.oldPrice) : ""} />
              </Field>
              <Field label="المخزون">
                <Input name="stock" type="number" defaultValue={product?.stock ?? 50} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#111827]">الإضافات (Extras)</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => setExtras((e) => [...e, { name: "", price: 0 }])}>
                <Plus className="h-3.5 w-3.5" /> إضافة
              </Button>
            </div>
            {!extras.length ? <p className="text-xs text-gray-500">ما كاين حتى إضافة. زيد وحدة باش الزبون يقدر يختار.</p> : null}
            <div className="space-y-2">
              {extras.map((extra, index) => (
                <div key={index} className="grid grid-cols-[1fr_140px_auto] gap-2">
                  <Input
                    name="extraName"
                    defaultValue={extra.name}
                    placeholder="مثال: جبن إضافي"
                    className="h-11"
                  />
                  <Input
                    name="extraPrice"
                    type="number"
                    step="0.5"
                    defaultValue={toDh(extra.price)}
                    placeholder="الثمن"
                    className="h-11"
                  />
                  <Button type="button" size="icon" variant="ghost" className="text-rose-600" onClick={() => setExtras((e) => e.filter((_, i) => i !== index))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <ImageUploader name="imageUrl" label="صورة المنتج" defaultValue={product?.imageUrl} aspect="aspect-[4/3]" />
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-extrabold text-[#111827]">الحالة</h2>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <input type="checkbox" name="isAvailable" defaultChecked={product?.isAvailable ?? true} className="h-4 w-4 accent-[#FF6B35]" />
              متوفر للبيع
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <input type="checkbox" name="isPopular" defaultChecked={product?.isPopular} className="h-4 w-4 accent-[#FF6B35]" />
              الأكثر طلباً
            </label>
            <Field label="ترتيب العرض">
              <Input name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} />
            </Field>
          </Card>

          {state && !state.ok ? <Alert>{state.error}</Alert> : null}
          <Button type="submit" size="lg" className="w-full" loading={pending}>
            حفظ المنتج
          </Button>
        </div>
      </div>
    </form>
  );
}
