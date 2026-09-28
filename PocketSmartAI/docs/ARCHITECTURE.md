# Architecture

Browser -> FastAPI -> routers -> recommendation service -> Gemini (optional)
                                     |
                                     +-> deterministic fallback
                                     |
                                     +-> SQLite history

The frontend is served by FastAPI as static HTML/CSS/JavaScript. Authentication uses JWT bearer tokens. Recommendation records are linked to the authenticated user.

The source project document describes a modular architecture with routes, services and models and explicitly lists Home, Party and Jewelry planner endpoints. This implementation keeps those boundaries while making the project runnable as a single VS Code workspace.
