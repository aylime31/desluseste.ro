"use client";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader({ onReset }: { onReset?: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] rounded-xl flex items-center justify-center shadow-soft">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-base sm:text-lg font-semibold">Deslușește.ro</span>
        </div>
        {onReset && (
          <Button onClick={onReset} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 focus-ring">
            Analizează alt document
          </Button>
        )}
      </div>
    </header>
  );
}
