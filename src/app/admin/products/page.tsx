import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { listAdminProducts, listAllStoresForSelect } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [rows, stores] = await Promise.all([listAdminProducts(), listAllStoresForSelect()]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">المنتجات</h1>
          <p className="text-sm text-gray-500">{rows.length} منتج على المنصة</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4" /> إضافة منتج
          </Button>
        </Link>
      </div>

      <ProductsTable
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        products={rows.map((r) => ({
          id: r.product.id,
          name: r.product.name,
          imageUrl: r.product.imageUrl,
          price: r.product.price,
          oldPrice: r.product.oldPrice,
          isAvailable: r.product.isAvailable,
          isPopular: r.product.isPopular,
          stock: r.product.stock,
          storeName: r.storeName,
          storeId: r.product.storeId,
        }))}
      />
    </div>
  );
}
