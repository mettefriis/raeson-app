# Ræson — Material Substitution Risk Intelligence

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  Substitution query form → Risk assessment display   │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/assess
┌──────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                      │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Query       │  │  Compliance  │  │  Report    │  │
│  │  Parser      │→ │  Engine      │→ │  Generator │  │
│  │  (LLM)       │  │  (determin.) │  │  (LLM)     │  │
│  └─────────────┘  └──────┬───────┘  └────────────┘  │
│                          │                           │
│         ┌────────────────┼────────────────┐          │
│         ▼                ▼                ▼          │
│  ┌────────────┐  ┌─────────────┐  ┌────────────┐   │
│  │ Structured  │  │  Vector     │  │  Material  │   │
│  │ Code DB     │  │  Store      │  │  DB        │   │
│  │ (SQLite)    │  │  (Chroma)   │  │  (SQLite)  │   │
│  │             │  │             │  │            │   │
│  │ - Bbl reqs  │  │ - Bbl text  │  │ - Products │   │
│  │ - fire class│  │ - NEN sums  │  │ - TDS data │   │
│  │ - Rc values │  │ - guidance  │  │ - fire cls │   │
│  │ - by bldg   │  │             │  │ - lambda   │   │
│  │   type/cls  │  │             │  │ - strength │   │
│  └────────────┘  └─────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Key Design Principle

The LLM does NOT make compliance decisions. It:
1. Parses the substitution query into structured fields
2. Generates the human-readable risk narrative

The Compliance Engine does the actual check:
- Deterministic lookup of code requirements
- Deterministic comparison of material properties
- Binary pass/fail on each dimension (fire, thermal, structural, etc.)

This is where trust comes from. An architect can trace every
conclusion back to a specific code provision and a specific
material property — no hallucination possible on the critical path.

## Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, ChromaDB
- **LLM**: Anthropic Claude API (via anthropic SDK)
- **Frontend**: React + Vite
- **Database**: SQLite (structured), ChromaDB (vectors)

## Setup

```bash
# Backend
cd api
pip install -r requirements.txt
python -m scripts.seed_db          # populate demo data
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Demo Scenarios (seeded)

1. Facade insulation swap (Rockwool → Knauf) on residential
2. Cladding material swap (HPL → fiber cement) on residential
3. Structural steel grade swap on commercial
4. Window glazing swap affecting thermal performance
5. Fire door core material swap
