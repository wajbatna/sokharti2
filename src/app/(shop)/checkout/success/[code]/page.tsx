import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MapPin, Receipt } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { getOrderByCode } from "@/lib/queries";
import { PAYMENT_LABEL, money } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تم تأكيد الطلب", robots: { index: false } };

export default async function OrderSuccessPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await getOrderByCode(decodeURIComponent(code));
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:px-6">
      <Card className="animate-fade-up space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50">
          <CheckCircle2 className="h-10 w-10 text-[#22C55E]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">🎉 تم تأكيد طلبك</h1>
          <p className="mt-1 text-sm text-gray-500">غادي نبداو نوجدوه دابا، وغادي تقدر تتبعو مباشرة.</p>
        </div>

        <div className="space-y-3 rounded-3xl bg-gray-50 p-5 text-right">
          <Row icon={<Receipt className="h-4 w-4" />} label="رقم الطلب" value={`#${order.code}`} />
          <Row icon={<MapPin className="h-4 w-4" />} label="المحل" value={order.store.name} />
          <Row icon={<Clock className="h-4 w-4" />} label="الوصول المتوقع" value={`${order.store.deliveryMinMinutes}–${order.store.deliveryMaxMinutes} دقيقة`} />
          <Row icon={<Receipt className="h-4 w-4" />} label="طريقة الأداء" value={PAYMENT_LABEL[order.paymentMethod]} />
          <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-base font-extrabold text-[#111827]">
            <span>المجموع</span>
            <span>{money(order.total)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/orders/${order.code}`} className="flex-1">
            <Button size="lg" className="w-full">
              تتبع الطلب
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button size="lg" variant="outline" className="w-full">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-gray-500">
        <span className="text-[#FF6B35]">{icon}</span>
        {label}
      </span>
      <span className="font-extrabold text-[#111827]">{value}</span>
    </div>
  );
}
