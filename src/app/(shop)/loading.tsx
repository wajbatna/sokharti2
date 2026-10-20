import { GridSkeleton } from "@/components/ui";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 w-[124px] shrink-0 rounded-3xl md:h-32 md:w-[150px]" />
        ))}
      </div>
      <GridSkeleton count={8} />
    </div>
  );
}
