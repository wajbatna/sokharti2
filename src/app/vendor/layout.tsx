import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, Settings, Store } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة التاجر", robots: { index: false, follow: false } };

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["vendor", "admin"].includes(user.role)) redirect("/");

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-6">
          <Link href="/vendor" className="flex items-center gap-2">
            <LogoMark />
            <span>
              <span className="block text-sm font-extrabold text-[#111827]">سخرتي</span>
              <span className="block text-[10px] font-bold text-[#FF6B35]">VENDOR</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink href="/vendor" icon={<LayoutDashboard className="h-4 w-4" />} label="الطلبات" />
            <NavLink href="/vendor/products" icon={<Package className="h-4 w-4" />} label="المنتجات" />
            <NavLink href="/vendor/settings" icon={<Settings className="h-4 w-4" />} label="محلي" />
          </nav>
          <Link href="/" className="ms-auto flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#FF6B35]">
            <Store className="h-4 w-4" /> المنصة
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:text-[#111827]">
      {icon}
      <span className="hidden sm:block">{label}</span>
    </Link>
  );
}
