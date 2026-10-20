"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, LayoutDashboard, LogOut, MapPin, Package, Search, ShoppingBag, Truck, User } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui";
import { useCart, useLocation } from "@/components/providers";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/restaurants", label: "المطاعم" },
  { href: "/stores", label: "المتاجر" },
  { href: "/offers", label: "العروض" },
  { href: "/track", label: "تتبع الطلب" },
];

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { location, openPicker } = useLocation();
  const { itemCount, setDrawerOpen } = useCart();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-[72px] md:gap-6 md:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-bold transition",
                pathname === item.href ? "bg-[#FFF1EB] text-[#E4551F]" : "text-gray-600 hover:bg-gray-50 hover:text-[#111827]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={openPicker}
          className="hidden max-w-[220px] items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-right transition hover:border-gray-300 md:flex"
        >
          <MapPin className="h-4 w-4 shrink-0 text-[#FF6B35]" />
          <span className="truncate text-xs font-bold text-gray-700">
            {location ? `${location.city} — ${location.address}` : "أدخل عنوان التوصيل"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        </button>

        <form onSubmit={submit} className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="شنو بغيتي اليوم؟"
            className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pe-4 ps-11 text-sm outline-none transition focus:border-[#FF6B35] focus:bg-white focus:ring-4 focus:ring-[#FF6B35]/10"
          />
        </form>

        <div className="ms-auto flex items-center gap-2">
          <Link href="/search" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 md:hidden" aria-label="بحث">
            <Search className="h-5 w-5" />
          </Link>

          <button
            onClick={() => setDrawerOpen(true)}
            className="relative flex h-10 items-center gap-2 rounded-full bg-[#111827] px-3.5 text-white transition hover:bg-black"
            aria-label="السلة"
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            <span className="hidden text-sm font-bold sm:block">السلة</span>
            {itemCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6B35] px-1 text-[11px] font-extrabold">
                {itemCount}
              </span>
            ) : null}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 items-center gap-2 rounded-full border border-gray-200 px-2.5 transition hover:border-gray-300"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF1EB] text-xs font-extrabold text-[#E4551F]">
                  {user.name.charAt(0)}
                </span>
                <span className="hidden max-w-[90px] truncate text-sm font-bold text-gray-700 lg:block">{user.name}</span>
              </button>
              {menuOpen ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="animate-fade-up absolute left-0 top-12 z-20 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
                    <MenuLink href="/account" icon={<User className="h-4 w-4" />} label="حسابي" onClick={() => setMenuOpen(false)} />
                    <MenuLink href="/account/orders" icon={<Package className="h-4 w-4" />} label="طلباتي" onClick={() => setMenuOpen(false)} />
                    {user.role === "admin" ? (
                      <MenuLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="لوحة التحكم" onClick={() => setMenuOpen(false)} />
                    ) : null}
                    {user.role === "vendor" ? (
                      <MenuLink href="/vendor" icon={<LayoutDashboard className="h-4 w-4" />} label="لوحة التاجر" onClick={() => setMenuOpen(false)} />
                    ) : null}
                    {user.role === "driver" ? (
                      <MenuLink href="/driver" icon={<Truck className="h-4 w-4" />} label="لوحة السائق" onClick={() => setMenuOpen(false)} />
                    ) : null}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        startTransition(async () => {
                          await logoutAction();
                          router.refresh();
                        });
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> تسجيل الخروج
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button size="sm" variant="secondary">
                دخول
              </Button>
            </Link>
          )}
        </div>
      </div>

      <button onClick={openPicker} className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-right md:hidden">
        <MapPin className="h-4 w-4 shrink-0 text-[#FF6B35]" />
        <span className="truncate text-xs font-bold text-gray-700">
          {location ? `${location.city} — ${location.address}` : "أدخل عنوان التوصيل"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
    </header>
  );
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
      {icon}
      {label}
    </Link>
  );
}
