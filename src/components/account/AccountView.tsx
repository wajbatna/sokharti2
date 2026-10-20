import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CreditCard, Heart, Ticket } from "lucide-react";
import { AccountNav } from "@/components/account/AccountNav";
import { AddressManager, OrdersTabs, ProfileForm } from "@/components/account/AccountSections";
import { StoreCard } from "@/components/store/StoreCard";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { listAddresses, listCoupons, listFavorites, listNotifications, listUserOrders } from "@/lib/queries";
import { formatDateAr, money, timeAgoAr } from "@/lib/utils";
import { markNotificationsReadAction } from "@/lib/actions/account";

async function markAllReadAction() {
  "use server";
  await markNotificationsReadAction();
}

export async function AccountView({ section = "profile" }: { section?: string }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1EB] text-xl font-extrabold text-[#E4551F]">
          {user.name.charAt(0)}
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[230px_1fr]">
        <aside className="md:sticky md:top-24 md:self-start">
          <AccountNav />
        </aside>
        <div>
          <Section section={section} userId={user.id} user={user} />
        </div>
      </div>
    </div>
  );
}

async function Section({
  section,
  userId,
  user,
}: {
  section: string;
  userId: number;
  user: { name: string; email: string; phone: string | null; city: string | null };
}) {
  if (section === "orders") {
    const orders = await listUserOrders(userId);
    return (
      <OrdersTabs
        orders={orders.map((o) => ({
          id: o.id,
          code: o.code,
          status: o.status,
          total: o.total,
          createdAt: o.createdAt.toISOString(),
          store: {
            id: o.store.id,
            name: o.store.name,
            slug: o.store.slug,
            logoUrl: o.store.logoUrl,
            deliveryFee: o.store.deliveryFee,
            minOrder: o.store.minOrder,
            etaMin: o.store.deliveryMinMinutes,
            etaMax: o.store.deliveryMaxMinutes,
          },
          items: o.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            name: i.name,
            imageUrl: i.imageUrl,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          })),
        }))}
      />
    );
  }

  if (section === "addresses") {
    const addresses = await listAddresses(userId);
    return (
      <AddressManager
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          city: a.city,
          street: a.street,
          details: a.details,
          notes: a.notes,
          isDefault: a.isDefault,
        }))}
      />
    );
  }

  if (section === "favorites") {
    const favorites = await listFavorites(userId);
    const empty = !favorites.stores.length && !favorites.products.length;
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-extrabold text-[#111827]">المفضلة</h2>
        {empty ? (
          <EmptyState
            icon={<Heart className="h-7 w-7" />}
            title="ما عندك حتى مفضلة"
            description="ضغط على القلب فأي محل ولا منتج باش تلقاه هنا."
            action={
              <Link href="/restaurants">
                <Button>تصفح المحلات</Button>
              </Link>
            }
          />
        ) : (
          <>
            {favorites.stores.length ? (
              <section className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-600">المحلات</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {favorites.stores.map((s) => (
                    <StoreCard key={s.id} store={s} favorite />
                  ))}
                </div>
              </section>
            ) : null}
            {favorites.products.length ? (
              <section className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-600">المنتجات</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {favorites.products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/store/${p.store.slug}`}
                      className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-gray-100 hover:ring-[#FF6B35]/40"
                    >
                      {p.imageUrl ? <Image src={p.imageUrl} alt={p.name} width={56} height={56} className="h-14 w-14 rounded-xl object-cover" /> : null}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#111827]">{p.name}</p>
                        <p className="truncate text-xs text-gray-500">{p.store.name}</p>
                      </div>
                      <span className="text-sm font-extrabold text-[#FF6B35]">{money(p.price)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    );
  }

  if (section === "notifications") {
    const items = await listNotifications(userId);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#111827]">الإشعارات</h2>
          <form action={markAllReadAction}>
            <Button size="sm" variant="outline" type="submit">
              تعليم الكل كمقروء
            </Button>
          </form>
        </div>
        {!items.length ? (
          <EmptyState icon={<Bell className="h-7 w-7" />} title="ما كاين حتى إشعار" description="غادي نخبروك بكل جديد على طلباتك والعروض." />
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                className={`block rounded-2xl p-4 ring-1 transition ${n.isRead ? "bg-white ring-gray-100" : "bg-[#FFF1EB] ring-[#FF6B35]/30"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-[#111827]">{n.title}</p>
                  <span className="text-[11px] text-gray-400">{timeAgoAr(n.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">{n.body}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (section === "coupons") {
    const coupons = await listCoupons(true);
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#111827]">كوبوناتي</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {coupons.map((c) => (
            <Card key={c.id} className="space-y-2 border-dashed">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base font-extrabold text-[#111827]">
                  <Ticket className="h-4 w-4 text-[#FF6B35]" /> {c.code}
                </span>
                <Badge tone="brand">{c.type === "percent" ? `-${c.value}%` : c.type === "fixed" ? `-${money(c.value)}` : "توصيل مجاني"}</Badge>
              </div>
              <p className="text-xs text-gray-500">{c.description}</p>
              <p className="text-[11px] text-gray-400">
                حد أدنى {money(c.minOrder)} {c.endsAt ? `· ينتهي ${formatDateAr(c.endsAt)}` : ""}
              </p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (section === "payments") {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#111827]">طرق الأداء</h2>
        <Card className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
            <CreditCard className="h-5 w-5 text-[#FF6B35]" />
            <div>
              <p className="text-sm font-extrabold text-[#111827]">الدفع عند الاستلام</p>
              <p className="text-xs text-gray-500">مفعّل افتراضياً لجميع الطلبات</p>
            </div>
            <Badge tone="success" className="ms-auto">
              مفعّل
            </Badge>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-extrabold text-[#111827]">بطاقة بنكية / محفظة إلكترونية</p>
              <p className="text-xs text-gray-500">الأداء كيتعالج عبر بوابة آمنة من جهة الخادم فقط</p>
            </div>
            <Badge className="ms-auto">جاهز للربط</Badge>
          </div>
        </Card>
      </div>
    );
  }

  if (section === "settings") {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#111827]">الإعدادات</h2>
        <Card className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
            <span className="font-bold">اللغة</span>
            <span className="font-extrabold text-[#111827]">العربية (RTL)</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
            <span className="font-bold">إشعارات الطلبات</span>
            <Badge tone="success">مفعّلة</Badge>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
            <span className="font-bold">العملة</span>
            <span className="font-extrabold text-[#111827]">درهم مغربي (MAD)</span>
          </div>
        </Card>
      </div>
    );
  }

  return <ProfileForm user={user} />;
}
