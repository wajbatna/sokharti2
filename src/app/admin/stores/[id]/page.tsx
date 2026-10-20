import { notFound } from "next/navigation";
import { StoreForm } from "@/components/admin/StoreForm";
import { getStoreById, listAllCategories, listUsers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStoreById(Number(id));
  if (!store) notFound();
  const [cats, vendors] = await Promise.all([listAllCategories(), listUsers("vendor")]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">تعديل: {store.name}</h1>
        <p className="text-sm text-gray-500">حدّث معلومات المحل، الصور وأوقات العمل</p>
      </div>
      <StoreForm
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
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
      />
    </div>
  );
}
