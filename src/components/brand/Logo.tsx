import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#E4551F] text-white shadow-[0_10px_24px_-12px_rgba(228,85,31,0.9)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M5 15.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M3.5 15.5h17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7.5 19h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="5.6" r="1.6" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="سخرتي">
      <LogoMark />
      {!compact ? (
        <span className="leading-none">
          <span className="block text-lg font-extrabold tracking-tight text-[#111827]">سخرتي</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B35]">SAKHRTI</span>
        </span>
      ) : null}
    </Link>
  );
}
