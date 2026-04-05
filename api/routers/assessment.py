"""
API routes for substitution assessment.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from api.models.database import get_db, Product, CodeRequirement, AssessmentLog
from api.models.schemas import (
    SubstitutionRequest,
    SubstitutionAssessment,
    ProductInfo,
    CodeRequirementInfo,
)
from api.services.orchestrator import run_assessment
from api.services.pdf_report import generate_pdf
from api.data.code_provisions import get_provision, get_all_provisions
from api.services.auth import get_optional_user

router = APIRouter(prefix="/api", tags=["assessment"])


@router.post("/assess", response_model=SubstitutionAssessment)
async def assess_substitution(
    request: SubstitutionRequest,
    db: Session = Depends(get_db),
):
    """
    Assess a material substitution for code compliance risk.

    Submit either:
    - A free-text `query` describing the substitution scenario
    - Structured fields (specified_product, proposed_product, etc.)
    """
    if not request.query and not (
        request.specified_product and request.proposed_product
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Provide either a free-text 'query' or structured fields "
                "(specified_product, proposed_product, building_function, "
                "building_class, building_element)"
            ),
        )

    return await run_assessment(request, db)


@router.post("/assess/with-plan", response_model=SubstitutionAssessment)
async def assess_with_floor_plan(
    query: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    """
    Run a substitution assessment with an optional floor plan file.

    Accepts multipart/form-data with:
    - query: free-text substitution description
    - file: (optional) floor plan image (JPG/PNG) or IFC file

    If a floor plan is provided and the substitution involves window glazing,
    a daylight factor assessment is added to the results.
    """
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Parse the floor plan file if provided
    floor_plan_geometry = None
    if file and file.filename:
        file_bytes = await file.read()
        filename_lower = file.filename.lower()
        content_type = (file.content_type or "").lower()

        if filename_lower.endswith(".ifc"):
            from api.services.daylight_service import parse_ifc_file
            floor_plan_geometry = parse_ifc_file(file_bytes)
        elif any(filename_lower.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp")):
            from api.services.daylight_service import parse_floor_plan_image
            media_type = content_type if content_type.startswith("image/") else "image/jpeg"
            try:
                floor_plan_geometry = await parse_floor_plan_image(file_bytes, media_type)
            except Exception as e:
                # Non-fatal — assessment continues without daylight check
                floor_plan_geometry = {
                    "rooms": [],
                    "confidence": "low",
                    "notes": f"Floor plan could not be parsed: {str(e)}",
                }
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Upload a JPG, PNG, or IFC file.",
            )

    request = SubstitutionRequest(query=query)
    return await run_assessment(request, db, floor_plan_geometry=floor_plan_geometry)


@router.get("/products", response_model=list[ProductInfo])
async def list_products(
    search: str = "",
    product_type: str = "",
    db: Session = Depends(get_db),
):
    """Search the product database."""
    query = db.query(Product)
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%")
            | Product.manufacturer.ilike(f"%{search}%")
        )
    if product_type:
        query = query.filter(Product.product_type.ilike(f"%{product_type}%"))
    return query.limit(50).all()


@router.get("/products/{product_id}", response_model=ProductInfo)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product details by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/requirements", response_model=list[CodeRequirementInfo])
async def list_requirements(
    building_function: str = "woonfunctie",
    building_class: str = "klasse_2",
    element: str = "",
    db: Session = Depends(get_db),
):
    """Look up code requirements for a building context."""
    query = db.query(CodeRequirement).filter(
        CodeRequirement.building_function == building_function,
        CodeRequirement.building_class == building_class,
    )
    if element:
        query = query.filter(CodeRequirement.element == element)
    return query.all()


@router.get("/health")
async def health():
    return {"status": "ok", "service": "raeson"}


@router.post("/assess/pdf")
async def assess_and_export_pdf(
    request: SubstitutionRequest,
    db: Session = Depends(get_db),
):
    """
    Run a substitution assessment and return the result as a PDF report.
    """
    if not request.query and not (
        request.specified_product and request.proposed_product
    ):
        raise HTTPException(
            status_code=400,
            detail="Provide either a query or structured fields.",
        )

    assessment = await run_assessment(request, db)
    pdf_bytes = generate_pdf(assessment)

    filename = (
        f"raeson_assessment_"
        f"{assessment.specified_product[:20]}_to_"
        f"{assessment.proposed_product[:20]}.pdf"
    ).replace(" ", "_").replace("/", "-")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/code/{code_reference:path}")
async def get_code_provision(code_reference: str):
    """
    Look up the full text and context of a code provision.

    Example: /api/code/Bbl art. 3.72 lid 2
    """
    provision = get_provision(code_reference)
    if not provision:
        raise HTTPException(
            status_code=404,
            detail=f"Code provision '{code_reference}' not found."
        )
    return provision


@router.get("/codes")
async def list_code_provisions():
    """List all available code provisions."""
    provisions = get_all_provisions()
    return {
        ref: {
            "article": p["article"],
            "title_en": p["title_en"],
            "document": p["document"],
        }
        for ref, p in provisions.items()
    }


class DecisionPayload(BaseModel):
    decision: str          # "approved" | "rejected" | "info_requested"
    decision_by: Optional[str] = None
    decision_note: Optional[str] = None


@router.post("/assess/{assessment_id}/decision")
async def save_decision(
    assessment_id: int,
    payload: DecisionPayload,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_user),
):
    """Save architect's decision on an assessment."""
    if payload.decision not in ("approved", "rejected", "info_requested"):
        raise HTTPException(status_code=400, detail="Invalid decision value")

    log = db.query(AssessmentLog).filter(AssessmentLog.id == assessment_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Assessment not found")

    log.decision = payload.decision
    log.decision_timestamp = datetime.now(timezone.utc)
    log.decision_by = payload.decision_by or (user.get("name") if user else None)
    log.decision_note = payload.decision_note
    db.commit()

    return {"ok": True, "decision": payload.decision}
