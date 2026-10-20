import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { LocationModal } from "@/components/layout/LocationModal";
import { getCurrentUser } from "@/lib/auth";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileNav />
      <CartDrawer />
      <LocationModal />
    </div>
  );
}
