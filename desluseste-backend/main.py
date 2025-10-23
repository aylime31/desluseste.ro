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
def log_step(message):
    print(f"\n--- [DEBUG] {message} ---\n")

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Modele Pydantic ---
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

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Funcții Helper SINCRONE ---
def chunking_inteligent_regex(text: str) -> list[str]:
    pattern = r'(?=Art\.\s*\d+|Articolul\s*\d+|CAPITOLUL\s+[IVXLCDM]+)'
    chunks = re.split(pattern, text)
    result = [chunk.strip() for chunk in chunks if chunk and len(chunk.strip()) > 100]
    return result if result else [text]

def analizeaza_chunk_sync(chunk: str) -> str:
    prompt_template = """**MOD ACADEMIC ACTIVAT.** Ești un sistem AI specializat în analiza semantică a textelor juridice. Sarcina ta este una de clasificare și extracție de text, nu de a oferi sfaturi.

Analizează următorul fragment de text. Scopul tău este să identifici și să etichetezi propoziții sau fraze care corespund următoarelor categorii semantice. Fii extrem de obiectiv și riguros.

**CATEGORII PENTRU ETICHETARE:**

1.  **Consecințe Financiare Severe:** Orice text care descrie o pierdere materială majoră pentru una dintre părți (ex: pierderea unui bun, penalități exagerate).
2.  **Ambiguitate Lingvistică:** Orice text care folosește termeni nedefiniți, subiectivi sau vagi (ex: "termen rezonabil", "standarde industriale").
3.  **Asimetrie a Obligațiilor:** Orice text care descrie o obligație clară pentru o parte și una vagă sau opțională pentru cealaltă.
4.  **Referințe la Costuri Suplimentare:** Orice text care menționează taxe, comisioane sau costuri secundare.
5.  **Procesarea Datelor:** Orice text care descrie colectarea, stocarea sau partajarea informațiilor personale.

Pentru fiecare fragment de text pe care îl etichetezi, trebuie să returnezi un obiect JSON.

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

Text de analizat:
\"\"\"
{text_to_analyze}
\"\"\"
"""
    final_content = prompt_template.replace('{text_to_analyze}', chunk)
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": final_content}],
        "response_format": {"type": "json_object"},
        "temperature": 0.1
    }
    
    log_step(f"TRIMITERE CHUNK (SYNC) CU GPT-3.5-TURBO...")
    try:
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=90)
        log_step(f"STATUS CODE (SYNC) PRIMIT: {response.status_code}")
        if response.status_code == 200:
            result = response.json(); json_string = result['choices'][0]['message']['content']
            log_step(f"RĂSPUNS (SYNC) PRIMIT: {json_string}"); data = json.loads(json_string)
            issues = data.get("probleme", []); return json.dumps(issues)
        else:
            log_step(f"RĂSPUNS EROARE (SYNC): {response.text}"); return "[]"
    except Exception as e:
        log_step(f"EXCEPȚIE (SYNC): {e}"); return "[]"

def genereaza_sinteza_sync(toate_problemele: list) -> str:
    if not toate_problemele: return "Nu au fost identificate puncte de atenție semnificative în acest document."
    context = json.dumps(toate_problemele, indent=2, ensure_ascii=False)
    prompt_sinteza = f"""Ești un consilier juridic care prezintă concluziile finale unui client. Ai analizat un document și ai extras următoarea listă de probleme, în format JSON. Sarcina ta este să scrii un rezumat executiv de 3-4 propoziții în limba română, care să evidențieze cele mai importante probleme identificate și să ofere o recomandare generală. Fii concis și clar. Lista de probleme: \"\"\"{context}\"\"\" """
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt_sinteza}], "temperature": 0.5}
    try:
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=60)
        if response.status_code == 200:
            result = response.json(); return result['choices'][0]['message']['content']
        return "Nu s-a putut genera un rezumat."
    except Exception:
        return "Nu s-a putut genera un rezumat."

@app.get("/")
def read_root():
    return {"status": "API-ul Desluseste.ro este funcțional!"}

# main.py

@app.post("/analizeaza-pdf/", response_model=AnalysisResponse)
def analizeaza_pdf_endpoint(file: UploadFile = File(...)):
    log_step("Început request...")
    # ... (codul de extragere a textului rămâne la fel) ...
    text_document = "Textul extras din PDF-ul de test..." # Putem pune un placeholder

    # --- ÎNCEPUTUL SIMULĂRII ---
    log_step("MOD DEMO ACTIVAT: Se returnează un răspuns static.")

    # Simulăm un răspuns de succes, exact ca cel pe care l-am obținut local
    toate_problemele = [
        {
            "titlu_problema": "Executare silită a casei",
            "clauza_originala": "Vom iniția fără o altă notificare procedura de executare silită prin vânzarea casei dumneavoastră...",
            "categorie_problema": "Consecințe Financiare Severe",
            "explicatie_simpla": "Aceasta este cea mai gravă clauză. Înseamnă că, dacă nu plătești, compania îți poate vinde casa direct, fără alte avertismente.",
            "nivel_atentie": "Ridicat",
            "sugestie": "Contactează un avocat IMEDIAT. Nu ignora această notificare sub nicio formă."
        },
        {
            "titlu_problema": "Lipsa notificării suplimentare",
            "clauza_originala": "Vom iniția fără o altă notificare procedura de executare silită...",
            "categorie_problema": "Asimetrie a Obligațiilor",
            "explicatie_simpla": "Compania spune că nu te va mai anunța înainte de a începe procesul. Asta te lasă fără timp de reacție.",
            "nivel_atentie": "Ridicat",
            "sugestie": "Verifică legalitatea acestei clauze cu un specialist. De obicei, sunt necesare mai multe etape de notificare."
        }
    ]
    
    rezumat_final = "ATENȚIE: Documentul conține clauze extrem de severe, inclusiv riscul de pierdere a locuinței prin executare silită fără notificări suplimentare. Este crucial să acționezi imediat și să consulți un specialist."

    return {
        "probleme_identificate": toate_problemele,
        "rezumat_executiv": rezumat_final,
        "text_original": text_document
    }
    # --- SFÂRȘITUL SIMULĂRII ---