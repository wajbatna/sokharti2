import { ProductForm } from "@/components/admin/ProductForm";
import { listAllStoresForSelect } from "@/lib/queries";
import { db } from "@/db";
import { menuSections } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [stores, sections] = await Promise.all([listAllStoresForSelect(), db.select().from(menuSections)]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">إضافة منتج</h1>
        <p className="text-sm text-gray-500">المنتج غادي يبان مباشرة فصفحة المحل بعد الحفظ</p>
      </div>
      <ProductForm
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        sections={sections.map((s) => ({ id: s.id, name: s.name, storeId: s.storeId }))}
      />
    </div>
  );
}
