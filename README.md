# desluseste.ro

A Romanian legal document analyzer that uses AI to identify potential issues in contracts and agreements.

## Features

- 📄 PDF text extraction (native and OCR)
- 🔍 AI-powered legal clause analysis
- 🇷🇴 Romanian language support
- 🚀 FastAPI backend + Next.js frontend
- 🤖 OpenAI GPT-4o integration

## OCR Support

Desluseste.ro automatically detects scanned PDFs and applies OCR using Tesseract when native text extraction yields insufficient results (< 100 characters).

### Prerequisites

**Tesseract OCR Engine:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-ron poppler-utils

# MacOS
brew install tesseract tesseract-lang poppler

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Ensure tesseract is in your PATH
```

**Romanian Language Pack:**
The `tesseract-ocr-ron` package provides support for Romanian diacritics (ă, â, î, ș, ț).

### Performance

- **Native text extraction:** ~1-2 seconds
- **OCR processing:** ~3-5 seconds per page (300 DPI)
- **Memory usage:** < 500MB for 20-page PDFs

### Limitations

- Handwritten text may not be recognized accurately
- Low-quality scans (< 200 DPI) will have reduced accuracy
- Complex layouts may require manual review

## Setup

### Backend

```bash
cd desluseste-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=your_key_here" > .env

# Run the server
uvicorn main:app --reload
```

### Frontend

```bash
cd desluseste-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## API Endpoints

- `GET /` - Health check
- `POST /analizeaza-pdf/` - Analyze a PDF document (with automatic OCR fallback)
- `POST /test-ocr/` - Debug endpoint to test OCR functionality

## Testing OCR

Use the `/test-ocr/` endpoint to verify your Tesseract installation:

```bash
curl -X POST http://127.0.0.1:8000/test-ocr/ \
  -F "file=@path/to/scanned_document.pdf"
```