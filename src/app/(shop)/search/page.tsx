import type { Metadata } from "next";
import { SearchClient } from "@/components/search/SearchClient";
import { getPopularSearches, listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "البحث",
  description: "قلب على المطاعم، المتاجر والمنتجات فسخرتي.",
  alternates: { canonical: "/search" },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [popular, cats] = await Promise.all([getPopularSearches(), listCategories()]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <SearchClient initialQuery={q ?? ""} popular={popular} categories={cats.map((c) => ({ slug: c.slug, name: c.name, kind: c.kind }))} />
    </div>
  );
}
