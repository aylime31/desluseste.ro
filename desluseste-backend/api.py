import os
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import AnalysisResponse
from config import origins
from utils import chunking_inteligent_regex
from openai_client import analizeaza_chunk, genereaza_sinteza
from pdf_processor import extract_text_from_pdf


app = FastAPI(title="Desluseste.ro API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"]
)


@app.get("/")
def read_root():
    """Endpoint de health check pentru a confirma că API-ul este online."""
    return {"status": "API-ul Desluseste.ro este funcțional!"}


@app.post("/analizeaza-pdf/", response_model=AnalysisResponse)
def analizeaza_pdf_endpoint(file: UploadFile = File(...)):
    """
    Endpoint principal care primește un PDF, încearcă extragerea digitală,
    folosește OCR ca fallback, și apoi analizează textul rezultat.
    """
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
            temp.write(file.file.read())
            temp_path = temp.name

        text_document = extract_text_from_pdf(temp_path)

        if not text_document.strip():
            raise HTTPException(status_code=400, detail="Fișierul PDF este gol sau complet ilizibil, chiar și după încercarea OCR.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"A apărut o eroare la procesarea PDF: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

    # Analiză
    chunkuri = chunking_inteligent_regex(text_document)
    toate_problemele = [problem for chunk in chunkuri for problem in analizeaza_chunk(chunk)]
    rezumat_final = genereaza_sinteza(toate_problemele)

    return {
        "probleme_identificate": toate_problemele,
        "rezumat_executiv": rezumat_final,
        "text_original": text_document
    }
