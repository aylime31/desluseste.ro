import os
import tempfile
import fitz
import re
import requests # Am înlocuit aiohttp și asyncio cu requests
import json
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# --- LOGGING SETUP ---
def log_step(message):
    print(f"\n--- [DEBUG] {message} ---\n")

# --- Încărcare .env ---
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if OPENAI_API_KEY:
    print(f"--- [DEBUG] Cheia API a fost încărcată cu succes. Se termină în: ...{OPENAI_API_KEY[-4:]}")
else:
    print("--- [DEBUG] EROARE CRITICĂ: Cheia API NU a fost încărcată.")

# --- Modele Pydantic (neschimbate) ---
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

# --- Middleware CORS (neschimbat) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Funcții Helper ---
def chunking_inteligent_regex(text: str) -> list[str]:
    pattern = r'(?=Art\.\s*\d+|Articolul\s*\d+|CAPITOLUL\s+[IVXLCDM]+)'
    chunks = re.split(pattern, text)
    result = [chunk.strip() for chunk in chunks if chunk and len(chunk.strip()) > 100]
    if not result: return [text]
    return result

# --- START MODIFICARE: Funcție de analiză SINCRONĂ cu `requests` ---
def analizeaza_chunk_sync(chunk: str, tip_document: str) -> str:
    prompt_analiza = f"""
Ești un avocat extrem de vigilent și protector, specializat în a "traduce" documente complexe pentru consumatori. Sarcina ta este să acționezi ca un "gardian" și să identifici **ORICE** element care ar putea fi dezavantajos, neclar sau care merită o atenție specială, nu doar riscurile legale evidente.

Analizează fragmentul de text de mai jos dintr-un document de tip "{tip_document}". Pentru fiecare problemă identificată, clasific-o într-una din următoarele categorii:

1.  **Risc Juridic:** Clauze clasic riscante (penalități, reziliere unilaterală, etc.).
2.  **Limbaj Ambigiu/Neclar:** Termeni vagi sau jargon legal care fac clauza greu de înțeles (ex: "perioadă rezonabilă", "eforturi comerciale substanțiale").
3.  **Obligație Unilaterală:** O clauză care impune o obligație clară ție, dar una foarte vagă sau inexistentă celeilalte părți.
4.  **Costuri Ascunse / Comisioane:** Orice mențiune despre taxe, comisioane sau costuri care nu sunt evidente la prima vedere.
5.  **Confidențialitate / Date Personale:** Cum sunt folosite datele tale, cine are acces la ele, pe ce perioadă. Fii foarte strict aici.
6.  **Renunțare la Drepturi:** Orice clauză prin care renunți la un drept legal (ex: dreptul de a da în judecată, dreptul la despăgubiri).

Răspunsul tău trebuie să fie un singur obiect JSON care conține o cheie "probleme", iar valoarea acesteia să fie o listă de obiecte. Dacă nu găsești nicio problemă, returnează o listă goală.

Formatul **fiecărui obiect** din listă trebuie să fie **exact** acesta:
{{
  "titlu_problema": "Un titlu scurt și la obiect pentru problemă (max 5-7 cuvinte).",
  "clauza_originala": "Textul exact al clauzei sau frazei cu probleme.",
  "categorie_problema": "Alege **EXCLUSIV** una din valorile: 'Risc Juridic', 'Limbaj Ambigiu/Neclar', 'Obligație Unilaterală', 'Costuri Ascunse / Comisioane', 'Confidențialitate / Date Personale', 'Renunțare la Drepturi'.",
  "explicatie_simpla": "Explică problema într-un limbaj extrem de simplu. Focusează-te pe impactul asupra utilizatorului.",
  "nivel_atentie": "Alege: 'Scăzut', 'Mediu', 'Ridicat'.",
  "sugestie": "O sugestie acționabilă (ex: 'Cere clarificări scrise', 'Fii conștient de acest aspect', 'Negociază această clauză')."
}}

Text de analizat:
\"\"\"
{chunk}
\"\"\"
"""
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = { "model": "gpt-4o", "messages": [{"role": "user", "content": prompt_analiza}], "response_format": {"type": "json_object"} }
    
    log_step(f"TRIMITERE CHUNK (SYNC) CĂTRE OPENAI...")
    try:
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=90)
        
        log_step(f"STATUS CODE (SYNC) PRIMIT: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            json_string = result['choices'][0]['message']['content']
            log_step(f"RĂSPUNS (SYNC) PRIMIT: {json_string}")
            data = json.loads(json_string)
            issues = data.get("probleme", [])
            return json.dumps(issues)
        else:
            log_step(f"RĂSPUNS EROARE (SYNC): {response.text}")
            return "[]"
    except Exception as e:
        log_step(f"EXCEPȚIE (SYNC) ÎN analizeaza_chunk: {e}")
        return "[]"
# --- END MODIFICARE ---

def genereaza_sinteza_sync(toate_problemele: list) -> str:
    if not toate_problemele: return "Nu au fost identificate puncte de atenție semnificative în document."
    context = json.dumps(toate_problemele, indent=2, ensure_ascii=False)
    prompt_sinteza = f"""Ești un consilier juridic... (promptul complet de sinteză)..."""
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": "gpt-4o", "messages": [{"role": "user", "content": prompt_sinteza}], "temperature": 0.5}
    try:
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=60)
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content']
        return "Nu s-a putut genera un rezumat."
    except Exception:
        return "Nu s-a putut genera un rezumat."

@app.get("/")
def read_root():
    return {"status": "API-ul Desluseste.ro este funcțional!"}

@app.post("/analizeaza-pdf/", response_model=AnalysisResponse)
async def analizeaza_pdf_endpoint(file: UploadFile = File(...)):
    log_step("Început request /analizeaza-pdf/")
    
    try:
        text_document = ""
        with tempfile.NamedTemporaryFile(delete=True, suffix=".pdf") as temp:
            temp.write(await file.read())
            temp.seek(0)
            with fitz.open(stream=temp.read(), filetype="pdf") as doc:
                text_document = "".join(page.get_text() for page in doc)
        log_step(f"TEXT EXTRAS (primele 200 caractere): {text_document[:200]}...")
        if not text_document.strip(): raise HTTPException(status_code=400, detail="Documentul PDF nu conține text extragibil.")
    except Exception as e:
        log_step(f"EROARE LA EXTRAGEREA TEXTULUI: {e}")
        raise HTTPException(status_code=500, detail=f"A apărut o eroare la procesarea PDF: {str(e)}")

    chunkuri = chunking_inteligent_regex(text_document)
    log_step(f"Document împărțit în {len(chunkuri)} bucăți.")

    # --- START MODIFICARE: Folosire loop SINCRON în loc de asyncio ---
    toate_problemele = []
    for chunk in chunkuri:
        rezultat_brut_str = analizeaza_chunk_sync(chunk, "Document General")
        try:
            probleme = json.loads(rezultat_brut_str)
            if isinstance(probleme, list):
                toate_problemele.extend(probleme)
        except (json.JSONDecodeError, TypeError):
            continue
    # --- END MODIFICARE ---
    
    log_step(f"AGREGARE FINALĂ: {len(toate_problemele)} probleme găsite în total.")
    
    rezumat_final = genereaza_sinteza_sync(toate_problemele)

    return {
        "probleme_identificate": toate_problemele,
        "rezumat_executiv": rezumat_final,
        "text_original": text_document
    }