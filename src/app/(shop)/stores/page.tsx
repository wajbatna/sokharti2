import type { Metadata } from "next";
import { Suspense } from "react";
import { GridSkeleton } from "@/components/ui";
import { Listing } from "@/app/(shop)/restaurants/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "المتاجر والبقالة",
  description: "بقالة، صيدليات، مخابز، تجميل وإلكترونيات — تسوق من متاجر مدينتك مع توصيل سخرتي.",
  alternates: { canonical: "/stores" },
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function StoresPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-2xl font-extrabold text-[#111827] md:text-3xl">المتاجر</h1>
        <p className="mt-1 text-sm text-gray-500">بقالة، صيدليات، مخابز ومتاجر — كلشي ديال الدار</p>
      </header>
      <Suspense fallback={<GridSkeleton />}>
        <Listing sp={sp} kind="store" />
      </Suspense>
    </div>
  );
}
