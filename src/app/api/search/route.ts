import { NextResponse } from "next/server";
import { searchEverything } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ stores: [], products: [], categories: [] });
  const results = await searchEverything(q, 12);
  return NextResponse.json(results);
}
