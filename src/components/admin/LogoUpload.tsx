"use client";

import { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { compressImage } from "@/lib/image-utils";

export function LogoUpload({ currentLogo, onUpload }: { currentLogo?: string, onUpload: (base64: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 400, 400, 0.8);
        onUpload(compressed);
      } catch (err) {
        console.error("Error compressing logo:", err);
        onUpload(reader.result as string); // Fallback
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-6">
      <div className="w-20 h-20 bg-[var(--bg-main)] rounded-2xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center overflow-hidden">
        {currentLogo ? (
          <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <ImageIcon className="text-[var(--text-muted)]" size={32} />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="relative cursor-pointer">
          <Button variant="secondary" loading={loading} type="button" className="pointer-events-none">
            Choose Logo
          </Button>
          <input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
        <p className="text-[10px] text-gray-400 font-medium">Recommended: Square PNG/JPG</p>
      </div>
    </div>
  );
}
