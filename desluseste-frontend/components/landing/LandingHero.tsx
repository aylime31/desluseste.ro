"use client";
export function LandingHero() {
  return (
    <header className="card rounded-3xl p-6 sm:p-8 text-center lg:text-left">
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Deslușește.ro</p>
      <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
        Analizează contracte cu <span style={{backgroundImage:'linear-gradient(90deg,#a5b4fc,#d8b4fe)',WebkitBackgroundClip:'text',color:'transparent'}}>claritate</span>
      </h1>
      <p className="text-sm sm:text-base text-muted">
        Încarci PDF-ul. Primești un rezumat cinstit, riscuri evidențiate și textul original marcat.
      </p>
    </header>
  );
}
