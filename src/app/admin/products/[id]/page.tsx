import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById, listAllStoresForSelect } from "@/lib/queries";
import { db } from "@/db";
import { menuSections } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) notFound();
  const [stores, sections] = await Promise.all([listAllStoresForSelect(), db.select().from(menuSections)]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">تعديل: {product.name}</h1>
        <p className="text-sm text-gray-500">حدّث التفاصيل، الصورة والإضافات</p>
      </div>
      <ProductForm
        product={{
          id: product.id,
          storeId: product.storeId,
          sectionId: product.sectionId,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          price: product.price,
          oldPrice: product.oldPrice,
          isPopular: product.isPopular,
          isAvailable: product.isAvailable,
          stock: product.stock,
          sortOrder: product.sortOrder,
          extras: product.extras.map((e) => ({ name: e.name, price: e.price })),
        }}
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        sections={sections.map((s) => ({ id: s.id, name: s.name, storeId: s.storeId }))}
      />
    </div>
  );
}
