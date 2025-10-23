// desluseste-frontend/types.ts

export interface IssueItem {
  titlu_problema: string;
  clauza_originala: string;
  
  // Noile categorii din prompt-ul "Academic"
  // Posibile valori:
  // 'Consecințe Financiare Severe'
  // 'Ambiguitate Lingvistică'
  // 'Asimetrie a Obligațiilor'
  // 'Referințe la Costuri Suplimentare'
  // 'Procesarea Datelor'
  categorie_problema: string;

  explicatie_simpla: string;
  nivel_atentie: string; // 'Scăzut', 'Mediu', 'Ridicat'
  sugestie: string;
}

export interface AnalysisResponse {
  probleme_identificate: IssueItem[];
  rezumat_executiv: string;
  text_original: string;
}