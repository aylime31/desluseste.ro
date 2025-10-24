from pydantic import BaseModel
from typing import List


class IssueItem(BaseModel):
    titlu_problema: str
    clauza_originala: str
    categorie_problema: str
    explicatie_simpla: str
    nivel_atentie: str
    sugestie: str


class AnalysisResponse(BaseModel):
    probleme_identificate: List[IssueItem]
    rezumat_executiv: str
    text_original: str
