"use client";

import * as React from "react";

export type FileUploadProps = {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  accept?: string;          // default: application/pdf
  maxSizeMB?: number;       // doar informativ; nu blochează la sânge
};

export function FileUpload({
  onFileAccepted,
  disabled = false,
  accept = "application/pdf",
  maxSizeMB = 10,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const handleFiles = React.useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      onFileAccepted(f);
    },
    [onFileAccepted]
  );

  const onDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // reset ca să poți selecta același fișier a doua oară
      e.currentTarget.value = "";
    },
    [handleFiles]
  );

  return (
    <div className="card rounded-3xl p-6 sm:p-8">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          "rounded-2xl border-2 border-dashed transition-colors",
          dragOver && !disabled ? "border-indigo-500/80" : "border-slate-400/35",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        ].join(" ")}
        style={{ outline: "none" }}
      >
        <div className="px-6 py-10 sm:px-8 sm:py-12 text-center">
          <p className="text-sm text-slate-300 mb-1">
            Trage fișierul PDF aici, sau fă click pentru a selecta
          </p>
          <p className="text-xs text-slate-400">
            {accept.includes("pdf") ? "PDF" : accept}, max. {maxSizeMB}MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        hidden
        disabled={disabled}
      />
    </div>
  );
}

export default FileUpload; // compatibil cu importul default
