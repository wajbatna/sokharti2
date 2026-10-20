import { notFound } from "next/navigation";
import {
  AnalyticsView,
  BannersManager,
  CategoriesManager,
  CouponsManager,
  DriversManager,
  OffersManager,
  PaymentsTable,
  ReviewsModeration,
  SettingsForm,
  UsersTable,
} from "@/components/admin/AdminTables";
import {
  getAdminStats,
  getSetting,
  listAllCategories,
  listAllStoresForSelect,
  listBanners,
  listCoupons,
  listDrivers,
  listOffers,
  listPayments,
  listReviews,
  listUsers,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  switch (section) {
    case "categories": {
      const categories = await listAllCategories();
      return <CategoriesManager categories={categories} />;
    }
    case "banners": {
      const banners = await listBanners(false);
      return <BannersManager banners={banners} />;
    }
    case "coupons": {
      const [coupons, stores] = await Promise.all([listCoupons(), listAllStoresForSelect()]);
      return <CouponsManager coupons={coupons} stores={stores.map((s) => ({ id: s.id, name: s.name }))} />;
    }
    case "customers": {
      const users = await listUsers("customer");
      return <UsersTable users={users} title="الزبناء" />;
    }
    case "vendors": {
      const users = await listUsers("vendor");
      return <UsersTable users={users} title="التجار" />;
    }
    case "drivers": {
      const drivers = await listDrivers();
      return <DriversManager drivers={drivers} />;
    }
    case "reviews": {
      const reviews = await listReviews();
      return <ReviewsModeration reviews={reviews} />;
    }
    case "payments": {
      const payments = await listPayments();
      return <PaymentsTable payments={payments} />;
    }
    case "offers": {
      const [offers, stores] = await Promise.all([listOffers(), listAllStoresForSelect()]);
      return <OffersManager offers={offers} stores={stores.map((s) => ({ id: s.id, name: s.name }))} />;
    }
    case "analytics": {
      const stats = await getAdminStats();
      return <AnalyticsView stats={stats} />;
    }
    case "settings": {
      const platform = await getSetting<{ name?: string; tagline?: string; serviceFee?: number; defaultCommission?: number; supportPhone?: string }>("platform");
      return <SettingsForm platform={platform ?? {}} />;
    }
    default:
      notFound();
  }
}
