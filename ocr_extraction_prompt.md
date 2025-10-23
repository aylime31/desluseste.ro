# Prompt for AI Coding Agent: Add OCR Functionality to Desluseste.ro

## Mission
Add robust OCR (Optical Character Recognition) functionality to the existing Desluseste.ro backend to handle scanned PDFs and image-based documents that currently fail with "Documentul PDF nu conține text extragibil."

## Current System Architecture

**Backend Stack:**
- FastAPI with CORS middleware
- PyMuPDF (fitz) for PDF text extraction
- Synchronous request flow with `requests` library
- OpenAI GPT-4o integration for legal analysis
- Pydantic models for type safety

**Current PDF Processing Flow:**
1. User uploads PDF via `/analizeaza-pdf/` endpoint
2. File saved to temporary location
3. `fitz.open()` extracts text from PDF
4. If text exists → proceed to chunking and analysis
5. If no text → HTTP 400 error "Documentul PDF nu conține text extragibil"

**Problem:** Steps 4-5 fail for scanned documents or image-based PDFs

## Requirements for OCR Implementation

### 1. Technology Choice
**Recommended:** `pytesseract` with `pdf2image`
- **Reasoning:** 
  - Well-maintained, production-ready
  - Excellent Romanian language support (traineddata available)
  - Integrates cleanly with existing tempfile pattern
  - pip-installable without complex system dependencies
  - Synchronous API matches current architecture

**Alternative (if justified):** `easyocr` or cloud OCR APIs (Google Vision, Azure)
- **Trade-offs:** Explain performance, cost, and dependency implications

### 2. Integration Pattern
**Modify existing `analizeaza_pdf_endpoint` function:**

```python
@app.post("/analizeaza-pdf/", response_model=AnalysisResponse)
async def analizeaza_pdf_endpoint(file: UploadFile = File(...)):
    log_step("Început request /analizeaza-pdf/")
    
    try:
        text_document = ""
        with tempfile.NamedTemporaryFile(delete=True, suffix=".pdf") as temp:
            temp.write(await file.read())
            temp.seek(0)
            
            # EXISTING: Try native text extraction first
            with fitz.open(stream=temp.read(), filetype="pdf") as doc:
                text_document = "".join(page.get_text() for page in doc)
            
            # NEW: Fallback to OCR if no text extracted
            if len(text_document.strip()) < 100:  # Threshold for "no meaningful text"
                log_step("Text insuficient. Încercare OCR...")
                text_document = perform_ocr_on_pdf(temp.name)  # YOUR NEW FUNCTION
                
        log_step(f"TEXT EXTRAS (primele 200 caractere): {text_document[:200]}...")
        
        if not text_document.strip():
            raise HTTPException(
                status_code=400, 
                detail="PDF nu conține text extragibil și OCR nu a reușit să extragă text."
            )
            
    except Exception as e:
        log_step(f"EROARE LA EXTRAGEREA TEXTULUI: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"A apărut o eroare la procesarea PDF: {str(e)}"
        )
    
    # ... rest of existing code unchanged
```

### 3. OCR Function Requirements

**Create:** `def perform_ocr_on_pdf(pdf_path: str) -> str:`

**Must Handle:**
- Multi-page PDFs (iterate through all pages)
- Romanian diacritics (ă, â, î, ș, ț) - configure Tesseract for `ron` language
- Memory efficiency (process page-by-page, not all at once)
- Error recovery (if one page fails OCR, continue with others)

**Quality Standards:**
```python
def perform_ocr_on_pdf(pdf_path: str) -> str:
    """
    Performs OCR on a PDF file using Tesseract.
    
    Args:
        pdf_path: Absolute path to temporary PDF file
        
    Returns:
        Extracted text string with normalized whitespace
        
    Raises:
        RuntimeError: If OCR completely fails (no text from any page)
    """
    # YOUR IMPLEMENTATION HERE
    # - Convert PDF pages to images using pdf2image
    # - Configure pytesseract for Romanian (lang='ron')
    # - Process each page, accumulate text
    # - Clean and normalize output
    # - Log progress for debugging
    pass
```

### 4. Code Quality Requirements

**Logging:**
- Use existing `log_step()` function consistently
- Log OCR attempt start/end
- Log page-by-page progress for multi-page documents
- Log any warnings (e.g., low confidence, corrupt pages)

