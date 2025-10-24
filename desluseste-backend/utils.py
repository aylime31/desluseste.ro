import re


def chunking_inteligent_regex(text: str) -> list[str]:
    """Împarte textul după articole și capitole.

    Returnează o listă de chunk-uri; dacă niciun chunk nu e suficient de mare,
    întoarce textul întreg într-o listă.
    """
    pattern = r'(?=Art\.|Articolul\s*\d+|CAPITOLUL\s+[IVXLCDM]+|Art\.\s*\d+)'
    chunks = re.split(pattern, text)
    result = [chunk.strip() for chunk in chunks if len(chunk.strip()) > 100]
    return result if result else [text]
