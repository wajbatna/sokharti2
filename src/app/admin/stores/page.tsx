import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { StoresTable } from "@/components/admin/StoresTable";
import { listStores } from "@/lib/queries";
import { db } from "@/db";
import { stores as storesTable, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  await listStores({ limit: 1 });
  const rows = await db
    .select({
      id: storesTable.id,
      name: storesTable.name,
      slug: storesTable.slug,
      logoUrl: storesTable.logoUrl,
      city: storesTable.city,
      kind: storesTable.kind,
      status: storesTable.status,
      isOpen: storesTable.isOpen,
      deliveryFee: storesTable.deliveryFee,
      minOrder: storesTable.minOrder,
      commissionRate: storesTable.commissionRate,
      rating: storesTable.rating,
      orderCount: storesTable.orderCount,
      categoryName: categories.name,
    })
    .from(storesTable)
    .leftJoin(categories, eq(storesTable.categoryId, categories.id))
    .orderBy(storesTable.name);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">المحلات</h1>
          <p className="text-sm text-gray-500">{rows.length} محل على المنصة</p>
        </div>
        <Link href="/admin/stores/new">
          <Button>
            <Plus className="h-4 w-4" /> إضافة محل
          </Button>
        </Link>
      </div>
      <StoresTable stores={rows} />
    </div>
  );
}
