# Folosim o imagine de bază Python mai completă, bazată pe Debian Bullseye
FROM python:3.10-bullseye

# Setăm variabile de mediu pentru a preveni întrebările interactive în timpul instalării
ENV DEBIAN_FRONTEND=noninteractive

# Actualizăm sursele de pachete și instalăm Tesseract, limba română și alte dependențe necesare
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-ron \
    && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Setăm directorul de lucru
WORKDIR /app

# Copiem fișierele de dependențe și le instalăm
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiem restul codului aplicației
COPY . .

# Comanda pentru a porni aplicația (Render o va folosi sau o va suprascrie)
# Gunicorn este recomandat pentru producție
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:10000"]