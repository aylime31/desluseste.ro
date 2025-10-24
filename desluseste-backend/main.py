"""Minimal entrypoint that exposes the FastAPI `app` defined in `api.py`.

This file intentionally keeps the ASGI entry tiny so the codebase is easier to
maintain and tests can import `app` without side effects.
"""

from api import app  # expose `app` for uvicorn / any ASGI server
