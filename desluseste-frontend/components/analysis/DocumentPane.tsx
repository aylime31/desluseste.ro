"use client";

import { HighlightedText } from "./HighlightedText";

export function DocumentPane({
  rawText,
  probleme,
  activeIndex,
}: {
  rawText: string;
  probleme: any[];
  activeIndex: number | null;
}) {
  return (
    <div className="card-tight sticky top-[5.5rem] h-[calc(100vh-7.5rem)] overflow-y-auto">
      <h3 className="text-sm font-medium text-muted mb-4">Text original</h3>
      <div className="pr-2">
        <HighlightedText text={rawText} probleme={probleme} activeIndex={activeIndex} />
      </div>
    </div>
  );
}
