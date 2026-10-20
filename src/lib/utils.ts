import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Money helpers — prices are stored as integer centimes. */
export const toCents = (dh: number) => Math.round(dh * 100);
export const toDh = (cents: number) => cents / 100;

export function money(cents: number, withCurrency = true) {
  const value = (cents / 100).toLocaleString("fr-MA", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return withCurrency ? `${value} د.م` : value;
}

export function slugify(input: string) {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function orderCode() {
  const n = Math.floor(100000 + Math.random() * 899999);
  return `SKH-${n}`;
}

export function formatDateAr(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function timeAgoAr(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} ساعة`;
  return `قبل ${Math.floor(diff / 86400)} يوم`;
}

export const ORDER_FLOW = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "on_the_way",
  "delivered",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  received: "تم استلام الطلب",
  confirmed: "تم تأكيد الطلب",
  preparing: "قيد التحضير",
  ready: "جاهز للاستلام",
  picked_up: "تم استلامه من المحل",
  on_the_way: "في الطريق إليك",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

export const STATUS_COLOR: Record<string, string> = {
  received: "bg-amber-100 text-amber-700",
  confirmed: "bg-sky-100 text-sky-700",
  preparing: "bg-indigo-100 text-indigo-700",
  ready: "bg-violet-100 text-violet-700",
  picked_up: "bg-cyan-100 text-cyan-700",
  on_the_way: "bg-orange-100 text-orange-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export const PAYMENT_LABEL: Record<string, string> = {
  cash: "الدفع عند الاستلام",
  card: "بطاقة بنكية",
  online: "دفع إلكتروني",
};

export const SERVICE_FEE_CENTS = 300;

export const CITIES = [
  "برشيد",
  "الدار البيضاء",
  "سطات",
  "المحمدية",
  "بنسليمان",
  "الجديدة",
  "الرباط",
  "مراكش",
];

export type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
