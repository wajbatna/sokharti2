import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { listUserOrders } from "@/lib/queries";
import { STATUS_COLOR, STATUS_LABEL, formatDateAr, money } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تتبع الطلب", description: "تبع طلبك ديال سخرتي خطوة بخطوة." };

async function trackAction(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code) redirect(`/orders/${encodeURIComponent(code)}`);
}

export default async function TrackPage() {
  const user = await getCurrentUser();
  const orders = user ? (await listUserOrders(user.id)).slice(0, 4) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6">
      <Card className="space-y-5 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF1EB] text-[#FF6B35]">
          <PackageSearch className="h-8 w-8" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">تتبع الطلب</h1>
          <p className="mt-1 text-sm text-gray-500">دخل رقم الطلب (مثال: SKH-102938) باش تشوف فين وصل</p>
        </div>
        <form action={trackAction} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
          <Field className="flex-1">
            <Input name="code" placeholder="SKH-XXXXXX" className="text-center font-extrabold" required />
          </Field>
          <Button type="submit" size="lg">
            تتبع
          </Button>
        </form>
      </Card>

      {orders.length ? (
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-[#111827]">طلباتك الأخيرة</h2>
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.code}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 transition hover:ring-[#FF6B35]/40"
            >
              <div>
                <p className="text-sm font-extrabold text-[#111827]">#{order.code}</p>
                <p className="text-xs text-gray-500">
                  {order.store.name} · {formatDateAr(order.createdAt)}
                </p>
              </div>
              <div className="text-left">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                <p className="mt-1 text-sm font-extrabold text-[#111827]">{money(order.total)}</p>
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}
