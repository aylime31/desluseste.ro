# pdf_processor.py

import fitz
from PIL import Image
from openai_client import ocr_pagina_cu_gpt4o

def extract_text_from_pdf(path: str) -> str:
    """
    Extrage text dintr-un PDF pagină cu pagină, folosind OCR doar la nevoie.
    """
    document_pages_text = [] # Vom stoca textul fiecărei pagini aici
    
    try:
        with fitz.open(path) as doc:
            for i, page in enumerate(doc):
                # 1. Încercare de extragere a textului digital pentru pagina curentă
                page_text_digital = page.get_text()

                # 2. Decizia: Folosim textul digital sau activăm OCR?
                # Folosim un prag mic, ex: 20 caractere, pentru a detecta paginile goale sau scanate.
                if len(page_text_digital.strip()) > 20:
                    print(f"--- [INFO] Pagina {i+1}: Text digital detectat. ---")
                    document_pages_text.append(page_text_digital)
                else:
                    print(f"\n--- [INFO] Pagina {i+1}: Text digital insuficient. Se activează modul OCR. ---\n")
                    
                    # --- OPTIMIZĂRI APLICATE AICI ---
                    # DPI 150 pentru viteză
                    pix = page.get_pixmap(dpi=150) 
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    # Coversie la alb-negru pentru dimensiune mai mică
                    img = img.convert("L") 

                    page_text_ocr = ocr_pagina_cu_gpt4o(img)
                    document_pages_text.append(page_text_ocr)
                    print(f"--- [INFO] OCR Pagina {i+1} procesată. ---")

    except Exception as e:
        print(f"--- [EROARE] A apărut o eroare în timpul procesării PDF: {e} ---")
        return "\n".join(document_pages_text)
            
    return "\n".join(document_pages_text)