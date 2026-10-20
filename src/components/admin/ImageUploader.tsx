"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { uploadMediaAction } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

/**
 * Uploads to the platform storage endpoint (DB-backed, served by /api/media/[id]).
 * Images are resized client-side before upload to keep payloads small.
 */
async function compress(file: File, maxSize = 1400, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", quality));
}

export function ImageUploader({
  name,
  label,
  defaultValue,
  aspect = "aspect-[16/9]",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  aspect?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    setLoading(true);
    try {
      const blob = await compress(file);
      const fd = new FormData();
      fd.append("file", new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: blob.type || file.type }));
      const res = await uploadMediaAction(fd);
      if (!res.ok) setError(res.error);
      else setUrl(res.data!.url);
    } catch {
      setError("تعذر رفع الصورة");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-bold text-gray-800">{label}</span>
      <input type="hidden" name={name} value={url} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {url ? (
        <div className={cn("relative w-full overflow-hidden rounded-2xl bg-gray-100", aspect)}>
          <Image src={url} alt={label} fill sizes="400px" className="object-cover" />
          <div className="absolute left-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-gray-700 shadow"
              aria-label="تبديل"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setUrl("")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-rose-600 shadow"
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-500 transition hover:border-[#FF6B35] hover:text-[#FF6B35]",
            aspect,
          )}
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          <span className="text-xs font-bold">{loading ? "كيتصيفط..." : "اختر صورة للرفع"}</span>
          <span className="text-[10px] text-gray-400">JPG / PNG — حتى 6 ميغا</span>
        </button>
      )}
      {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}
