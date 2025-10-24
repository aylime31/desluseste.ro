"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function SiteHeader({ onReset }: { onReset?: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-[165px] h-[36px]">
            <Image
              src="/logo_nou.png"
              alt="Deslușește.ro"
              fill
              priority
              className="object-contain brightness-[0.85] hue-rotate-[10deg] drop-shadow-[0_0_10px_rgba(99,102,241,0.4)]"
            />
          </div>
        </div>
        {onReset && (
          <Button
            onClick={onReset}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 focus-visible:ring-indigo-500"
          >
            Analizează alt document
          </Button>
        )}
      </div>
    </header>
  );
}
