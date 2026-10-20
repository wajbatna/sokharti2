import { StoreForm } from "@/components/admin/StoreForm";
import { listAllCategories, listUsers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewStorePage() {
  const [cats, vendors] = await Promise.all([listAllCategories(), listUsers("vendor")]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">إضافة محل جديد</h1>
        <p className="text-sm text-gray-500">عمّر المعلومات وارفع الصور، ومن بعد المحل غادي يبان مباشرة فالمنصة</p>
      </div>
      <StoreForm categories={cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))} vendors={vendors.map((v) => ({ id: v.id, name: v.name }))} />
    </div>
  );
}
