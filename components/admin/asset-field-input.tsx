"use client";

import { useCallback, useId, useRef, useState } from "react";
import { FiFileText, FiFolder, FiTrash2, FiUploadCloud } from "react-icons/fi";

import type { UploadBucket, UploadRecord } from "@/lib/cms-types";

import {
  adminApiError,
  type AdminRequest,
  readJsonObject,
} from "./admin-api";
import { AssetImagePreview } from "./asset-image-preview";
import { AssetPicker } from "./asset-picker";

type AssetFieldInputProps = {
  label: string;
  value: string;
  kind: "image" | "document";
  bucket: UploadBucket;
  accept: string;
  allowedMimeTypes: readonly string[];
  required?: boolean;
  placeholder?: string;
  request: AdminRequest;
  onChange: (value: string) => void;
};

const inputClass = "w-full rounded-lg border border-white/10 bg-[#151030] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60";
const isSafeAssetUrl = (value: string) =>
  (value.startsWith("/") && !value.startsWith("//")) || value.toLowerCase().startsWith("https://");
const fileNameFromValue = (value: string) => {
  const withoutQuery = value.split(/[?#]/, 1)[0];
  const name = withoutQuery.split("/").pop() || value;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

export function AssetFieldInput({
  label,
  value,
  kind,
  bucket,
  accept,
  allowedMimeTypes,
  required,
  placeholder,
  request,
  onChange,
}: AssetFieldInputProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const closePicker = useCallback(() => setPickerOpen(false), []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setStatus("Uploading asset...");
    const formData = new FormData();
    formData.set("bucket", bucket);
    formData.set("file", file);

    try {
      const response = await request("/api/admin/upload", { method: "POST", body: formData });
      const data = await readJsonObject(response);
      const publicUrl = typeof data.publicUrl === "string" ? data.publicUrl : "";
      if (!response.ok || data.ok !== true || !publicUrl) {
        setStatus(response.ok && data.ok === true
          ? "The upload completed, but this asset has no public URL."
          : adminApiError(data));
        return;
      }

      onChange(publicUrl);
      setStatus("Asset uploaded and added to this draft. Click Save to publish the change.");
    } catch {
      setStatus("The asset could not be uploaded. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const chooseAsset = (asset: UploadRecord) => {
    if (!asset.public_url) return;
    onChange(asset.public_url);
    setStatus("Existing asset added to this draft. Click Save to publish the change.");
    setPickerOpen(false);
  };

  return (
    <div className="grid gap-2 text-sm text-gray-300 md:col-span-2">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setStatus("");
        }}
        className={inputClass}
        required={required}
        placeholder={placeholder ?? (kind === "image" ? "/profile/avatar.png or https://..." : "/resume/cv.pdf or https://...")}
      />

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          tabIndex={-1}
          className="sr-only"
          aria-hidden="true"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void uploadFile(file);
            event.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-400/15 disabled:cursor-wait disabled:opacity-60"
        >
          <FiUploadCloud aria-hidden="true" />
          {uploading ? "Uploading..." : "Upload new"}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-white/10"
        >
          <FiFolder aria-hidden="true" />
          Choose existing
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setStatus("Asset cleared from this draft. Click Save to persist the change.");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-100 hover:bg-red-500/20"
          >
            <FiTrash2 aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      {value && kind === "image" && (
        <AssetImagePreview
          key={value}
          src={value}
          alt={`${label} preview`}
          className="h-40 w-full max-w-sm"
        />
      )}

      {value && kind === "document" && (
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <FiFileText aria-hidden="true" className="h-7 w-7 shrink-0 text-cyan-200" />
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{fileNameFromValue(value)}</p>
            {isSafeAssetUrl(value) && (
              <a href={value} target="_blank" rel="noreferrer" className="text-xs text-cyan-200 hover:text-cyan-100">
                Open document preview
              </a>
            )}
          </div>
        </div>
      )}

      <p className="min-h-5 text-xs text-cyan-100" aria-live="polite">{status}</p>

      {pickerOpen && (
        <AssetPicker
          bucket={bucket}
          allowedMimeTypes={allowedMimeTypes}
          request={request}
          onSelect={chooseAsset}
          onClose={closePicker}
        />
      )}
    </div>
  );
}
