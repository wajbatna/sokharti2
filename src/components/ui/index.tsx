"use client";

import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Loader2, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------- Button -------------------------------- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "dark";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
};

export function Button({ className, variant = "primary", size = "md", loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[#FF6B35] text-white shadow-[0_8px_20px_-8px_rgba(255,107,53,0.8)] hover:bg-[#E4551F]",
        variant === "secondary" && "bg-[#FFF1EB] text-[#E4551F] hover:bg-[#ffe3d6]",
        variant === "ghost" && "text-gray-700 hover:bg-gray-100",
        variant === "outline" && "border border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        variant === "dark" && "bg-[#111827] text-white hover:bg-black",
        size === "sm" && "h-9 px-4 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-14 px-7 text-base",
        size === "icon" && "h-10 w-10",
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

/* -------------------------------- Badge --------------------------------- */
export function Badge({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "brand" | "success" | "dark" | "warn" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none",
        tone === "default" && "bg-gray-100 text-gray-700",
        tone === "brand" && "bg-[#FF6B35] text-white",
        tone === "success" && "bg-emerald-100 text-emerald-700",
        tone === "dark" && "bg-[#111827] text-white",
        tone === "warn" && "bg-amber-100 text-amber-700",
        tone === "muted" && "bg-white/90 text-gray-800 backdrop-blur",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Inputs -------------------------------- */
export function Field({ label, hint, children, className }: { label?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      {label ? <span className="text-sm font-bold text-gray-800">{label}</span> : null}
      {children}
      {hint ? <span className="block text-xs text-gray-500">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/10",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/10",
        className,
      )}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-12 w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/10",
        className,
      )}
    >
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
      aria-pressed={checked}
    >
      <span className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-[#22C55E]" : "bg-gray-300")}>
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "right-0.5" : "right-[22px]",
          )}
        />
      </span>
      {label ? <span className="text-sm font-semibold text-gray-700">{label}</span> : null}
    </button>
  );
}

/* -------------------------------- Card ---------------------------------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_2px_18px_-12px_rgba(17,24,39,0.25)]", className)}>{children}</div>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xl font-extrabold text-[#111827] md:text-2xl">{title}</h2>
      {action}
    </div>
  );
}

/* ------------------------------ Skeletons -------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} />;
}

export function StoreCardSkeleton() {
  return (
    <div className="w-[280px] shrink-0 space-y-3">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Empty state ------------------------------ */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
      {icon ? <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF1EB] text-[#FF6B35]">{icon}</div> : null}
      <h3 className="text-lg font-extrabold text-[#111827]">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* -------------------------------- Rating --------------------------------- */
export function Rating({ value, size = 14, showValue = true }: { value: number; size?: number; showValue?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[#111827]">
      <Star className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} />
      {showValue ? <span className="text-xs font-bold">{value.toFixed(1)}</span> : null}
    </span>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-row-reverse justify-end gap-1">
      {[5, 4, 3, 2, 1].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} نجوم`}>
          <Star className={cn("h-7 w-7 transition", n <= value ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
        </button>
      ))}
    </div>
  );
}

/* --------------------------- Modal / BottomSheet -------------------------- */
export function Sheet({
  open,
  onClose,
  children,
  side = "center",
  className,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: "center" | "right" | "bottom";
  className?: string;
  label?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex" role="dialog" aria-modal="true" aria-label={label}>
      <div className="animate-fade absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 flex max-h-full w-full flex-col bg-white shadow-2xl",
          side === "center" && "animate-sheet m-auto max-w-lg rounded-3xl",
          side === "right" && "animate-drawer ms-0 me-auto h-full max-w-md",
          side === "bottom" && "animate-sheet mt-auto rounded-t-3xl sm:m-auto sm:max-w-lg sm:rounded-3xl",
          className,
        )}
      >
        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-white"
          aria-label="إغلاق"
        >
          <X className="h-4.5 w-4.5" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* --------------------------------- Tabs ---------------------------------- */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar flex gap-2 overflow-x-auto", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition",
            active === tab.id ? "bg-[#111827] text-white" : "bg-white text-gray-600 hover:bg-gray-100",
          )}
        >
          {tab.label}
          {typeof tab.count === "number" ? <span className="ms-1 opacity-70">({tab.count})</span> : null}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- Stat card -------------------------------- */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "brand" | "dark" | "green" | "blue";
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-[#111827]">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl",
              tone === "brand" && "bg-[#FFF1EB] text-[#FF6B35]",
              tone === "dark" && "bg-gray-100 text-[#111827]",
              tone === "green" && "bg-emerald-50 text-emerald-600",
              tone === "blue" && "bg-sky-50 text-sky-600",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold",
        tone === "error" && "bg-rose-50 text-rose-700",
        tone === "success" && "bg-emerald-50 text-emerald-700",
        tone === "info" && "bg-sky-50 text-sky-700",
      )}
    >
      {children}
    </div>
  );
}
