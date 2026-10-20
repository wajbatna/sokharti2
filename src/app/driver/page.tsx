import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { DriverConsole } from "@/components/driver/DriverConsole";
import { EmptyState } from "@/components/ui";
import { LogoMark } from "@/components/brand/Logo";
import { getCurrentUser } from "@/lib/auth";
import { listAllOrders, listDrivers } from "@/lib/queries";
import { db } from "@/db";
import { drivers as driversTable } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة السائق", robots: { index: false, follow: false } };

export default async function DriverPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["driver", "admin"].includes(user.role)) redirect("/");

  const [linked] = await db.select().from(driversTable).where(eq(driversTable.userId, user.id)).limit(1);
  const all = await listDrivers();
  const driver = linked ?? all[0];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 md:px-6">
          <LogoMark />
          <span>
            <span className="block text-sm font-extrabold text-[#111827]">سخرتي</span>
            <span className="block text-[10px] font-bold text-[#FF6B35]">DRIVER</span>
          </span>
          <Link href="/" className="ms-auto text-xs font-bold text-gray-500 hover:text-[#FF6B35]">
            المنصة
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        {!driver ? (
          <EmptyState title="ما كاين حتى ملف سائق" description="تواصل مع الإدارة باش يسجلوك كسائق." />
        ) : (
          <DriverConsole
            driver={{
              id: driver.id,
              name: driver.name,
              status: driver.status,
              rating: driver.rating,
              deliveriesCount: driver.deliveriesCount,
              earnings: driver.earnings,
              vehicle: driver.vehicle,
            }}
            orders={(await listAllOrders({ limit: 60 })).map((o) => ({
              id: o.id,
              code: o.code,
              status: o.status,
              total: o.total,
              deliveryFee: o.deliveryFee,
              addressText: o.addressText,
              contactName: o.contactName,
              phone: o.phone,
              storeName: o.store.name,
              createdAt: o.createdAt.toISOString(),
              driverId: o.driverId,
            }))}
          />
        )}
      </main>
    </div>
  );
}
