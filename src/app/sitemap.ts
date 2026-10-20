import type { MetadataRoute } from "next";
import { listCategories, listStores } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const statics: MetadataRoute.Sitemap = ["", "/restaurants", "/stores", "/offers", "/search", "/track"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.8,
  }));

  try {
    const [{ items }, cats] = await Promise.all([listStores({ limit: 200 }), listCategories()]);
    return [
      ...statics,
      ...items.map((s) => ({
        url: `${base}/store/${s.slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...cats.map((c) => ({
        url: `${base}/${c.kind === "store" ? "stores" : "restaurants"}?category=${c.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return statics;
  }
}
