import { redirect } from "next/navigation";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { ProductForm } from "@/components/admin/ProductForm";
import { Card, EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getVendorStore, listStoreProducts } from "@/lib/queries";
import { db } from "@/db";
import { menuSections } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function VendorProductsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const store = await getVendorStore(user.id);
  if (!store) return <EmptyState title="ما عندك حتى محل" description="تواصل مع الإدارة." />;

  const [products, sections] = await Promise.all([
    listStoreProducts(store.id),
    db.select().from(menuSections).where(eq(menuSections.storeId, store.id)),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#111827]">منتجات {store.name}</h1>

      <Card>
        <h2 className="mb-4 text-base font-extrabold text-[#111827]">إضافة منتج جديد</h2>
        <ProductForm
          stores={[{ id: store.id, name: store.name }]}
          sections={sections.map((s) => ({ id: s.id, name: s.name, storeId: s.storeId }))}
          lockedStoreId={store.id}
          backHref="/vendor/products"
        />
      </Card>

      <ProductsTable
        editBase="/vendor/products"
        stores={[{ id: store.id, name: store.name }]}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          price: p.price,
          oldPrice: p.oldPrice,
          isAvailable: p.isAvailable,
          isPopular: p.isPopular,
          stock: p.stock,
          storeName: store.name,
          storeId: store.id,
        }))}
      />
    </div>
  );
}
