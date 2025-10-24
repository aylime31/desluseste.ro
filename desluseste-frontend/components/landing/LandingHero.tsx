import { FileText } from "lucide-react";

export function LandingHero() {
  return (
    <div className="text-center mb-10">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] rounded-2xl mb-6">
        <FileText className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
        Analizează contracte cu{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">claritate</span>
      </h1>
      <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
        Încarci PDF-ul. Primești un rezumat cinstit, riscuri evidențiate și textul original marcat. Totul în română clară.
      </p>
    </div>
  );
}
