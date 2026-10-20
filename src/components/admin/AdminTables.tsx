"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Alert, Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useToast } from "@/components/providers";
import {
  deleteBannerAction,
  deleteCategoryAction,
  deleteCouponAction,
  deleteOfferAction,
  moderateReviewAction,
  reseedDemoDataAction,
  saveBannerAction,
  saveCategoryAction,
  saveCouponAction,
  saveDriverAction,
  saveOfferAction,
  saveSettingsAction,
  setDriverStatusAction,
  setUserRoleAction,
  toggleUserActiveAction,
} from "@/lib/actions/admin";
import { formatDateAr, money, toDh, type Result } from "@/lib/utils";

const initial: Result | null = null;

/* ----------------------------- CATEGORIES -------------------------------- */

export function CategoriesManager({
  categories,
}: {
  categories: { id: number; name: string; nameFr: string | null; slug: string; icon: string; imageUrl: string | null; kind: string; sortOrder: number; isActive: boolean }[];
}) {
  const [editing, setEditing] = useState<(typeof categories)[number] | null>(null);
  const [creating, setCreating] = useState(false);
  const [state, action, pending] = useActionState(saveCategoryAction, initial);
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#111827]">التصنيفات</h1>
        <Button onClick={() => { setEditing(null); setCreating(true); }}>
          <Plus className="h-4 w-4" /> تصنيف جديد
        </Button>
      </div>

      {creating || editing ? (
        <Card>
          <form action={action} className="grid gap-4 md:grid-cols-2">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <Field label="الاسم بالعربية">
              <Input name="name" defaultValue={editing?.name ?? ""} required />
            </Field>
            <Field label="الاسم بالفرنسية">
              <Input name="nameFr" defaultValue={editing?.nameFr ?? ""} dir="ltr" />
            </Field>
            <Field label="النوع">
              <Select name="kind" defaultValue={editing?.kind ?? "restaurant"}>
                <option value="restaurant">مطاعم</option>
                <option value="store">متاجر</option>
              </Select>
            </Field>
            <Field label="الترتيب">
              <Input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} />
            </Field>
            <Field label="اسم الأيقونة (Lucide)">
              <Input name="icon" defaultValue={editing?.icon ?? "UtensilsCrossed"} dir="ltr" />
            </Field>
            <div className="md:col-span-2">
              <ImageUploader name="imageUrl" label="صورة التصنيف" defaultValue={editing?.imageUrl} />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} className="h-4 w-4 accent-[#FF6B35]" /> مفعّل
            </label>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" loading={pending}>حفظ</Button>
              <Button type="button" variant="ghost" onClick={() => { setCreating(false); setEditing(null); }}>إلغاء</Button>
            </div>
            {state && !state.ok ? <Alert>{state.error}</Alert> : null}
          </form>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Card key={c.id} className="flex items-center gap-3">
            {c.imageUrl ? <Image src={c.imageUrl} alt={c.name} width={48} height={48} className="h-12 w-12 rounded-xl object-cover" /> : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-[#111827]">{c.name}</p>
              <p className="text-[11px] text-gray-500">{c.kind === "store" ? "متاجر" : "مطاعم"} · {c.slug}</p>
            </div>
            {!c.isActive ? <Badge>موقوف</Badge> : null}
            <Button size="icon" variant="ghost" onClick={() => { setCreating(false); setEditing(c); }} aria-label="تعديل">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-rose-600"
              aria-label="حذف"
              onClick={() => start(async () => {
                const res = await deleteCategoryAction(c.id);
                toast.push(res.ok ? "تحيد التصنيف" : res.error, res.ok ? "success" : "error");
              })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- BANNERS ---------------------------------- */

export function BannersManager({
  banners,
}: {
  banners: { id: number; title: string; subtitle: string | null; imageUrl: string | null; buttonLabel: string | null; link: string | null; theme: string; sortOrder: number; isActive: boolean }[];
}) {
  const [editing, setEditing] = useState<(typeof banners)[number] | null>(null);
  const [creating, setCreating] = useState(false);
  const [state, action, pending] = useActionState(saveBannerAction, initial);
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#111827]">البانرات الإعلانية</h1>
        <Button onClick={() => { setEditing(null); setCreating(true); }}>
          <Plus className="h-4 w-4" /> بانر جديد
        </Button>
      </div>

      {creating || editing ? (
        <Card>
          <form action={action} className="grid gap-4 md:grid-cols-2">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <Field label="العنوان">
              <Input name="title" defaultValue={editing?.title ?? ""} required />
            </Field>
            <Field label="العنوان الفرعي">
              <Input name="subtitle" defaultValue={editing?.subtitle ?? ""} />
            </Field>
            <Field label="نص الزر">
              <Input name="buttonLabel" defaultValue={editing?.buttonLabel ?? "اكتشف"} />
            </Field>
            <Field label="الرابط">
              <Input name="link" defaultValue={editing?.link ?? "/offers"} dir="ltr" />
            </Field>
            <Field label="اللون">
              <Select name="theme" defaultValue={editing?.theme ?? "orange"}>
                <option value="orange">برتقالي</option>
                <option value="dark">داكن</option>
                <option value="green">أخضر</option>
              </Select>
            </Field>
            <Field label="الترتيب">
              <Input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} />
            </Field>
            <Field label="تاريخ الانتهاء">
              <Input name="endsAt" type="date" />
            </Field>
            <div className="md:col-span-2">
              <ImageUploader name="imageUrl" label="صورة البانر" defaultValue={editing?.imageUrl} />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} className="h-4 w-4 accent-[#FF6B35]" /> مفعّل
            </label>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" loading={pending}>حفظ</Button>
              <Button type="button" variant="ghost" onClick={() => { setCreating(false); setEditing(null); }}>إلغاء</Button>
            </div>
            {state && !state.ok ? <Alert>{state.error}</Alert> : null}
          </form>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {banners.map((b) => (
          <Card key={b.id} className="space-y-2">
            {b.imageUrl ? (
              <div className="relative h-28 w-full overflow-hidden rounded-2xl">
                <Image src={b.imageUrl} alt={b.title} fill sizes="400px" className="object-cover" />
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-[#111827]">{b.title}</p>
                <p className="text-xs text-gray-500">{b.subtitle}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setCreating(false); setEditing(b); }} aria-label="تعديل">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-rose-600"
                  aria-label="حذف"
                  onClick={() => start(async () => {
                    const res = await deleteBannerAction(b.id);
                    toast.push(res.ok ? "تحيد البانر" : res.error, res.ok ? "success" : "error");
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {!b.isActive ? <Badge>موقوف</Badge> : <Badge tone="success">نشط</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- COUPONS --------------------------------- */

export function CouponsManager({
  coupons,
  stores,
}: {
  coupons: { id: number; code: string; description: string | null; type: string; value: number; minOrder: number; maxDiscount: number; usageLimit: number; perUserLimit: number; usedCount: number; isActive: boolean; endsAt: Date | string | null; storeId: number | null }[];
  stores: { id: number; name: string }[];
}) {
  const [creating, setCreating] = useState(false);
  const [state, action, pending] = useActionState(saveCouponAction, initial);
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#111827]">الكوبونات</h1>
        <Button onClick={() => setCreating((v) => !v)}>
          <Plus className="h-4 w-4" /> كوبون جديد
        </Button>
      </div>

      {creating ? (
        <Card>
          <form action={action} className="grid gap-4 md:grid-cols-3">
            <Field label="الكود">
              <Input name="code" placeholder="SAKHRTI30" dir="ltr" required />
            </Field>
            <Field label="الوصف">
              <Input name="description" />
            </Field>
            <Field label="النوع">
              <Select name="type" defaultValue="percent">
                <option value="percent">نسبة مئوية</option>
                <option value="fixed">مبلغ ثابت</option>
                <option value="free_delivery">توصيل مجاني</option>
              </Select>
            </Field>
            <Field label="القيمة (% أو د.م)">
              <Input name="value" type="number" step="1" defaultValue={10} />
            </Field>
            <Field label="الحد الأدنى للطلب (د.م)">
              <Input name="minOrder" type="number" defaultValue={50} />
            </Field>
            <Field label="أقصى خصم (د.م)">
              <Input name="maxDiscount" type="number" defaultValue={40} />
            </Field>
            <Field label="حد الاستعمال الكلي">
              <Input name="usageLimit" type="number" defaultValue={500} />
            </Field>
            <Field label="حد لكل مستخدم">
              <Input name="perUserLimit" type="number" defaultValue={1} />
            </Field>
            <Field label="خاص بمحل">
              <Select name="storeId" defaultValue="">
                <option value="">كل المحلات</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="تاريخ الانتهاء">
              <Input name="endsAt" type="date" />
            </Field>
            <label className="flex items-center gap-2 self-end text-sm font-bold text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-[#FF6B35]" /> مفعّل
            </label>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" loading={pending}>حفظ الكوبون</Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>إلغاء</Button>
            </div>
            {state && !state.ok ? <Alert>{state.error}</Alert> : null}
          </form>
        </Card>
      ) : null}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="pb-2 font-bold">الكود</th>
                <th className="pb-2 font-bold">النوع</th>
                <th className="pb-2 font-bold">القيمة</th>
                <th className="pb-2 font-bold">حد أدنى</th>
                <th className="pb-2 font-bold">الاستعمال</th>
                <th className="pb-2 font-bold">ينتهي</th>
                <th className="pb-2 font-bold">الحالة</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-extrabold text-[#111827]">{c.code}</td>
                  <td className="py-3 text-gray-600">{c.type === "percent" ? "نسبة" : c.type === "fixed" ? "مبلغ" : "توصيل مجاني"}</td>
                  <td className="py-3 text-gray-600">{c.type === "percent" ? `${c.value}%` : c.type === "fixed" ? money(c.value) : "—"}</td>
                  <td className="py-3 text-gray-600">{money(c.minOrder)}</td>
                  <td className="py-3 text-gray-600">{c.usedCount}/{c.usageLimit}</td>
                  <td className="py-3 text-xs text-gray-400">{c.endsAt ? formatDateAr(c.endsAt) : "—"}</td>
                  <td className="py-3">{c.isActive ? <Badge tone="success">نشط</Badge> : <Badge>موقوف</Badge>}</td>
                  <td className="py-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-rose-600"
                      aria-label="حذف"
                      onClick={() => start(async () => {
                        const res = await deleteCouponAction(c.id);
                        toast.push(res.ok ? "تحيد الكوبون" : res.error, res.ok ? "success" : "error");
                      })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------- USERS ---------------------------------- */

export function UsersTable({
  users,
  title,
}: {
  users: { id: number; name: string; email: string; phone: string | null; role: string; city: string | null; isActive: boolean; createdAt: Date | string }[];
  title: string;
}) {
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-[#111827]">{title}</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="pb-2 font-bold">الاسم</th>
                <th className="pb-2 font-bold">البريد</th>
                <th className="pb-2 font-bold">الهاتف</th>
                <th className="pb-2 font-bold">المدينة</th>
                <th className="pb-2 font-bold">الدور</th>
                <th className="pb-2 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-extrabold text-[#111827]">{u.name}</td>
                  <td className="py-3 text-gray-600" dir="ltr">{u.email}</td>
                  <td className="py-3 text-gray-600" dir="ltr">{u.phone ?? "—"}</td>
                  <td className="py-3 text-gray-600">{u.city ?? "—"}</td>
                  <td className="py-3">
                    <Select
                      className="h-9 w-32 text-xs"
                      value={u.role}
                      onChange={(e) => start(async () => {
                        const res = await setUserRoleAction(u.id, e.target.value as "customer");
                        toast.push(res.ok ? "تحدث الدور" : res.error, res.ok ? "success" : "error");
                      })}
                    >
                      <option value="customer">زبون</option>
                      <option value="vendor">تاجر</option>
                      <option value="driver">سائق</option>
                      <option value="admin">مدير</option>
                    </Select>
                  </td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant={u.isActive ? "outline" : "danger"}
                      onClick={() => start(async () => {
                        const res = await toggleUserActiveAction(u.id, !u.isActive);
                        toast.push(res.ok ? "تحدثات الحالة" : res.error, res.ok ? "success" : "error");
                      })}
                    >
                      {u.isActive ? "نشط" : "موقوف"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------- DRIVERS --------------------------------- */

export function DriversManager({
  drivers,
}: {
  drivers: { id: number; name: string; phone: string; vehicle: string; status: string; rating: number; deliveriesCount: number; earnings: number }[];
}) {
  const [creating, setCreating] = useState(false);
  const [state, action, pending] = useActionState(saveDriverAction, initial);
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#111827]">السائقون</h1>
        <Button onClick={() => setCreating((v) => !v)}>
          <Plus className="h-4 w-4" /> سائق جديد
        </Button>
      </div>

      {creating ? (
        <Card>
          <form action={action} className="grid gap-4 md:grid-cols-4">
            <Field label="الاسم"><Input name="name" required /></Field>
            <Field label="الهاتف"><Input name="phone" dir="ltr" required /></Field>
            <Field label="وسيلة النقل"><Input name="vehicle" defaultValue="دراجة نارية" /></Field>
            <Field label="الحالة">
              <Select name="status" defaultValue="available">
                <option value="available">متاح</option>
                <option value="busy">مشغول</option>
                <option value="offline">غير متصل</option>
              </Select>
            </Field>
            <div className="md:col-span-4 flex gap-2">
              <Button type="submit" loading={pending}>حفظ</Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>إلغاء</Button>
            </div>
            {state && !state.ok ? <Alert>{state.error}</Alert> : null}
          </form>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drivers.map((d) => (
          <Card key={d.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-[#111827]">{d.name}</p>
              <Badge tone={d.status === "available" ? "success" : d.status === "busy" ? "warn" : "default"}>
                {d.status === "available" ? "متاح" : d.status === "busy" ? "مشغول" : "غير متصل"}
              </Badge>
            </div>
            <p className="text-xs text-gray-500" dir="ltr">{d.phone}</p>
            <p className="text-xs text-gray-500">{d.vehicle} · ⭐ {d.rating.toFixed(1)}</p>
            <p className="text-xs text-gray-500">{d.deliveriesCount} توصيلة · {money(d.earnings)}</p>
            <Select
              className="h-9 text-xs"
              value={d.status}
              onChange={(e) => start(async () => {
                const res = await setDriverStatusAction(d.id, e.target.value as "available");
                toast.push(res.ok ? "تحدثات الحالة" : res.error, res.ok ? "success" : "error");
              })}
            >
              <option value="available">متاح</option>
              <option value="busy">مشغول</option>
              <option value="offline">غير متصل</option>
            </Select>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- REVIEWS --------------------------------- */

export function ReviewsModeration({
  reviews,
}: {
  reviews: { review: { id: number; authorName: string; rating: number; comment: string | null; status: string; createdAt: Date | string }; storeName: string }[];
}) {
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-[#111827]">التقييمات</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {reviews.map(({ review, storeName }) => (
          <Card key={review.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-[#111827]">{review.authorName}</p>
              <Badge tone={review.status === "approved" ? "success" : review.status === "pending" ? "warn" : "default"}>
                {review.status === "approved" ? "منشور" : review.status === "pending" ? "بانتظار" : "مرفوض"}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">{storeName} · ⭐ {review.rating} · {formatDateAr(review.createdAt)}</p>
            <p className="text-sm text-gray-600">{review.comment}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => start(async () => {
                const res = await moderateReviewAction(review.id, "approved");
                toast.push(res.ok ? "تنشر التقييم" : res.error, res.ok ? "success" : "error");
              })}>
                <Check className="h-3.5 w-3.5" /> نشر
              </Button>
              <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => start(async () => {
                const res = await moderateReviewAction(review.id, "rejected");
                toast.push(res.ok ? "ترفض التقييم" : res.error, res.ok ? "success" : "error");
              })}>
                <X className="h-3.5 w-3.5" /> رفض
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- OFFERS ---------------------------------- */

export function OffersManager({
  offers,
  stores,
}: {
  offers: { offer: { id: number; title: string; subtitle: string | null; imageUrl: string | null; discountPercent: number; oldPrice: number | null; newPrice: number | null; isActive: boolean }; store: { name: string } }[];
  stores: { id: number; name: string }[];
}) {
  const [creating, setCreating] = useState(false);
  const [state, action, pending] = useActionState(saveOfferAction, initial);
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#111827]">العروض</h1>
        <Button onClick={() => setCreating((v) => !v)}>
          <Plus className="h-4 w-4" /> عرض جديد
        </Button>
      </div>

      {creating ? (
        <Card>
          <form action={action} className="grid gap-4 md:grid-cols-3">
            <Field label="المحل">
              <Select name="storeId" required>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="العنوان"><Input name="title" required /></Field>
            <Field label="العنوان الفرعي"><Input name="subtitle" /></Field>
            <Field label="نسبة الخصم %"><Input name="discountPercent" type="number" defaultValue={20} /></Field>
            <Field label="الثمن القديم (د.م)"><Input name="oldPrice" type="number" step="0.5" /></Field>
            <Field label="الثمن الجديد (د.م)"><Input name="newPrice" type="number" step="0.5" /></Field>
            <Field label="تاريخ الانتهاء"><Input name="endsAt" type="date" /></Field>
            <div className="md:col-span-2">
              <ImageUploader name="imageUrl" label="صورة العرض" />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-[#FF6B35]" /> مفعّل
            </label>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" loading={pending}>حفظ العرض</Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>إلغاء</Button>
            </div>
            {state && !state.ok ? <Alert>{state.error}</Alert> : null}
          </form>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {offers.map(({ offer, store }) => (
          <Card key={offer.id} className="space-y-2">
            {offer.imageUrl ? (
              <div className="relative h-28 w-full overflow-hidden rounded-2xl">
                <Image src={offer.imageUrl} alt={offer.title} fill sizes="300px" className="object-cover" />
              </div>
            ) : null}
            <p className="text-sm font-extrabold text-[#111827]">{offer.title}</p>
            <p className="text-xs text-gray-500">{store.name} · -{offer.discountPercent}%</p>
            <div className="flex items-center justify-between">
              {offer.isActive ? <Badge tone="success">نشط</Badge> : <Badge>موقوف</Badge>}
              <Button
                size="icon"
                variant="ghost"
                className="text-rose-600"
                aria-label="حذف"
                onClick={() => start(async () => {
                  const res = await deleteOfferAction(offer.id);
                  toast.push(res.ok ? "تحيد العرض" : res.error, res.ok ? "success" : "error");
                })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- SETTINGS --------------------------------- */

export function SettingsForm({ platform }: { platform: { name?: string; tagline?: string; serviceFee?: number; defaultCommission?: number; supportPhone?: string } }) {
  const [state, action, pending] = useActionState(saveSettingsAction, initial);
  const [, start] = useTransition();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-[#111827]">إعدادات المنصة</h1>
      <Card className="max-w-2xl">
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <Field label="اسم المنصة"><Input name="name" defaultValue={platform.name ?? "سخرتي"} /></Field>
          <Field label="الشعار"><Input name="tagline" defaultValue={platform.tagline ?? ""} /></Field>
          <Field label="رسوم الخدمة (د.م)"><Input name="serviceFee" type="number" step="0.5" defaultValue={toDh(platform.serviceFee ?? 300)} /></Field>
          <Field label="العمولة الافتراضية (%)"><Input name="defaultCommission" type="number" step="0.5" defaultValue={platform.defaultCommission ?? 10} /></Field>
          <Field label="هاتف الدعم"><Input name="supportPhone" defaultValue={platform.supportPhone ?? ""} dir="ltr" /></Field>
          <div className="md:col-span-2">
            <Button type="submit" loading={pending}>حفظ الإعدادات</Button>
          </div>
          {state?.ok ? <Alert tone="success">تم الحفظ ✓</Alert> : null}
        </form>
      </Card>

      <Card className="max-w-2xl space-y-3">
        <h2 className="text-base font-extrabold text-[#111827]">البيانات التجريبية</h2>
        <p className="text-xs text-gray-500">إعادة توليد بيانات العرض (محلات، منتجات، طلبات). كيمسح البيانات الحالية.</p>
        <Button
          variant="outline"
          onClick={() => {
            if (!confirm("غادي نمسحو البيانات الحالية ونعاودو نولدوها. متأكد؟")) return;
            start(async () => {
              const res = await reseedDemoDataAction();
              toast.push(res.ok ? "تعاودات البيانات" : res.error, res.ok ? "success" : "error");
            });
          }}
        >
          إعادة توليد البيانات
        </Button>
      </Card>
    </div>
  );
}

/* -------------------------------- PAYMENTS --------------------------------- */

export function PaymentsTable({
  payments,
}: {
  payments: { payment: { id: number; provider: string; method: string; amount: number; status: string; reference: string | null; createdAt: Date | string }; code: string; customer: string }[];
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-[#111827]">المدفوعات</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="pb-2 font-bold">الطلب</th>
                <th className="pb-2 font-bold">الزبون</th>
                <th className="pb-2 font-bold">المزود</th>
                <th className="pb-2 font-bold">الطريقة</th>
                <th className="pb-2 font-bold">المبلغ</th>
                <th className="pb-2 font-bold">الحالة</th>
                <th className="pb-2 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(({ payment, code, customer }) => (
                <tr key={payment.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-extrabold text-[#111827]">#{code}</td>
                  <td className="py-3 text-gray-600">{customer}</td>
                  <td className="py-3 text-gray-600" dir="ltr">{payment.provider}</td>
                  <td className="py-3 text-gray-600">{payment.method === "cash" ? "عند الاستلام" : payment.method === "card" ? "بطاقة" : "أونلاين"}</td>
                  <td className="py-3 font-bold">{money(payment.amount)}</td>
                  <td className="py-3">
                    <Badge tone={payment.status === "paid" ? "success" : payment.status === "failed" ? "default" : "warn"}>
                      {payment.status === "paid" ? "مؤدى" : payment.status === "failed" ? "فاشل" : "معلق"}
                    </Badge>
                  </td>
                  <td className="py-3 text-xs text-gray-400">{formatDateAr(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function AnalyticsView({
  stats,
}: {
  stats: { revenue: number; platformRevenue: number; orderCount: number; avgOrder: number; statusBreakdown: { status: string; c: number; total: number }[]; topStores: { name: string; revenue: number; count: number }[] };
}) {
  const max = Math.max(1, ...stats.statusBreakdown.map((s) => s.c));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-[#111827]">التحليلات</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-extrabold text-[#111827]">توزيع الطلبات حسب الحالة</h2>
          <ul className="space-y-3">
            {stats.statusBreakdown.map((s) => (
              <li key={s.status}>
                <div className="mb-1 flex justify-between text-xs font-bold text-gray-600">
                  <span>{s.status}</span>
                  <span>{s.c} طلب · {money(s.total)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-[#FF6B35]" style={{ width: `${(s.c / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-extrabold text-[#111827]">أفضل المحلات مداخيل</h2>
          <ul className="space-y-3">
            {stats.topStores.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-sm">
                <span className="font-bold text-gray-700">{s.name}</span>
                <span className="font-extrabold text-[#111827]">{money(s.revenue)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="grid gap-4 sm:grid-cols-4">
        <Metric label="إجمالي المبيعات" value={money(stats.revenue)} />
        <Metric label="أرباح المنصة" value={money(stats.platformRevenue)} />
        <Metric label="عدد الطلبات" value={String(stats.orderCount)} />
        <Metric label="متوسط الطلب" value={money(stats.avgOrder)} />
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-[#111827]">{value}</p>
    </div>
  );
}
