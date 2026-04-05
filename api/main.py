"""
Ræson API — Material Substitution Risk Intelligence
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api.models.database import init_db
from api.routers.assessment import router as assessment_router

load_dotenv()

app = FastAPI(
    title="Ræson",
    description=(
        "Material substitution risk intelligence for architecture. "
        "Cross-references building codes, material specifications, "
        "and physics to evaluate substitution requests."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment_router)


@app.on_event("startup")
def startup():
    init_db()
