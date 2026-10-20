import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCurrentUser } from "@/lib/auth";
import { getProductById, getVendorStore } from "@/lib/queries";
import { db } from "@/db";
import { menuSections } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function VendorEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const store = await getVendorStore(user.id);
  const product = await getProductById(Number(id));
  if (!product || !store || product.storeId !== store.id) notFound();

  const sections = await db.select().from(menuSections).where(eq(menuSections.storeId, store.id));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-[#111827]">تعديل: {product.name}</h1>
      <ProductForm
        backHref="/vendor/products"
        lockedStoreId={store.id}
        stores={[{ id: store.id, name: store.name }]}
        sections={sections.map((s) => ({ id: s.id, name: s.name, storeId: s.storeId }))}
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
      />
    </div>
  );
}
