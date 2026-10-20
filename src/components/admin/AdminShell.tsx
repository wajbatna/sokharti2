"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BadgePercent,
  BarChart3,
  Bike,
  CreditCard,
  Grid3x3,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Ticket,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { href: "/admin/stores", label: "المحلات", icon: Store },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "التصنيفات", icon: Grid3x3 },
  { href: "/admin/customers", label: "الزبناء", icon: Users },
  { href: "/admin/vendors", label: "التجار", icon: Utensils },
  { href: "/admin/drivers", label: "السائقون", icon: Bike },
  { href: "/admin/offers", label: "العروض", icon: BadgePercent },
  { href: "/admin/coupons", label: "الكوبونات", icon: Ticket },
  { href: "/admin/banners", label: "البانرات", icon: ImageIcon },
  { href: "/admin/reviews", label: "التقييمات", icon: Star },
  { href: "/admin/payments", label: "المدفوعات", icon: CreditCard },
  { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export function AdminShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]">
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[260px] overflow-y-auto border-l border-gray-100 bg-white p-4 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark />
            <span>
              <span className="block text-sm font-extrabold text-[#111827]">سخرتي</span>
              <span className="block text-[10px] font-bold text-[#FF6B35]">ADMIN</span>
            </span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="إغلاق">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="space-y-0.5">
          {LINKS.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition",
                  active ? "bg-[#111827] text-white" : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-1 border-t border-gray-100 pt-4">
          <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
            <Store className="h-4 w-4" /> عرض المنصة
          </Link>
          <button
            onClick={() =>
              startTransition(async () => {
                await logoutAction();
                router.push("/login");
                router.refresh();
              })
            }
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </aside>

      {open ? <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} /> : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur lg:px-8">
          <button onClick={() => setOpen(true)} className="lg:hidden" aria-label="القائمة">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-sm font-extrabold text-[#111827]">لوحة تحكم سخرتي</h1>
          <span className="ms-auto flex items-center gap-2 text-xs font-bold text-gray-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF1EB] text-[#E4551F]">{userName.charAt(0)}</span>
            {userName}
          </span>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
