"""
API schemas — what goes in and out of the /assess endpoint.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ---------------------------------------------------------------------------
# REQUEST
# ---------------------------------------------------------------------------

class SubstitutionRequest(BaseModel):
    """What the user submits — either free text or structured."""

    # Option A: free-text query (LLM parses it)
    query: Optional[str] = Field(
        None,
        example=(
            "Contractor proposes Kingspan Kooltherm K15 instead of "
            "specified Rockwool Duorock 040 for facade insulation on a "
            "residential building (klasse 2) in Amsterdam."
        )
    )

    # Option B: structured input (bypasses LLM parsing)
    specified_product: Optional[str] = None
    proposed_product: Optional[str] = None
    building_function: Optional[str] = None  # e.g. "woonfunctie"
    building_class: Optional[str] = None     # e.g. "klasse_2"
    building_element: Optional[str] = None   # e.g. "facade_insulation"
    project_location: Optional[str] = Field(None, example="Amsterdam")

    # New: climate and compatibility context
    climate_zone: Optional[str] = Field(None, example="coastal")   # coastal / urban / continental
    adjacent_materials: Optional[list[str]] = Field(None, example=["copper", "galvanised_steel"])


# ---------------------------------------------------------------------------
# RESPONSE
# ---------------------------------------------------------------------------

class RiskVerdict(str, Enum):
    PASS = "pass"
    CONDITIONAL = "conditional"
    FAIL = "fail"


class DimensionResult(BaseModel):
    """Result for a single compliance dimension (fire, thermal, etc.)."""

    dimension: str = Field(..., example="fire_reaction")
    verdict: RiskVerdict
    requirement: str = Field(
        ...,
        example="Minimum Euroclass B-s2,d0 (Bbl art. 3.72 lid 1)"
    )
    specified_value: str = Field(..., example="A1 (non-combustible)")
    proposed_value: str = Field(..., example="B-s1,d0")
    delta: Optional[str] = Field(
        None,
        example="Downgrade from A1 to B-s1,d0 — 2 classes lower but still meets minimum"
    )
    code_reference: str = Field(..., example="Bbl art. 3.72 lid 1")
    notes: Optional[str] = None


class AlternativeSuggestion(BaseModel):
    """A product that performs better than the proposed product in this context."""
    name: str
    manufacturer: str
    product_type: str
    fire_euroclass: Optional[str] = None
    epd_co2_per_m2: Optional[float] = None
    service_life_years: Optional[int] = None
    verdict: str = "pass"   # "pass" or "conditional" — relative to this context
    why: str


class SubstitutionAssessment(BaseModel):
    """The full risk assessment returned to the user."""

    # Summary
    overall_risk: RiskVerdict
    risk_summary: str = Field(
        ...,
        example=(
            "The proposed substitution meets minimum code requirements but "
            "reduces fire performance. Conditional approval recommended with "
            "additional documentation."
        )
    )

    # Parsed query (echo back so user can verify)
    specified_product: str
    proposed_product: str
    building_function: str
    building_class: str
    building_element: str
    climate_zone: str = Field(default="urban")

    # Per-dimension results
    dimensions: list[DimensionResult]

    # Recommendations
    recommendations: list[str] = Field(
        default_factory=list,
        example=[
            "Request updated DoP from contractor for proposed product",
            "Verify fire test report covers the specific application (ventilated facade)",
            "Consider requesting A2-s1,d0 alternative to maintain original spec intent"
        ]
    )

    # Traceability
    code_documents_referenced: list[str] = Field(
        default_factory=list,
        example=["Bbl (Besluit bouwwerken leefomgeving)", "NEN-EN 13501-1"]
    )

    # Confidence
    data_completeness: str = Field(
        ...,
        example="high",
        description="How complete the underlying data is: high/medium/low"
    )
    missing_data: list[str] = Field(
        default_factory=list,
        example=["Acoustic performance data not available for proposed product"]
    )

    # Alternative product suggestions (populated when verdict is not PASS)
    alternatives: list[AlternativeSuggestion] = Field(default_factory=list)

    # DB record ID — used to save decisions
    assessment_id: Optional[int] = None


class ProductInfo(BaseModel):
    """Product details for the lookup endpoint."""
    id: int
    name: str
    manufacturer: str
    product_type: str
    fire_euroclass: Optional[str] = None
    lambda_value: Optional[float] = None
    compressive_strength: Optional[float] = None
    ce_marking: bool = False


class CodeRequirementInfo(BaseModel):
    """Code requirement for the lookup endpoint."""
    element: str
    dimension: str
    required_class: Optional[str] = None
    min_value: Optional[float] = None
    unit: Optional[str] = None
    code_reference: str
    description: Optional[str] = None
