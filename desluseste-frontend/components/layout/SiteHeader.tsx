"use client";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader({ onReset }: { onReset?: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b" style={{borderColor:"#1e293b", background:"rgba(2,6,23,.7)", backdropFilter:"blur(8px)"}}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
    {/* brand + buton reset dacă e cazul */}
  </div>
</header>

  );
}
