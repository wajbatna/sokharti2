import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/db/schema";

export function CategoryRail({ categories }: { categories: Category[] }) {
  return (
    <div className="scroll-x no-scrollbar -mx-4 flex gap-3 px-4 pb-2 md:mx-0 md:px-0">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/${cat.kind === "store" ? "stores" : "restaurants"}?category=${cat.slug}`}
          className="group relative h-28 w-[124px] shrink-0 overflow-hidden rounded-3xl bg-[#111827] shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 md:h-32 md:w-[150px]"
        >
          {cat.imageUrl ? (
            <Image
              src={cat.imageUrl}
              alt={cat.name}
              fill
              sizes="150px"
              className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-110"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <span className="absolute bottom-3 right-3 text-sm font-extrabold text-white drop-shadow">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
