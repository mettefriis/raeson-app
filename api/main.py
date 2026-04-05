"""
Ræson API — Material Substitution Risk Intelligence
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api.routers.assessment import router as assessment_router
from api.routers.projects import router as projects_router

load_dotenv()

# ---------------------------------------------------------------------------
# Sentry — error tracking (1.8)
# Only initialises if SENTRY_DSN is set in environment variables.
# ---------------------------------------------------------------------------
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=0.2,   # capture 20% of requests for performance
        environment=os.getenv("RAILWAY_ENVIRONMENT", "development"),
    )

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Ræson",
    description=(
        "Material substitution risk intelligence for architecture. "
        "Cross-references building codes, material specifications, "
        "and physics to evaluate substitution requests."
    ),
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment_router)
app.include_router(projects_router)


# ---------------------------------------------------------------------------
# Startup — run Alembic migrations
# ---------------------------------------------------------------------------

@app.on_event("startup")
def startup():
    from alembic.config import Config
    from alembic import command
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
