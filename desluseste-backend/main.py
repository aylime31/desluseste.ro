import os
import tempfile
import fitz
import re
import requests
import json
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# --- SETUP & Variabile de Mediu ---
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Modele Pydantic pentru Validarea Datelor ---
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

# --- Inițializarea Aplicației FastAPI ---
app = FastAPI(title="Desluseste.ro API", version="1.0")

# Lista explicită a originilor permise pentru CORS
origins = [
    "https://desluseste.ro",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"]
)

# --- Funcții Helper SINCRONE ---
def chunking_inteligent_regex(text: str) -> list[str]:
    """Împarte textul după articole și capitole."""
    pattern = r'(?=Art\.\s*\d+|Articolul\s*\d+|CAPITOLUL\s+[IVXLCDM]+)'
    chunks = re.split(pattern, text)
    result = [chunk.strip() for chunk in chunks if len(chunk.strip()) > 100]
    return result if result else [text]

def call_openai_api(payload: dict, timeout: int = 90) -> dict:
    """Funcție centralizată și robustă pentru apeluri către API-ul OpenAI."""
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers, json=payload, timeout=timeout
    )
    response.raise_for_status()
    return response.json()

def analizeaza_chunk(chunk: str) -> list:
    """Analizează un fragment de text și extrage problemele."""
    prompt_template = """**MOD ACADEMIC ACTIVAT.** Ești un sistem AI specializat în analiza semantică a textelor juridice. Sarcina ta este una de clasificare și extracție de text, nu de a oferi sfaturi. Analizează fragmentul de text și identifică fraze care corespund următoarelor categorii: 'Consecințe Financiare Severe', 'Ambiguitate Lingvistică', 'Asimetrie a Obligațiilor', 'Referințe la Costuri Suplimentare', 'Procesarea Datelor'.

**FORMATUL JSON DE IEȘIRE (obligatoriu):**
Răspunsul tău trebuie să fie un singur obiect JSON valid care respectă formatul cerut. Obiectul principal trebuie să conțină o cheie "probleme", care este o listă de obiecte JSON. Dacă nu găsești nimic, returnează o listă goală.

**FORMATUL FIECĂRUI OBIECT DIN LISTĂ:**
{{
  "titlu_problema": "Creează un titlu neutru, descriptiv pentru fragment (ex: 'Clauză de Executare a Garanției').",
  "clauza_originala": "Textul exact al fragmentului etichetat.",
  "categorie_problema": "Alege eticheta corespunzătoare: 'Consecințe Financiare Severe', 'Ambiguitate Lingvistică', 'Asimetrie a Obligațiilor', 'Referințe la Costuri Suplimentare', 'Procesarea Datelor'.",
  "explicatie_simpla": "Descrie obiectiv ce înseamnă acest fragment de text, fără a oferi sfaturi.",
  "nivel_atentie": "Pe baza severității descrise, atribuie un nivel de atenție: 'Scăzut', 'Mediu', 'Ridicat'.",
  "sugestie": "Formulează o sugestie neutră, de genul 'Această clauză merită o analiză suplimentară' sau 'Clarificarea acestor termeni este recomandată'."
}}

**INSTRUCȚIUNI SPECIALE:** Fii extrem de vigilent cu clauzele despre pierderea unui bun (casă, mașină) și clasifică-le ca 'Consecințe Financiare Severe' cu nivel 'Ridicat'.

**TEXT DE ANALIZAT:**
\"\"\"{text_to_analyze}\"\"\"
"""
    final_content = prompt_template.replace('{text_to_analyze}', chunk)
    
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": final_content}],
        "response_format": {"type": "json_object"},
        "temperature": 0.0
    }
    
    try:
        print(f"\n--- [DEBUG] Trimit chunk la OpenAI... ---\n")
        result = call_openai_api(payload)
        json_string = result["choices"][0]["message"]["content"]
        print(f"\n--- [DEBUG] Răspuns JSON primit: {json_string[:300]}... ---\n")
        return json.loads(json_string).get("probleme", [])
    except Exception as e:
        print(f"\n--- [DEBUG] EROARE la analizarea chunk-ului: {e} ---\n")
        return []

def genereaza_sinteza(toate_problemele: list) -> str:
    """Creează un rezumat al problemelor detectate."""
    if not toate_problemele:
        return "Nu au fost identificate puncte de atenție semnificative."
    
    context = json.dumps(toate_problemele, ensure_ascii=False)
    prompt = f"Scrie un rezumat executiv în română, de 3-4 propoziții, pentru următoarele probleme identificate într-un contract, subliniind cele mai grave: {context}"
    payload = {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}], "temperature": 0.5}
    
    try:
        result = call_openai_api(payload, 60)
        return result["choices"][0]["message"]["content"]
    except Exception:
        return "Nu s-a putut genera un rezumat."

# --- ENDPOINT-uri API ---
@app.get("/")
def read_root():
    """Endpoint de health check pentru a confirma că API-ul este online."""
    return {"status": "✅ API-ul Desluseste.ro este funcțional!"}

@app.post("/analizeaza-pdf/", response_model=AnalysisResponse)
def analizeaza_pdf_endpoint(file: UploadFile = File(...)):
    """Endpoint principal care primește un PDF, îl analizează și returnează problemele."""
    try:
        with tempfile.NamedTemporaryFile(delete=True) as temp:
            temp.write(file.file.read())
            temp.seek(0)
            text_document = "".join(page.get_text() for page in fitz.open(stream=temp.read(), filetype="pdf"))
        if not text_document.strip():
            raise HTTPException(status_code=400, detail="Fișierul PDF este gol sau nu conține text extragibil.")
    except Exception:
        raise HTTPException(status_code=500, detail="A apărut o eroare la citirea fișierului PDF.")

    chunkuri = chunking_inteligent_regex(text_document)
    toate_problemele = [problem for chunk in chunkuri for problem in analizeaza_chunk(chunk)]
    rezumat_final = genereaza_sinteza(toate_problemele)

    print(f"\n--- [DEBUG] Probleme totale găsite: {len(toate_problemele)} ---\n")
    
    return {
        "probleme_identificate": toate_problemele,
        "rezumat_executiv": rezumat_final,
        "text_original": text_document
    }