**Error Handling:**
- Graceful degradation (partial OCR better than total failure)
- Specific error messages for common failures:
  - Tesseract not installed
  - Romanian language data missing
  - Corrupt/unreadable image pages
  - Memory issues on large PDFs

**Configuration:**
```python
# Add near top of main.py
TESSERACT_CONFIG = '--psm 6 --oem 3'  # Page segmentation mode 6, OCR Engine mode 3
OCR_LANGUAGE = 'ron'  # Romanian
OCR_THRESHOLD_CHARS = 100  # Minimum chars before attempting OCR
```

**Dependencies to Add:**
```txt
# Add to requirements.txt
pytesseract==0.3.10
pdf2image==1.16.3
Pillow==10.0.0
```

### 5. Testing Considerations

**Provide a test utility function:**
```python
# For development/debugging only;
@app.post("/test-ocr/")
async def test_ocr_endpoint(file: UploadFile = File(...)):
    """Debug endpoint to test OCR without full analysis pipeline."""
    with tempfile.NamedTemporaryFile(delete=True, suffix=".pdf") as temp:
        temp.write(await file.read())
        temp.seek(0)
        ocr_text = perform_ocr_on_pdf(temp.name)
        return {
            "ocr_text_preview": ocr_text[:500],
            "total_chars": len(ocr_text),
            "appears_valid": len(ocr_text.strip()) > 100
        }
```

### 6. Documentation Requirements

**Add to code comments:**
- System dependencies (Tesseract installation instructions for Ubuntu/MacOS/Windows)
- Romanian language pack installation: `sudo apt-get install tesseract-ocr-ron`
- Expected OCR performance (time per page, accuracy expectations)
- Limitations (handwritten text, low-quality scans)

**Update README.md section:**
```markdown
## OCR Support
Desluseste.ro automatically detects scanned PDFs and applies OCR using Tesseract.

### Prerequisites
- Tesseract OCR engine: `sudo apt-get install tesseract-ocr`
- Romanian language data: `sudo apt-get install tesseract-ocr-ron`

### Performance
- Native text extraction: ~1-2 seconds
- OCR processing: ~3-5 seconds per page
```

## Integration Checklist

- [ ] Install and test Tesseract with Romanian language pack
- [ ] Implement `perform_ocr_on_pdf()` function with page-by-page processing
- [ ] Add OCR fallback logic to `analizeaza_pdf_endpoint`
- [ ] Update error messages to distinguish OCR failures from extraction failures
- [ ] Add configuration constants for OCR parameters
- [ ] Update `requirements.txt` with new dependencies
- [ ] Add logging statements using existing `log_step()` pattern
- [ ] Test with sample scanned Romanian contract
- [ ] Document system dependencies and setup steps
- [ ] Optional: Add `/test-ocr/` debug endpoint

## Success Criteria

**Functional:**
- Scanned PDFs now processable (no more 400 errors for image-based PDFs)
- Existing native text extraction still works (no regression)
- Romanian diacritics correctly recognized
- Multi-page documents fully processed

**Non-Functional:**
- Processing time <5 seconds per page for typical scans
- Memory usage remains reasonable (<500MB for 20-page PDF)
- Clear error messages guide users when OCR fails
- Code follows existing synchronous patterns (no async/await in OCR)

## Example Expected Behavior

**Before (current):**
```
Input: Scanned_Contract.pdf (images only)
Output: HTTP 400 "Documentul PDF nu conține text extragibil."
```

**After (with OCR):**
```
Input: Scanned_Contract.pdf (images only)
Log: "--- [DEBUG] Text insuficient. Încercare OCR... ---"
Log: "--- [DEBUG] OCR pagina 1/5... ---"
Log: "--- [DEBUG] OCR pagina 2/5... ---"
...
Log: "--- [DEBUG] OCR finalizat. 4521 caractere extrase. ---"
Output: Normal analysis proceeds with OCR-extracted text
```

## Notes for Implementation
- Prioritize code clarity over premature optimization
- Match existing code style (Romanian comments acceptable, log messages in Romanian)
- Tesseract config string may need tuning based on document quality
- Consider adding a confidence threshold if OCR quality is poor
- Keep synchronous - no asyncio for OCR calls (match current architecture)