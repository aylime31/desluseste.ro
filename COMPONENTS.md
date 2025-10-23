# Component Inventory

## Backend (`desluseste-backend/`)

### Application Core (`main.py`)
- **Environment bootstrap**: Loads `.env` via `dotenv.load_dotenv()` and reads `OPENAI_API_KEY`, logging whether it is present.
- **OCR Configuration**: Defines Tesseract settings (`TESSERACT_CONFIG`, `OCR_LANGUAGE='ron'`, `OCR_THRESHOLD_CHARS=100`) for Romanian document processing.
- **Logging helper**: `log_step(message)` prints debug checkpoints for long-running PDF analyses.
- **Pydantic models**:
  - `IssueItem` captures a single flagged clause returned by OpenAI.
  - `AnalysisResponse` aggregates identified issues, an executive summary, and the raw PDF text.
- **CORS middleware**: Registers permissive `CORSMiddleware` to allow the browser client to call the API from any origin.
- **OCR functionality**: `perform_ocr_on_pdf(pdf_path)` converts PDF pages to images using `pdf2image`, applies Tesseract OCR with Romanian language support, processes page-by-page for memory efficiency, handles errors gracefully, and returns normalized text.
- **PDF chunking**: `chunking_inteligent_regex(text)` slices legal documents by article/chapter markers, ensuring minimum chunk length before analysis.
- **OpenAI integration**:
  - `analizeaza_chunk_sync(chunk, tip_document)` builds a Romanian legal-risk prompt, posts it to `gpt-4o`, and returns serialized issue lists.
  - `genereaza_sinteza_sync(toate_problemele)` asks `gpt-4o` for an executive summary of all findings (falls back to a default message on failure).
- **Endpoints**:
  - `GET /` health-check returning `{"status": "API-ul Desluseste.ro este funcțional!"}`.
  - `POST /analizeaza-pdf/` accepts a PDF upload, attempts native text extraction with PyMuPDF (`fitz`), falls back to OCR if text < 100 chars, chunks and analyzes sequentially, aggregates issues, and responds with `AnalysisResponse`.
  - `POST /test-ocr/` debug endpoint that performs OCR on uploaded PDF and returns preview, character count, and validity status.

### Support Script (`test_openai.py`)
- Loads API credentials, prints masked status, adds optional organization header, and performs a diagnostic `chat.completions` call using `requests`.

### Dependencies (`requirements.txt`)
- `fastapi`, `uvicorn[standard]`, `python-multipart` for API & file uploads.
- `pydantic` for response models.
- `PyMuPDF` for PDF text extraction.
- `pytesseract`, `pdf2image`, `Pillow` for OCR functionality on scanned PDFs.
- `aiohttp` (currently unused after refactor to `requests`).
- `python-dotenv`, `requests` for environment loading and HTTP calls.

## Frontend (`desluseste-frontend/`)

### Application Shell
- **`app/layout.tsx`**: Defines global fonts (Geist) and HTML skeleton; exports default Next.js metadata placeholder.
- **`app/globals.css`**: Tailwind CSS entrypoint with custom theme tokens, dark mode variables, and base layer utilities.

### Primary Page (`app/page.tsx`)
- Declares React client component `HomePage` with state for `selectedFile`, loading, analysis result, and error handling.
- `handleFileChange` resets state when a PDF is chosen.
- `handleAnalyze` posts the file to `http://127.0.0.1:8000/analizeaza-pdf/`, manages loading UX, and writes results or errors.
- Helper functions `getAttentionColor` and `getCategoryBadgeVariant` provide Tailwind classes for attention levels and category badges.
- Renders upload card, conditional error `Alert`, and dynamic analysis results with badges and color-coded tags.

### UI Component Library (`components/ui/`)
- **`alert.tsx`**: `Alert`, `AlertTitle`, `AlertDescription` primitives with `class-variance-authority` (CVA) styles.
- **`badge.tsx`**: `Badge` component supporting variants (`default`, `secondary`, `destructive`, `outline`).
- **`button.tsx`**: `Button` using CVA for variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and sizes.
- **`card.tsx`**: Card container suite (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`).
- **`input.tsx`**: Styled text/file input aligned with Tailwind tokens.

### Shared Types & Utilities
- **`types.ts`**: `IssueItem` and `AnalysisResponse` interfaces mirroring backend models for typed fetch responses.
- **`lib/utils.ts`**: `cn()` helper combining class names via `clsx` and `tailwind-merge`.

### Configuration & Tooling
- **`package.json`**: Next.js scripts (`dev`, `build`, `start`, `lint`) and dependency declarations (Next 16, React 19, Tailwind v4, Radix Slot, CVA, lucide icons).
- **`tsconfig.json`**: TypeScript setup with path alias `@/*` and Next plugin.
- **`next.config.ts`**: Placeholder Next.js configuration export.
- **`postcss.config.mjs`**: Tailwind v4 PostCSS pipeline.
- **`eslint.config.mjs`**: ESLint configuration leveraging `eslint-config-next` presets and custom ignores.
- **`components.json`**: shadcn/ui generator metadata (style, aliases, icon library).
- **`public/`**: Reserved for static assets (currently empty).

## Top-Level

- **`README.md`**: Root placeholder for project documentation.
- **`.gitignore`**: Ignores virtual envs, caches, logs, editor settings, and `.env` files.
