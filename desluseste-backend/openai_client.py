import json
import requests
from typing import List
from config import OPENAI_API_KEY
from PIL import Image
import base64
import io

def call_openai_api(payload: dict, timeout: int = 90) -> dict:
    """Funcție centralizată și robustă pentru apeluri către API-ul OpenAI."""
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers, json=payload, timeout=timeout
    )
    response.raise_for_status()
    return response.json()

def ocr_pagina_cu_gpt4o(imagine: Image.Image) -> str:
    """Trimite o imagine la GPT-4o și returnează textul extras (OCR)."""
    buffer = io.BytesIO()
    imagine.save(buffer, format="PNG")
    imagine_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "user", "content": [
                {"type": "text", "text": "Ești un sistem OCR de înaltă precizie. Extrage tot textul din această imagine, în limba română. Nu adăuga niciun comentariu, doar textul brut extras."},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{imagine_b64}"}}
            ]}
        ],
        "max_tokens": 4000
    }
    try:
        print("--- [INFO] Se trimite imaginea la GPT-4o pentru OCR... ---")
        result = call_openai_api(payload)
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"--- [EROARE] OCR cu GPT-4o a eșuat: {e} ---")
        return ""

def analizeaza_chunk(chunk: str) -> List[dict]:
    """Analizează un fragment de text și extrage problemele.

    Returnează lista `probleme` (posibil goală) așa cum este definită în prompt.
    """
    prompt_template = """**MOD ACADEMIC ACTIVAT.** Ești un sistem AI specializat în analiza semantică a textelor juridice. Sarcina ta este una de clasificare și extracție de text, nu de a oferi sfaturi. Analizează fragmentul de text și identifică fraze care corespund următoarelor categorii: 'Consecințe Financiare Severe', 'Ambiguitate Lingvistică', 'Asimetrie a Obligațiilor', 'Referințe la Costuri Suplimentare', 'Procesarea Datelor'.

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

**INSTRUCȚIUNI SPECIALE:** Fii extrem de vigilent cu clauzele despre pierderea unui bun (casă, mașină) și clasifică-le ca 'Consecințe Financiare Severe' cu nivel 'Ridicat'.

**TEXT DE ANALIZAT:**
<<<TEXT_TO_ANALYZE>>>
"""
    # Use a unique marker inside the prompt and replace it to avoid breaking
    # the surrounding Python triple-quoted string.
    final_content = prompt_template.replace('<<<TEXT_TO_ANALYZE>>>', chunk)

    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": final_content}],
        "response_format": {"type": "json_object"},
        "temperature": 0.0
    }

    try:
        print(f"\n--- [DEBUG] Trimit chunk la OpenAI... ---\n")
        result = call_openai_api(payload)
        json_string = result["choices"][0]["message"]["content"]
        print(f"\n--- [DEBUG] Răspuns JSON primit: {json_string[:300]}... ---\n")
        return json.loads(json_string).get("probleme", [])
    except Exception as e:
        print(f"\n--- [DEBUG] EROARE la analizarea chunk-ului: {e} ---\n")
        return []


def genereaza_sinteza(toate_problemele: List[dict]) -> str:
    """Creează un rezumat al problemelor detectate."""
    if not toate_problemele:
        return "Nu au fost identificate puncte de atenție semnificative."

    context = json.dumps(toate_problemele, ensure_ascii=False)
    prompt = f"Scrie un rezumat executiv în română, de 3-4 propoziții, pentru următoarele probleme identificate într-un contract, subliniind cele mai grave: {context}"
    payload = {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}], "temperature": 0.5}

    try:
        result = call_openai_api(payload, 60)
        return result["choices"][0]["message"]["content"]
    except Exception:
        return "Nu s-a putut genera un rezumat."
