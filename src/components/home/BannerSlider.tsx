"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/db/schema";
import { cn } from "@/lib/utils";

const THEMES: Record<string, string> = {
  orange: "from-[#FF6B35] to-[#E4551F]",
  dark: "from-[#111827] to-[#374151]",
  green: "from-[#16A34A] to-[#22C55E]",
};

export function BannerSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [banners.length]);

  if (!banners.length) return null;

  const go = (dir: number) => setIndex((i) => (i + dir + banners.length) % banners.length);

  return (
    <div className="relative">
      <div className="relative h-[190px] overflow-hidden rounded-3xl md:h-[260px]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-all duration-700",
              i === index ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0",
            )}
          >
            <div className={cn("relative h-full w-full bg-gradient-to-l", THEMES[banner.theme] ?? THEMES.orange)}>
              {banner.imageUrl ? (
                <Image src={banner.imageUrl} alt={banner.title} fill sizes="100vw" className="object-cover opacity-45" priority={i === 0} />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-black/55" />
              <div className="relative flex h-full flex-col justify-center gap-3 p-7 md:p-12">
                <h3 className="max-w-md text-2xl font-extrabold leading-tight text-white drop-shadow md:text-4xl">{banner.title}</h3>
                {banner.subtitle ? <p className="max-w-md text-sm text-white/90 md:text-base">{banner.subtitle}</p> : null}
                <Link
                  href={banner.link ?? "/offers"}
                  className="mt-1 w-fit rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-[#111827] shadow transition hover:scale-105"
                >
                  {banner.buttonLabel ?? "اكتشف"}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 ? (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white md:flex"
            aria-label="السابق"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white md:flex"
            aria-label="التالي"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setIndex(i)}
                aria-label={`شريحة ${i + 1}`}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-white" : "w-1.5 bg-white/60")}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
