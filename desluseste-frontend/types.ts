// desluseste-frontend/types.ts

export interface IssueItem {
  titlu_problema: string;
  clauza_originala: string;
  // Categoriile posibile sunt acum:
  // 'Risc Juridic Major', 'Limbaj Ambigiu/Neclar', 'Obligație Unilaterală', 
  // 'Costuri Ascunse / Comisioane', 'Confidențialitate / Date Personale'
  categorie_problema: string;
  nivel_atentie: string; // 'Scăzut', 'Mediu', 'Ridicat'
  explicatie_simpla: string;
  sugestie: string;
}

export interface AnalysisResponse {
  probleme_identificate: IssueItem[];
  rezumat_executiv: string;
  text_original: string;
}