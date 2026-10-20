import { redirect } from "next/navigation";
import { StoreForm } from "@/components/admin/StoreForm";
import { EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getStoreById, getVendorStore, listAllCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const base = await getVendorStore(user.id);
  if (!base) return <EmptyState title="ما عندك حتى محل" description="تواصل مع الإدارة باش يربطو محلك." />;
  const store = await getStoreById(base.id);
  const cats = await listAllCategories();
  if (!store) return <EmptyState title="المحل غير موجود" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">إعدادات المحل</h1>
        <p className="text-sm text-gray-500">حدّث معلومات محلك، الصور وأوقات العمل</p>
      </div>
      <StoreForm
        vendorMode
        store={{
          id: store.id,
          name: store.name,
          nameEn: store.nameEn,
          description: store.description,
          logoUrl: store.logoUrl,
          coverUrl: store.coverUrl,
          phone: store.phone,
          address: store.address,
          city: store.city,
          lat: store.lat,
          lng: store.lng,
          categoryId: store.categoryId,
          kind: store.kind,
          deliveryFee: store.deliveryFee,
          minOrder: store.minOrder,
          deliveryRadiusKm: store.deliveryRadiusKm,
          deliveryMinMinutes: store.deliveryMinMinutes,
          deliveryMaxMinutes: store.deliveryMaxMinutes,
          commissionRate: store.commissionRate,
          status: store.status,
          isOpen: store.isOpen,
          isFeatured: store.isFeatured,
          isNew: store.isNew,
          freeDelivery: store.freeDelivery,
          discountLabel: store.discountLabel,
          ownerId: store.ownerId,
          hours: store.hours.map((h) => ({ dayOfWeek: h.dayOfWeek, openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed })),
        }}
        categories={cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
        vendors={[]}
      />
    </div>
  );
}
