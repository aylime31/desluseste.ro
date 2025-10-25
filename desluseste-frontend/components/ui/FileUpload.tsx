"use client";

import * as React from "react";

export type FileUploadProps = {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  accept?: string;    // implicit: application/pdf
  maxSizeMB?: number; // doar informativ
};

export function FileUpload({
  onFileAccepted,
  disabled = false,
  accept = "application/pdf",
  maxSizeMB = 10,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFileAccepted(files[0]);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.currentTarget.value = "";
  };

  return (
    <div className="dz">
      {/* rama punctată se desenează din CSS (::before) */}
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        className={["dz-inner", dragOver && !disabled ? "dz-hover" : ""].join(" ")}
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
      >
        {/* Icon PDF */}
        <div className="dz-icon" aria-hidden>
          <svg viewBox="0 0 48 48" width="56" height="56" fill="none">
            <rect x="9" y="4" width="24" height="32" rx="3" fill="white" opacity="0.9"/>
            <path d="M33 14V7.5L26.5 1H15a3 3 0 0 0-3 3v28a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-3" fill="white" opacity="0.2"/>
            <rect x="14" y="20" width="14" height="2.5" rx="1.25" fill="#7e22ce"/>
            <rect x="14" y="24.5" width="14" height="2.5" rx="1.25" fill="#7e22ce"/>
            <rect x="14" y="29" width="9" height="2.5" rx="1.25" fill="#7e22ce"/>
          </svg>
        </div>

        <div className="dz-title">Alege fișiere</div>
        <div className="dz-sub">sau trage fișiere aici</div>

        <button type="button" className="dz-btn" disabled={disabled} onClick={() => inputRef.current?.click()}>
          CHOOSE FILES
        </button>

        <div className="dz-note">
          {accept.includes("pdf") ? "PDF" : accept}, max. {maxSizeMB}MB
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
    </div>
  );
}

export default FileUpload;
