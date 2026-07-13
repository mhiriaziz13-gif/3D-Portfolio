"use client";

import Image from "next/image";
import { useState } from "react";
import { FiImage } from "react-icons/fi";

type AssetImagePreviewProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
};

const isPreviewableSource = (src: string) =>
  (src.startsWith("/") && !src.startsWith("//")) || src.toLowerCase().startsWith("https://");

export function AssetImagePreview({
  src,
  alt,
  className = "h-36 w-full",
  sizes = "(max-width: 640px) 100vw, 320px",
}: AssetImagePreviewProps) {
  const [failed, setFailed] = useState(false);
  const canPreview = isPreviewableSource(src);

  if (!canPreview || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/20 text-gray-500 ${className}`}
        role="img"
        aria-label={failed ? `${alt} could not be loaded` : `${alt} is not available`}
      >
        <FiImage aria-hidden="true" className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-white/10 bg-black/20 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
