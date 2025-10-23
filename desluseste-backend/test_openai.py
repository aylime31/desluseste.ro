import os
import requests
from dotenv import load_dotenv

# Încarcă variabilele de mediu din .env
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
org_id = os.getenv("OPENAI_ORGANIZATION_ID") # Citim și org_id, dacă există

if not api_key:
    print("EROARE: Nu am găsit OPENAI_API_KEY în fișierul .env")
else:
    print(f"Am găsit cheia API. Se termină în: ...{api_key[-4:]}")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
}

# Adaugă header-ul de organizație dacă a fost găsit
if org_id:
    headers["OpenAI-Organization"] = org_id
    print(f"Am găsit ID de organizație: {org_id}")

payload = {
    "model": "gpt-3.5-turbo", # Folosim un model ieftin pentru test
    "messages": [{"role": "user", "content": "Spune 'test'."}]
}

print("\nTrimit un request simplu către OpenAI...")

try:
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    
    print(f"STATUS CODE PRIMIT: {response.status_code}")
    
    # Afișează răspunsul complet pentru a vedea detaliile erorii
    print("RĂSPUNS COMPLET:")
    print(response.json())

except Exception as e:
    print(f"A apărut o excepție: {e}")