"use client";
import * as React from "react";

type Props = {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  inputId?: string;
};

export default function FileUpload({
  onFileAccepted,
  disabled = false,
  accept = "application/pdf",
  inputId = "file-input-hidden",
}: Props) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileAccepted(f);
    e.currentTarget.value = ""; // poți selecta același fișier din nou
  };

  return (
    <input
      id={inputId}
      type="file"
      accept={accept}
      hidden
      disabled={disabled}
      onChange={onChange}
    />
  );
}
