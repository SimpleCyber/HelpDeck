"use client";

import { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { compressImage } from "@/lib/image-utils";

export function LogoUpload({
  currentLogo,
  onUpload,
}: {
  currentLogo?: string;
  onUpload: (base64: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // 1. Read and compress
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const compressedBase64 = await compressImage(base64, 400, 400, 0.8);

      // 2. To Blob
      const response = await fetch(compressedBase64);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, "logo.jpg");
      formData.append("folder", "logos");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      onUpload(data.secure_url);
    } catch (err) {
      console.error("Error uploading logo:", err);
      alert("Failed to upload logo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <div className="w-20 h-20 bg-[var(--bg-main)] rounded-2xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center overflow-hidden">
        {currentLogo ? (
          <img
            src={currentLogo}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        ) : (
          <ImageIcon className="text-[var(--text-muted)]" size={32} />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="relative cursor-pointer">
          <Button
            variant="secondary"
            loading={loading}
            type="button"
            className="pointer-events-none"
          >
            Choose Logo
          </Button>
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
        <p className="text-[10px] text-gray-400 font-medium">
          Recommended: Square PNG/JPG
        </p>
      </div>
    </div>
  );
}
