"use client";
import { RiskList } from "@/components/analysis/RiskList";

export function ProblemsPane({
  count,
  problems,
  onSelect,
}: {
  count: number;
  problems: any[];
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="card-tight">
      <h3 className="text-sm font-medium text-muted mb-4">
        Probleme identificate ({count})
      </h3>
      <div className="max-h-[600px] overflow-y-auto pr-2">
        <RiskList probleme={problems} onSelect={onSelect} />
      </div>
    </div>
  );
}
