"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickedPhoto {
  url: string;
  name: string;
}

/**
 * Photo picker that opens the camera on phones. Images are downscaled and
 * compressed in the browser so they fit in local storage (prototype only).
 */
export function PhotoInput({
  value,
  onChange,
  size = "md",
  label = "Add photo",
}: {
  value: PickedPhoto | null;
  onChange: (p: PickedPhoto | null) => void;
  size?: "md" | "lg";
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const url = await compressImage(file, 960, 0.7);
      onChange({ url, name: file.name || "photo.jpg" });
    } catch {
      setError("Couldn't read that image. Try another photo.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  if (value) {
    return (
      <div className="relative w-fit">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value.url}
          alt="Attached photo preview"
          className={cn("rounded-lg border object-cover", size === "lg" ? "h-32 w-44" : "h-24 w-32")}
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-ink text-white shadow"
          aria-label="Remove photo"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-steel-300 bg-white font-semibold text-steel-700 transition hover:border-orange hover:text-navy",
          size === "lg" ? "h-14 px-5 text-base" : "h-10 px-3.5 text-sm",
        )}
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
        {busy ? "Processing…" : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
