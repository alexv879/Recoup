# PDF Service (FastAPI)

This is a minimal Python microservice to generate a sample PDF for PDF/UA validation in CI.

Quickstart (local):

1. Create a Python virtual environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r python-services/pdf_service/requirements.txt
```

2. Run the service (development):

```powershell
uvicorn python-services.pdf_service.main:app --host 0.0.0.0 --port 8000
```

3. Visit http://localhost:8000/generate/test-pdf to download the sample PDF.

Notes:
- The service uses ReportLab to create a minimal accessible PDF used for veraPDF checks in CI. It is intentionally small and has informative metadata.
- Add pikepdf if you need to post-process PDF structure or tags. If using pikepdf, install `qpdf` via your OS package manager.

Environment variable support
----------------------------
The service supports a simple `PY_PDF_SERVICE_SECRET` (optional) which you can set if you need a shared secret for the Node ↔ Python bridge.

Example (Run locally with secret):

```powershell
setx PY_PDF_SERVICE_SECRET "your-secret-value"
uvicorn python-services.pdf_service.main:app --host 0.0.0.0 --port 8000
```
