"use client";

import { HighlightedText } from "./HighlightedText";

type Problem = {
  fragment?: string;
  context?: string;
  excerpt?: string;
  start?: number;
  end?: number;
  nivel_atentie?: "Scăzut" | "Mediu" | "Ridicat";
};

export function DocumentPane({
  rawText,
  problems,
  activeIndex,
}: {
  rawText: string;
  problems: Problem[];
  activeIndex: number | null;
}) {
  return (
    <div
      className="card-tight sticky top-[5.5rem] h-[calc(100vh-7.5rem)] overflow-y-auto"
      aria-label="Document analizat"
    >
      <h3 className="text-sm font-medium text-muted mb-4">Text original</h3>
      <div className="pr-2">
        {/* ✅ prop-ul corect este 'problems', nu 'probleme' */}
        <HighlightedText
          text={rawText ?? ""}
          problems={problems ?? []}
          activeIndex={activeIndex}
        />
      </div>
    </div>
  );
}
