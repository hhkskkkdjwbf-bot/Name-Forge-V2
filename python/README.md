# NameForge Python services

This package adds an optional quality layer around the existing React and TypeScript generator.

- `nameforge.scoring` ranks candidate names already produced by the browser engine.
- `nameforge.api` exposes `GET /health` and `POST /v1/rank`.
- The API does not replace the current generator and is not required for GitHub Pages to work.

## Local setup

```bash
python -m venv .venv
pip install -r python/requirements.txt
PYTHONPATH=python python -m nameforge.api
```

Visit `http://127.0.0.1:8000/docs` for API documentation.

The score is a deterministic heuristic, not a native-speaker review or trademark guarantee. Host this API separately from GitHub Pages. Before public exposure, configure HTTPS, an explicit CORS allowlist and rate limiting at the hosting proxy. Never place server credentials in frontend code.
