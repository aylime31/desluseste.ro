# Folosim o imagine de bază Python pe Debian
FROM python:3.10-slim

# Setăm directorul de lucru în container
WORKDIR /app

# Instalează Tesseract și pachetul de limbă română folosind managerul de pachete al sistemului
# Aceasta este partea magică
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-ron \
    && rm -rf /var/lib/apt/lists/*

# Copiem întâi fișierul de cerințe pentru a beneficia de caching-ul Docker
COPY requirements.txt .

# Instalăm dependențele Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiem restul codului aplicației
COPY . .

# Expunem portul pe care va rula Gunicorn/Uvicorn (Render îl va mapa automat)
EXPOSE 10000

# Comanda pentru a porni aplicația (Render o va suprascrie cu cea din setări, dar e bine să o avem)
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:10000"]