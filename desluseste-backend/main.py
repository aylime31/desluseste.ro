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
    prompt_analiza = """SARCINA TA PRINCIPALĂ ESTE SĂ GĂSEȘTI PROBLEME. ESTE MAI BINE SĂ FII PREA PRUDENT DECÂT SĂ OMIȚI CEVA. Prioritizează identificarea oricărei clauze care pare chiar și vag dezavantajoasă.

ACȚIONEAZĂ CA UN AVOCAT AL DIAVOLULUI. Misiunea ta este să protejezi un client neavizat cu orice preț. Fii extrem de sceptic și paranoic. Identifică ABSOLUT ORICE element care miroase a problemă, oricât de mică. Nu presupune că vreo clauză este "standard" sau "normală".

Analizează fragmentul de text de mai jos. Pentru fiecare problemă identificată, clasific-o și explic-o.

**CATEGORII DE PROBLEME ȘI EXEMPLE CONCRETE (Fii foarte atent la ele!):**

1.  **Risc Juridic Major:**
    *   **Definiție:** Orice consecință disproporționată, penalități uriașe, pierderea unor bunuri esențiale (ex: casă, mașină), renunțări la drepturi fundamentale.
    *   **Exemplu:** "În caz de neplată, creditorul are dreptul de a vinde imobilul." -> ACESTA ESTE UN RISC MAJOR!
    *   **Exemplu:** "Penalitățile sunt de 1% pe zi de întârziere." -> ACESTA ESTE UN RISC MAJOR!

2.  **Limbaj Ambigiu/Neclar:**
    *   **Definiție:** Termeni vagi, jargon, referințe la alte documente care nu sunt prezente.
    *   **Exemplu:** "Serviciul va fi restabilit într-un termen rezonabil."

3.  **Obligație Unilaterală:**
    *   **Definiție:** O parte are obligații clare, cealaltă are drepturi sau obligații vagi.
    *   **Exemplu:** "Furnizorul poate schimba prețul oricând, clientul trebuie să plătească."

4.  **Costuri Ascunse / Comisioane:**
    *   **Definiție:** Orice taxă care nu este inclusă în prețul principal.
    *   **Exemplu:** "Se va percepe un comision de administrare a dosarului."

5.  **Confidențialitate / Date Personale:**
    *   **Definiție:** Orice clauză despre colectarea, partajarea sau utilizarea datelor personale. Fii foarte strict.
    *   **Exemplu:** "Acceptați partajarea datelor dvs. cu partenerii noștri comerciali."

Răspunsul tău trebuie să fie un singur obiect JSON valid care respectă formatul cerut. Obiectul principal trebuie să conțină o cheie "probleme", care este o listă de obiecte JSON. Dacă nu găsești nimic, returnează o listă goală.

**FORMATUL FIECĂRUI OBIECT (Respectă-l cu strictețe!):**
{{
  "titlu_problema": "Un titlu scurt și alarmant (ex: 'Risc de Pierdere a Locuinței').",
  "clauza_originala": "Textul exact al clauzei.",
  "categorie_problema": "Alege: 'Risc Juridic Major', 'Limbaj Ambigiu/Neclar', 'Obligație Unilaterală', 'Costuri Ascunse / Comisioane', 'Confidențialitate / Date Personale'.",
  "explicatie_simpla": "Explică riscul în termeni simpli și direcți, subliniind cel mai rău scenariu posibil.",
  "nivel_atentie": "Alege: 'Scăzut', 'Mediu', 'Ridicat'. Pentru orice Risc Juridic Major, folosește 'Ridicat'.",
  "sugestie": "O sugestie acționabilă (ex: 'Consultă un avocat IMEDIAT!', 'NU semna înainte de a clarifica acest punct')."
}}

Text de analizat:
\"\"\"
{chunk}
\"\"\"
"""
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = { "model": "gpt-4o", "messages": [{"role": "user", "content": prompt_analiza.format(chunk=chunk)}], "response_format": {"type": "json_object"} }
    
    log_step(f"TRIMITERE CHUNK (SYNC)...")
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
    if not toate_problemele: return "Nu au fost identificate puncte de atenție semnificative în document."
    context = json.dumps(toate_problemele, indent=2, ensure_ascii=False)
    prompt_sinteza = f"""Ești un consilier juridic care prezintă concluziile finale unui client. Ai analizat un document și ai extras următoarea listă de probleme, în format JSON.

Sarcina ta este să scrii un rezumat executiv de 3-4 propoziții în limba română, care:
1. Începe cu o evaluare generală a documentului.
2. Evidențiază cele mai grave 2-3 probleme, bazându-te pe cele cu "nivel_atentie": "Ridicat".
3. Oferă o recomandare finală clară și acționabilă.

Fii concis și adresează-te direct clientului.

Lista de probleme:
\"\"\"
{context}
\"\"\"
"""
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": "gpt-4o", "messages": [{"role": "user", "content": prompt_sinteza}], "temperature": 0.5}
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

@app.post("/analizeaza-pdf/", response_model=AnalysisResponse)
def analizeaza_pdf_endpoint(file: UploadFile = File(...)):
    log_step("Început request...")
    
    try:
        with tempfile.NamedTemporaryFile(delete=True, suffix=".pdf") as temp:
            temp.write(file.file.read()); temp.seek(0)
            text_document = "".join(page.get_text() for page in fitz.open(stream=temp.read(), filetype="pdf"))
        if not text_document.strip(): raise HTTPException(status_code=400, detail="PDF-ul nu conține text.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare procesare PDF: {e}")

    chunkuri = chunking_inteligent_regex(text_document)
    
    toate_problemele = []
    for chunk in chunkuri:
        rezultat_brut_str = analizeaza_chunk_sync(chunk)
        try:
            probleme = json.loads(rezultat_brut_str)
            if isinstance(probleme, list): toate_problemele.extend(probleme)
        except: continue
    
    log_step(f"AGREGARE FINALĂ: {len(toate_problemele)} probleme.")
    rezumat_final = genereaza_sinteza_sync(toate_problemele)

    return {"probleme_identificate": toate_problemele, "rezumat_executiv": rezumat_final, "text_original": text_document}