import { NextResponse } from "next/server";
import { getMedia } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getMedia(Number(id));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const buffer = Buffer.from(row.data, "base64");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(buffer.byteLength),
    },
  });
}
