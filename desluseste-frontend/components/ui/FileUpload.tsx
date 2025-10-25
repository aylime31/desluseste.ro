"use client";
import * as React from "react";

type Props = {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;
  variant?: "light-overlay"; // folosit aici
  inputId?: string;          // id pentru input ascuns (controlat din exterior)
};

export default function FileUpload({
  onFileAccepted,
  disabled = false,
  accept = "application/pdf",
  maxSizeMB = 10,
  variant = "light-overlay",
  inputId = "file-input",
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  // expune click pe input
  React.useEffect(() => {
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    if (el) inputRef.current = el;
  }, [inputId]);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    onFileAccepted(files[0]);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  if (variant === "light-overlay") {
    return (
      <>
        <input id={inputId} type="file" accept={accept} hidden disabled={disabled}
               onChange={(e) => handleFiles(e.target.files)} />
        <div
          className={`dz2-overlay ${dragOver ? "is-hover" : ""}`}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          aria-label={`Trage fișierul aici sau apasă pentru a selecta (${accept}, max ${maxSizeMB}MB)`}
        />
      </>
    );
  }

  return null;
}
