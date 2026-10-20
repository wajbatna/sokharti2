import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    // Warm the marketplace demo data without blocking the health response.
    void ensureSeeded();
    return Response.json({ ok: true, service: "sakhrti", time: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
