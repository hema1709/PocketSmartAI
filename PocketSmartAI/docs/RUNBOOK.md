# Error-free run checklist

1. Use Python 3.11+.
2. Create and activate `.venv`.
3. Install `requirements.txt`.
4. Copy `.env.example` to `.env`.
5. Leave `GEMINI_API_KEY` empty for demo mode, or put a valid key in it for live Gemini.
6. Run `uvicorn app.main:app --reload`.
7. Visit `http://127.0.0.1:8000`.
8. Register a user.
9. Log in.
10. Run each planner.
11. Verify `/history`.
12. Run `pytest -q`.

Common errors:
- `ModuleNotFoundError`: the VS Code interpreter is not the `.venv` interpreter, or dependencies were not installed.
- `401 Invalid or expired authentication token`: log in again; the browser token may have expired.
- Gemini errors: confirm `GEMINI_API_KEY` and `GEMINI_MODEL`. The app catches Gemini failures and uses local fallback recommendations.
- Port 8000 already in use: run `uvicorn app.main:app --reload --port 8001` and open port 8001.
