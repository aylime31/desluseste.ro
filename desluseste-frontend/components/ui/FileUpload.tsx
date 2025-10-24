'use client';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react'; // O iconiță elegantă

// Nu uita să instalezi lucide-react: npm install lucide-react

interface FileUploadProps {
  onFileAccepted: (file: File) => void;
  disabled: boolean;
}

export function FileUpload({ onFileAccepted, disabled }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed border-slate-500 rounded-lg p-10 text-center
        cursor-pointer transition-colors duration-300
        ${isDragActive ? 'bg-slate-700 border-emerald-400' : 'bg-slate-800'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400'}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
        <UploadCloud className={`w-12 h-12 ${isDragActive ? 'text-emerald-400' : ''}`} />
        {isDragActive ? (
          <p>Eliberează fișierul aici...</p>
        ) : (
          <p>Trage fișierul PDF aici, sau <span className="font-semibold text-emerald-400">fă click pentru a selecta</span></p>
        )}
        <p className="text-xs">PDF, max. 10MB</p>
      </div>
    </div>
  );
}