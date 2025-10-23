import os
import tempfile
import fitz
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

# --- Modele Pydantic ---
class IssueItem(BaseModel):
    titlu_problema: str
    clauza_originala: str
    explicatie_simpla: str
    nivel_atentie: str

class AnalysisResponse(BaseModel):
    probleme_identificate: List[IssueItem]
    rezumat_executiv: str
    text_original: str

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Endpoint-ul principal (SIMPLIFICAT) ---
@app.post("/analizeaza-pdf/", response_model=AnalysisResponse)
def analizeaza_pdf_endpoint(file: UploadFile = File(...)):
    print("\n--- [DEBUG] Început request 'Forța Brută' ---\n")
    
    # --- 1. EXTRAGERE TEXT (neschimbat) ---
    try:
        with tempfile.NamedTemporaryFile(delete=True) as temp:
            temp.write(file.file.read()); temp.seek(0)
            text_document = "".join(page.get_text() for page in fitz.open(stream=temp.read(), filetype="pdf"))
        if not text_document.strip(): raise HTTPException(status_code=400, detail="PDF-ul nu conține text.")
    except Exception:
        raise HTTPException(status_code=500, detail="Eroare la procesarea PDF.")

    print(f"\n--- [DEBUG] Text extras. Lungime: {len(text_document)} caractere. ---\n")

    # --- 2. APEL UNIC LA OPENAI (FĂRĂ CHUNKING) ---
    prompt_simplu = f"""
Ești un AI care detectează clauze periculoase într-un text. Analizează textul de mai jos și extrage orice clauză despre executare silită, vânzarea unui bun (casă, mașină) sau penalități.

Returnează un obiect JSON cu o cheie "probleme", care conține o listă de obiecte. 
Fiecare obiect trebuie să aibă câmpurile: "titlu_problema", "clauza_originala", "explicatie_simpla", "nivel_atentie" ('Ridicat').

Dacă nu găsești nimic, returnează o listă goală.

TEXTUL ESTE:
\"\"\"{text_document}\"\"\"
"""
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt_simplu}],
        "response_format": {"type": "json_object"},
        "temperature": 0.0
    }

    toate_problemele = []
    try:
        print("\n--- [DEBUG] Trimit tot textul la OpenAI... ---\n")
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=120)
        print(f"\n--- [DEBUG] Status code primit: {response.status_code} ---\n")
        
        if response.status_code == 200:
            result = response.json()
            json_string = result["choices"][0]["message"]["content"]
            print(f"\n--- [DEBUG] Răspuns primit: {json_string} ---\n")
            toate_problemele = json.loads(json_string).get("probleme", [])
        else:
            print(f"\n--- [DEBUG] Eroare API: {response.text} ---\n")
            
    except Exception as e:
        print(f"\n--- [DEBUG] Excepție în timpul apelului API: {e} ---\n")

    # --- 3. REZUMAT SIMPLU ---
    rezumat_final = f"Au fost identificate {len(toate_problemele)} probleme." if toate_problemele else "Nu au fost identificate probleme semnificative."

    return {
        "probleme_identificate": toate_problemele,
        "rezumat_executiv": rezumat_final,
        "text_original": text_document
    }