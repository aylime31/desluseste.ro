"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Highlight {
  page: number;
  coords: { x: number; y: number; width: number; height: number };
  color: string;
  text?: string;
}

export function PdfViewer({
  fileUrl,
  highlights,
}: {
  fileUrl: string | Blob;
  highlights?: Highlight[];
}) {
  const [numPages, setNumPages] = useState<number>(0);

  return (
    <div className="bg-white shadow-md rounded-2xl border border-slate-100 p-4 flex flex-col items-center justify-center">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        className="w-full flex flex-col items-center"
      >
        {Array.from(new Array(numPages), (_, i) => (
          <div key={`page_${i + 1}`} className="relative w-full flex justify-center mb-6">
            <Page
              pageNumber={i + 1}
              width={800}
              renderAnnotationLayer={false}
              renderTextLayer={true}
            />
            {highlights
              ?.filter((h) => h.page === i + 1)
              .map((h, idx) => (
                <div
                  key={idx}
                  className="absolute rounded bg-yellow-200/60 hover:bg-yellow-300 transition-all cursor-pointer"
                  style={{
                    left: `${h.coords.x}%`,
                    top: `${h.coords.y}%`,
                    width: `${h.coords.width}%`,
                    height: `${h.coords.height}%`,
                  }}
                  title={h.text || ""}
                />
              ))}
          </div>
        ))}
      </Document>
    </div>
  );
}
