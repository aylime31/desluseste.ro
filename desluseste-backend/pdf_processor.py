import fitz
from PIL import Image
import pytesseract
from openai_client import ocr_pagina_cu_gpt4o

def extract_text_from_pdf(path: str) -> str:
    """Încearcă extragerea digitală; dacă e insuficient, folosește OCR ca fallback."""
    text_document = ""
    # Extracție text digitală
    with fitz.open(path) as doc:
        for page in doc:
            text_document += page.get_text()

    # Dacă textul digital e prea scurt, folosim OCR pe imagini generate cu DPI ridicat
    if len(text_document.strip()) < 100:
        text_document = ""
        with fitz.open(path) as doc:
            for i, page in enumerate(doc):
                pix = page.get_pixmap(dpi=200)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                page_text = ocr_pagina_cu_gpt4o(img)
                text_document += page_text + "\n"
                print(f"--- [INFO] OCR cu GPT-4o Pagina {i+1} procesată. ---")
    return text_document
