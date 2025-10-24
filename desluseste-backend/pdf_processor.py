import fitz
from PIL import Image
import pytesseract


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
                pix = page.get_pixmap(dpi=300)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                page_text = pytesseract.image_to_string(img, lang='ron')
                text_document += page_text + "\n"
    return text_document
