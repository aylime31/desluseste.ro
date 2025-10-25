"use client";

type Nivel = "Scăzut" | "Mediu" | "Ridicat";

type Problem = {
  titlu?: string;
  categorie?: string;
  clauza_originala?: string;
  excerpt?: string;
  fragment?: string;
  nivel_atentie?: Nivel;
  recomandare?: string;
};

function badgeForLevel(n: Nivel | undefined) {
  switch (n) {
    case "Ridicat":
      return "bg-red-100 text-red-700 border border-red-200";
    case "Mediu":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    default:
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
}

export function ProblemsList({
  problems,
  activeIndex,
  onSelect,
}: {
  problems: Problem[];
  activeIndex: number | null;
  onSelect: (index: number) => void;
}) {
  if (!problems?.length) {
    return <div className="text-slate-500">Nicio problemă marcată în document.</div>;
  }

  return (
    <ul className="space-y-3">
      {problems.map((p, i) => {
        const title = p.titlu || p.categorie || "Clauză posibil problematică";
        const snippet = p.clauza_originala || p.excerpt || p.fragment || "(fragment nedisponibil)";
        const level = p.nivel_atentie || "Mediu";
        const isActive = activeIndex === i;

        return (
          <li
            key={i}
            className={
              "rounded-xl p-4 border transition-all cursor-pointer " +
              (isActive
                ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50/50"
                : "border-slate-200 hover:bg-slate-50")
            }
            onClick={() => onSelect(i)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 text-blue-500">⚑</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <span className={"text-xs px-2 py-0.5 rounded-full " + badgeForLevel(level)}>
                    {level}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-700 line-clamp-2">{snippet}</p>

                {p.recomandare ? (
                  <p className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">Sugestie: </span>
                    {p.recomandare}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
