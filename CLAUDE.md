# ræson — Project Context

## What it is

ræson is a material substitution risk intelligence tool for architects.
An architect describes a substitution scenario in plain language (e.g. "Contractor
proposes Kingspan K15 instead of Rockwool Duorock 040 for facade insulation,
klasse 2, Amsterdam") and ræson returns a structured compliance assessment across
multiple dimensions (fire reaction, fire resistance, thermal, acoustic, etc.),
with references to the Dutch building code (Bbl).

The project has two parts:
1. **Demo** — a local React/FastAPI app for showing the engine to potential users
2. **Marketing site** — a separate React app at `../src/` with the public-facing website

---

## Directory structure

```
raeson/                        ← YOU ARE HERE (active project)
  api/
    main.py                    ← FastAPI app entry point
    fonts/
      JetBrainsMono-Regular.ttf  ← embedded for PDF generation
    data/
      code_provisions.py       ← Dutch building code (Bbl) provision database
    models/
      database.py              ← SQLAlchemy models + SQLite init
      schemas.py               ← Pydantic request/response schemas
    routers/
      assessment.py            ← API routes: /assess, /assess/pdf, /code/*, /products, /health
    services/
      orchestrator.py          ← orchestrates LLM parsing → compliance check → response
      llm_service.py           ← Anthropic API calls (parse query + generate assessment)
      compliance_engine.py     ← rule-based compliance checks against the DB
      pdf_report.py            ← PDF generator (ReportLab, matches visual design)
    requirements.txt
  frontend/
    index.html                 ← loads Inter + JetBrains Mono from Google Fonts
    src/
      App.jsx                  ← main app: header, query form, example scenarios, results
      components/
        QueryForm.jsx          ← textarea + submit button
        AssessmentResult.jsx   ← verdict badge, dimension cards, PDF export button
        CodeProvisionModal.jsx ← overlay showing full Bbl provision text
  scripts/
    seed_db.py                 ← seeds the SQLite DB with products + code requirements
    test_engine.py             ← local test runner for the compliance engine
  raeson.db                    ← SQLite database (products + requirements)
  venv/                        ← Python virtualenv
  .env.example                 ← copy to .env, add ANTHROPIC_API_KEY

../src/                        ← marketing website (separate Vite/React app)
  app/
    App.tsx                    ← landing page (hero, problem, solution, stats, CTA)
    components/
      ProblemSection.tsx
      ProcessSection.tsx
```

---

## How to run the demo

Requires two terminals.

**Terminal 1 — backend (FastAPI on :8000)**
```bash
cd ~/Raeson/raeson
source venv/bin/activate
uvicorn api.main:app --reload
```

**Terminal 2 — frontend (Vite on :5173)**
```bash
cd ~/Raeson/raeson/frontend
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to `:8000`.

**First-time setup**
```bash
cd ~/Raeson/raeson
python -m venv venv
source venv/bin/activate
pip install -r api/requirements.txt
cp .env.example .env        # add your ANTHROPIC_API_KEY
python scripts/seed_db.py   # populate raeson.db
```

---

## Tech stack

| Layer       | Tech                                 |
|-------------|--------------------------------------|
| Backend     | Python, FastAPI, SQLAlchemy, SQLite  |
| LLM         | Anthropic API (Claude) via `anthropic` SDK |
| Frontend    | React 18, Vite, plain inline styles (no CSS framework) |
| PDF         | ReportLab (platypus + graphics drawing) |
| Marketing site | React 18, Vite, Tailwind CSS     |

---

## API endpoints

| Method | Path                  | Description                                      |
|--------|-----------------------|--------------------------------------------------|
| POST   | `/api/assess`         | Run assessment, return JSON                      |
| POST   | `/api/assess/pdf`     | Run assessment, return PDF                       |
| GET    | `/api/code/{ref}`     | Fetch full Bbl provision text by reference       |
| GET    | `/api/codes`          | List all available code provisions               |
| GET    | `/api/products`       | Search product database                          |
| GET    | `/api/health`         | Health check                                     |

---

## Visual design system

Both the demo frontend and the PDF report follow the same visual language as the
marketing website. These are the canonical design tokens — do not deviate.

| Token       | Value       | Usage                                  |
|-------------|-------------|----------------------------------------|
| `C_INK`     | `#111110`   | Primary text, buttons, borders on focus |
| `C_SUBTLE`  | `#6b6b69`   | Secondary text                         |
| `C_MUTED`   | `#9b9b99`   | Labels, placeholders, metadata         |
| `C_BG`      | `#f7f7f5`   | Page background, off-white surfaces    |
| `C_BORDER`  | `#e5e5e3`   | All borders and rules                  |
| `C_WHITE`   | `#ffffff`   | Card/surface backgrounds               |

**Verdict colors** (semantic only — for compliance dimensions):
- Pass: green `#15803d` / bg `#f0fdf4` / border `#bbf7d0`
- Conditional: amber `#a16207` / bg `#fefce8` / border `#fef08a`
- Fail: red `#b91c1c` / bg `#fef2f2` / border `#fecaca`

**Typography:**
- Brand name ("ræson") and logo mark: `JetBrains Mono`, weight 400
- Body / UI: `Inter` (web), `Helvetica` (PDF)
- Font weights: 300 (body), 400 (labels, buttons), never bold in UI except verdict badges
- No rounded corners anywhere
- Section labels: small uppercase + letter-spacing (e.g. `COMPLIANCE DIMENSIONS`)

**Logo mark:**
The ræson logo is a geometric "R" — a custom SVG, NOT a font character.
Geometry (base units, scale as needed):
- Left stem: x=0..3, y=0..20
- Top bar: x=0..12, y=0..3
- Right side of bowl: x=9..12, y=0..12
- Bottom bar of bowl: x=0..12, y=9..12
- Counter (empty space): x=3..9, y=3..9 (6×6 square)
- Diagonal leg: line from (12,12) to (21,21), strokeWidth=3, strokeLinecap=square
- ViewBox: `0 0 23 23`

In the frontend: `<RaesonMark />` component in `App.jsx`.
In the PDF: `RMarkFlowable` and `_make_r_mark()` in `pdf_report.py`.

---

## Key decisions (2026-03-31)

- **Purple removed.** The original demo used `#534AB7` (purple) as its accent color.
  This was replaced with black (`#111110`) everywhere to match the marketing website.
- **No rounded corners.** All border-radius removed from buttons, cards, tables,
  and the modal — consistent with the website's sharp-edged aesthetic.
- **JetBrains Mono bundled.** `api/fonts/JetBrainsMono-Regular.ttf` is committed so
  the PDF generator can embed the brand font without a network request.
  Falls back to `Courier` if the file is missing.
- **Logo as SVG/Drawing.** The "R" mark is drawn from geometric primitives
  (not a font glyph) both in the React frontend (inline SVG) and in the PDF
  (ReportLab `Drawing` with `Rect` + `Line`).
- **Demo is separate from the marketing site.** `raeson/` (this folder) is the
  working demo + engine. `../src/` is the public landing page. They share visual
  design but are independent apps.

---

## Open questions / next steps

- [ ] Base model runs still pending (Mistral/Qwen base versions)
- [ ] Add more products to `raeson.db` (currently seeded with a small test set)
- [ ] Consider replacing SQLite with Postgres for production
- [ ] The marketing site at `../src/` does not yet have the logo mark integrated
      into the nav (currently just the text wordmark)
- [ ] PDF: page headers/footers with logo mark on multi-page reports not yet implemented
