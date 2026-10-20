"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, CreditCard, Heart, LogOut, MapPin, Package, Settings, Ticket, User } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "الملف الشخصي", icon: User },
  { href: "/account/orders", label: "طلباتي", icon: Package },
  { href: "/account/addresses", label: "عناويني", icon: MapPin },
  { href: "/account/favorites", label: "المفضلة", icon: Heart },
  { href: "/account/payments", label: "طرق الأداء", icon: CreditCard },
  { href: "/account/notifications", label: "الإشعارات", icon: Bell },
  { href: "/account/coupons", label: "كوبوناتي", icon: Ticket },
  { href: "/account/settings", label: "الإعدادات", icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition",
              active ? "bg-[#FFF1EB] text-[#E4551F]" : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
      <button
        onClick={() =>
          startTransition(async () => {
            await logoutAction();
            router.push("/");
            router.refresh();
          })
        }
        className="flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
      >
        <LogOut className="h-4 w-4" /> تسجيل الخروج
      </button>
    </nav>
  );
}
