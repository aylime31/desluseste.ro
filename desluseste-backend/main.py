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

# --- SETUP ---
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- MODELE PYDANTIC ---
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

# --- APLICAȚIA FASTAPI ---
app = FastAPI(title="Desluseste.ro API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- FUNCȚII HELPER ---
def chunking_inteligent_regex(text: str) -> list[str]:
    """Împarte textul după articole și capitole."""
    pattern = r'(?=Art\.\s*\d+|Articolul\s*\d+|CAPITOLUL\s+[IVXLCDM]+)'
    chunks = re.split(pattern, text)
    result = [chunk.strip() for chunk in chunks if len(chunk.strip()) > 100]
    return result if result else [text]

def call_openai_api(payload: dict, timeout: int) -> dict:
    """Funcție centralizată pentru apeluri către API-ul OpenAI."""
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers, json=payload, timeout=timeout
    )
    response.raise_for_status() # Va arunca o eroare pentru status code-uri 4xx sau 5xx
    return response.json()

def analizeaza_chunk(chunk: str) -> list:
    """Analizează un fragment de text și extrage problemele."""
    prompt = f"""
Ești un sistem AI care analizează texte juridice. Identifică clauzele riscante din textul de mai jos, conform formatului JSON specificat.

**FORMATUL JSON DE IEȘIRE:**
Răspunsul tău trebuie să fie un obiect JSON cu o singură cheie, "probleme", care conține o listă de obiecte. Fiecare obiect trebuie să aibă câmpurile: "titlu_problema", "clauza_originala", "categorie_problema", "explicatie_simpla", "nivel_atentie", "sugestie".

**CATEGORII VALABILE:** 'Risc Juridic Major', 'Limbaj Ambigiu/Neclar', 'Obligație Unilaterală', 'Costuri Ascunse / Comisioane', 'Confidențialitate / Date Personale'.

**INSTRUCȚIUNI SPECIALE:** Fii extrem de vigilent. Orice clauză despre pierderea unui bun (casă, mașină) este un 'Risc Juridic Major' cu 'nivel_atentie': 'Ridicat'.

**TEXT DE ANALIZAT:**
\"\"\"{chunk}\"\"\"
"""
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.0
    }
    try:
        result = call_openai_api(payload, 90)
        json_string = result["choices"][0]["message"]["content"]
        return json.loads(json_string).get("probleme", [])
    except Exception:
        return []

def genereaza_sinteza(toate_problemele: list) -> str:
    """Creează un rezumat al problemelor detectate."""
    if not toate_problemele:
        return "Nu au fost identificate puncte de atenție semnificative."
    
    context = json.dumps(toate_problemele, ensure_ascii=False)
    prompt = f"Scrie un rezumat executiv în română, de 3-4 propoziții, pentru următoarele probleme identificate într-un contract: {context}"
    payload = {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}], "temperature": 0.5}
    
    try:
        result = call_openai_api(payload, 60)
        return result["choices"][0]["message"]["content"]
    except Exception:
        return "Nu s-a putut genera un rezumat."

# --- ENDPOINTURI ---
@app.get("/")
def read_root():
    return {"status": "API-ul Desluseste.ro este funcțional!"}

@app.post("/analizeaza-pdf/", response_model=AnalysisResponse)
def analizeaza_pdf_endpoint(file: UploadFile = File(...)):
    """Endpoint principal pentru analiza PDF-ului."""
    try:
        with tempfile.NamedTemporaryFile(delete=True) as temp:
            temp.write(file.file.read())
            temp.seek(0)
            text_document = "".join(page.get_text() for page in fitz.open(stream=temp.read(), filetype="pdf"))
        if not text_document.strip():
            raise HTTPExce