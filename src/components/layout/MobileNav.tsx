"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Package, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/components/providers";
import { cn, money } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/search", label: "البحث", icon: Search },
  { href: "/account/orders", label: "طلباتي", icon: Package },
  { href: "/account/favorites", label: "المفضلة", icon: Heart },
  { href: "/account", label: "حسابي", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { itemCount, subtotal, setDrawerOpen } = useCart();
  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor") || pathname.startsWith("/driver")) return null;

  return (
    <>
      {itemCount > 0 && !pathname.startsWith("/checkout") ? (
        <button
          onClick={() => setDrawerOpen(true)}
          className="animate-fade-up fixed bottom-[76px] left-4 right-4 z-40 flex h-14 items-center justify-between rounded-2xl bg-[#FF6B35] px-5 text-white shadow-[0_16px_30px_-12px_rgba(255,107,53,0.9)] md:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-extrabold">
            <ShoppingBag className="h-5 w-5" /> {itemCount} منتج
          </span>
          <span className="text-sm font-extrabold">{money(subtotal)}</span>
        </button>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="flex items-stretch justify-around">
          {ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition",
                  active ? "text-[#FF6B35]" : "text-gray-500",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "fill-[#FF6B35]/10")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-[68px] md:hidden" />
    </>
  );
}
