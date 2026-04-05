"""
Offline Assessment Orchestrator — works WITHOUT an Anthropic API key.

Instead of using Claude to parse queries and generate narratives,
this version uses simple keyword matching and template-based output.

Replace api/services/orchestrator.py with this file to run without an API key.
"""

from datetime import datetime, timezone
import json
import re
from sqlalchemy.orm import Session
from api.models.database import Product, AssessmentLog
from api.models.schemas import (
    SubstitutionRequest,
    SubstitutionAssessment,
    AlternativeSuggestion,
    DimensionResult,
    RiskVerdict,
)
from api.services.compliance_engine import ComplianceEngine
from api.services.wellbeing_engine import assess_wellbeing
from typing import Optional


# -------------------------------------------------------------------
# Simple keyword-based query parser (replaces LLM)
# -------------------------------------------------------------------

FUNCTION_KEYWORDS = {
    "residential": "woonfunctie",
    "woning": "woonfunctie",
    "woon": "woonfunctie",
    "apartment": "woonfunctie",
    "housing": "woonfunctie",
    "office": "kantoorfunctie",
    "kantoor": "kantoorfunctie",
    "school": "onderwijsfunctie",
    "education": "onderwijsfunctie",
    "hospital": "gezondheidszorgfunctie",
    "healthcare": "gezondheidszorgfunctie",
    "retail": "winkelfunctie",
    "shop": "winkelfunctie",
    "industrial": "industriefunctie",
    "hotel": "logiesfunctie",
}

ELEMENT_KEYWORDS = {
    "facade insulation": "facade_insulation",
    "gevelisolatie": "facade_insulation",
    "facade cladding": "facade_cladding",
    "gevelbekleding": "facade_cladding",
    "cladding": "facade_cladding",
    "roof insulation": "roof_insulation",
    "dakisolatie": "roof_insulation",
    "floor insulation": "floor_insulation",
    "vloerisolatie": "floor_insulation",
    "fire door": "fire_door",
    "branddeur": "fire_door",
    "window": "window_glazing",
    "glazing": "window_glazing",
    "glass": "window_glazing",
    "beglazing": "window_glazing",
    "internal wall": "internal_wall",
    "binnenwand": "internal_wall",
    "external wall": "external_wall",
    "buitengevel": "external_wall",
}

CLASS_KEYWORDS = {
    "klasse 1": "klasse_1",
    "klasse_1": "klasse_1",
    "class 1": "klasse_1",
    "low-rise": "klasse_1",
    "laagbouw": "klasse_1",
    "klasse 2": "klasse_2",
    "klasse_2": "klasse_2",
    "class 2": "klasse_2",
    "mid-rise": "klasse_2",
    "klasse 3": "klasse_3",
    "klasse_3": "klasse_3",
    "class 3": "klasse_3",
    "high-rise": "klasse_3",
    "hoogbouw": "klasse_3",
}

CLIMATE_KEYWORDS = {
    "coastal": "coastal", "coast": "coastal", "seaside": "coastal",
    "marine": "coastal", "zee": "coastal", "kust": "coastal",
    "north sea": "coastal", "noordzee": "coastal",
    "continental": "continental", "inland": "continental", "binnenland": "continental",
}

CITY_CLIMATE = {
    "vlissingen": "coastal", "middelburg": "coastal", "den helder": "coastal",
    "scheveningen": "coastal", "hoek van holland": "coastal",
    "amsterdam": "urban", "rotterdam": "urban", "den haag": "urban",
    "the hague": "urban", "utrecht": "urban", "eindhoven": "urban",
    "groningen": "urban", "leiden": "urban", "delft": "urban", "haarlem": "urban",
    "zwolle": "continental", "nijmegen": "continental", "maastricht": "continental",
}

ADJACENT_MATERIAL_KEYWORDS = {
    "copper pipe": "copper", "copper": "copper",
    "galvanised steel": "galvanised_steel", "galvanized steel": "galvanised_steel",
    "galvanised": "galvanised_steel", "galvanized": "galvanised_steel",
    "zinc": "zinc",
    "pvc membrane": "pvc", "pvc": "pvc",
    "bitumen": "bitumen", "bituminous": "bitumen",
    "concrete": "concrete", "cement": "concrete",
    "aluminium frame": "aluminium", "aluminium": "aluminium", "aluminum": "aluminium",
    "stainless steel": "stainless_steel",
    "carbon steel": "carbon_steel", "steel frame": "carbon_steel",
    "polystyrene": "eps_insulation",
}


def _parse_query_offline(query: str) -> dict:
    """Simple keyword parser — no LLM needed."""
    q = query.lower()

    # Find building function
    building_function = "woonfunctie"  # default
    for kw, val in FUNCTION_KEYWORDS.items():
        if kw in q:
            building_function = val
            break

    # Find building element
    building_element = "facade_insulation"  # default
    for kw, val in ELEMENT_KEYWORDS.items():
        if kw in q:
            building_element = val
            break

    # Find building class
    building_class = "klasse_2"  # default
    for kw, val in CLASS_KEYWORDS.items():
        if kw in q:
            building_class = val
            break

    # Infer class from floor count if not explicitly stated
    floor_match = re.search(r'(\d+)\s*(?:floor|stor|verdieping|etage)', q)
    if floor_match and "klasse" not in q and "class" not in q:
        floors = int(floor_match.group(1))
        if floors <= 3:
            building_class = "klasse_1"
        elif floors <= 20:
            building_class = "klasse_2"
        else:
            building_class = "klasse_3"

    # Find product names — look for "instead of X" / "replace X with Y" patterns
    specified = None
    proposed = None

    # Pattern: "[proposed] instead of [specified]"
    m = re.search(r'(?:proposes?|use|using|substitute)\s+(.+?)\s+(?:instead of|in place of|for|replacing)\s+(?:the\s+)?(?:specified\s+)?(.+?)(?:\s+for\s+|\s+on\s+|\s+in\s+|\.|$)', q, re.IGNORECASE)
    if m:
        proposed = m.group(1).strip().rstrip('.,')
        specified = m.group(2).strip().rstrip('.,')

    # Pattern: "replace [specified] with [proposed]"
    if not specified:
        m = re.search(r'(?:replace|swap|substitute|switch)\s+(.+?)\s+(?:with|for|by)\s+(.+?)(?:\s+on\s+|\s+in\s+|\s+for\s+|\.|$)', q, re.IGNORECASE)
        if m:
            specified = m.group(1).strip().rstrip('.,')
            proposed = m.group(2).strip().rstrip('.,')

    # Pattern: "[specified] → [proposed]" or "[specified] to [proposed]"
    if not specified:
        m = re.search(r'from\s+(.+?)\s+to\s+(.+?)(?:\s+on\s+|\s+in\s+|\s+for\s+|\.|$)', q, re.IGNORECASE)
        if m:
            specified = m.group(1).strip().rstrip('.,')
            proposed = m.group(2).strip().rstrip('.,')

    # Climate zone
    climate_zone = "urban"  # default
    for kw, val in CLIMATE_KEYWORDS.items():
        if kw in q:
            climate_zone = val
            break
    if climate_zone == "urban":  # no explicit keyword, try city name
        for city, zone in CITY_CLIMATE.items():
            if city in q:
                climate_zone = zone
                break

    # Adjacent materials
    adjacent_materials = []
    for kw, mat in ADJACENT_MATERIAL_KEYWORDS.items():
        if kw in q and mat not in adjacent_materials:
            adjacent_materials.append(mat)

    return {
        "specified_product": specified,
        "proposed_product": proposed,
        "building_function": building_function,
        "building_class": building_class,
        "building_element": building_element,
        "climate_zone": climate_zone,
        "adjacent_materials": adjacent_materials,
    }


# -------------------------------------------------------------------
# Template-based narrative (replaces LLM)
# -------------------------------------------------------------------

def _generate_narrative_offline(
    assessment_data: dict, dimensions: list[DimensionResult]
) -> tuple[str, list[str]]:
    """Generate a simple narrative without LLM."""

    overall = assessment_data["overall_risk"]
    specified = assessment_data["specified_product"]
    proposed = assessment_data["proposed_product"]
    element = assessment_data["building_element"].replace("_", " ")

    # Summary
    if overall == "fail":
        summary = (
            f"The proposed substitution of {specified} with {proposed} "
            f"for {element} does NOT meet applicable building code requirements. "
            f"One or more compliance dimensions fail. "
            f"This substitution should not be approved without modifications."
        )
    elif overall == "conditional":
        summary = (
            f"The proposed substitution of {specified} with {proposed} "
            f"for {element} cannot be fully assessed due to missing data. "
            f"Available checks pass, but additional information is needed "
            f"before approval."
        )
    else:
        summary = (
            f"The proposed substitution of {specified} with {proposed} "
            f"for {element} meets all applicable building code requirements. "
            f"The substitution can be approved."
        )

    # Add dimension details
    for d in dimensions:
        if d.verdict == RiskVerdict.FAIL:
            summary += (
                f" Critical: {d.dimension.replace('_', ' ')} — "
                f"{d.delta}."
            )

    # Recommendations
    recommendations = []
    has_fail = any(d.verdict == RiskVerdict.FAIL for d in dimensions)
    has_conditional = any(d.verdict == RiskVerdict.CONDITIONAL for d in dimensions)

    if has_fail:
        recommendations.append(
            "Do not approve this substitution in its current form."
        )
        recommendations.append(
            "Request an alternative product that meets the required fire "
            "classification for this building class and element."
        )
        recommendations.append(
            "If the contractor insists on this product, a formal deviation "
            "request with compensatory measures must be submitted to the "
            "municipality (bevoegd gezag)."
        )
    elif has_conditional:
        recommendations.append(
            "Request the contractor to provide the Declaration of Performance "
            "(DoP) and technical datasheet for the proposed product."
        )
        recommendations.append(
            "Verify missing properties before approving the substitution."
        )
    else:
        recommendations.append(
            "Substitution can be approved. File the assessment with project "
            "documentation for audit trail."
        )
        recommendations.append(
            "Request the contractor to confirm CE marking and provide "
            "the DoP for the proposed product."
        )

    return summary, recommendations


# -------------------------------------------------------------------
# Product lookup
# -------------------------------------------------------------------

def _find_product(db: Session, name: str) -> Product | None:
    """Fuzzy-ish product lookup."""
    if not name:
        return None

    product = db.query(Product).filter(Product.name == name).first()
    if product:
        return product

    product = (
        db.query(Product)
        .filter(Product.name.ilike(f"%{name}%"))
        .first()
    )
    if product:
        return product

    parts = name.split()
    for part in parts:
        if len(part) > 3:
            product = (
                db.query(Product)
                .filter(
                    Product.name.ilike(f"%{part}%")
                    | Product.manufacturer.ilike(f"%{part}%")
                )
                .first()
            )
            if product:
                return product

    return None


# -------------------------------------------------------------------
# Main orchestrator
# -------------------------------------------------------------------

async def run_assessment(
    request: SubstitutionRequest,
    db: Session,
    floor_plan_geometry: Optional[dict] = None,
) -> SubstitutionAssessment:
    """Full assessment pipeline — works offline, no API key needed."""

    # Step 1: Parse — use LLM if API key available, else fall back to keyword matching
    br25_typology = None
    if request.query and not request.specified_product:
        try:
            from api.services.llm_service import parse_query as llm_parse
            parsed = await llm_parse(request.query)
        except Exception:
            parsed = _parse_query_offline(request.query)
        specified_name = parsed.get("specified_product")
        proposed_name = parsed.get("proposed_product")
        building_function = parsed.get("building_function", "woonfunctie")
        building_class = parsed.get("building_class", "klasse_2")
        building_element = parsed.get("building_element", "facade_insulation")
        climate_zone = parsed.get("climate_zone", "urban")
        adjacent_materials = parsed.get("adjacent_materials", [])
        br25_typology = parsed.get("br25_typology")
    else:
        specified_name = request.specified_product
        proposed_name = request.proposed_product
        building_function = request.building_function or "woonfunctie"
        building_class = request.building_class or "klasse_2"
        building_element = request.building_element or "facade_insulation"
        climate_zone = request.climate_zone or "urban"
        adjacent_materials = request.adjacent_materials or []

    # Step 2: Look up products
    specified = _find_product(db, specified_name)
    proposed = _find_product(db, proposed_name)

    missing_data = []
    if not specified:
        missing_data.append(
            f"Specified product '{specified_name}' not found in database"
        )
    if not proposed:
        missing_data.append(
            f"Proposed product '{proposed_name}' not found in database"
        )

    # Step 3: Compliance engine
    dimensions: list[DimensionResult] = []

    if specified and proposed:
        engine = ComplianceEngine(db)
        dimensions = engine.assess(
            building_function=building_function,
            building_class=building_class,
            element=building_element,
            specified_product=specified,
            proposed_product=proposed,
            climate_zone=climate_zone,
            adjacent_materials=adjacent_materials or [],
            br25_typology=br25_typology,
        )
        overall = ComplianceEngine.overall_verdict(dimensions)
        data_completeness = "high"
    elif proposed and not specified:
        engine = ComplianceEngine(db)
        dimensions = engine.assess(
            building_function=building_function,
            building_class=building_class,
            element=building_element,
            specified_product=proposed,
            proposed_product=proposed,
            climate_zone=climate_zone,
            adjacent_materials=adjacent_materials or [],
            br25_typology=br25_typology,
        )
        overall = ComplianceEngine.overall_verdict(dimensions)
        data_completeness = "medium"
    else:
        overall = RiskVerdict.CONDITIONAL
        data_completeness = "low"

    # Step 3b: Wellbeing assessment (Phase 2)
    if specified and proposed:
        wellbeing_results = assess_wellbeing(specified, proposed, building_element)
        dimensions = dimensions + wellbeing_results

    # Step 3c: Daylight assessment (Phase 3) — only when floor plan uploaded
    if floor_plan_geometry is not None and building_element == "window_glazing":
        from api.services.daylight_service import check_daylight
        daylight_result = check_daylight(
            floor_plan_geometry,
            specified or proposed,
            proposed or specified,
        )
        dimensions = dimensions + [daylight_result]

    # Step 4: Generate narrative — LLM if available, else template
    assessment_data = {
        "specified_product": specified_name or "unknown",
        "proposed_product": proposed_name or "unknown",
        "building_function": building_function,
        "building_class": building_class,
        "building_element": building_element,
        "overall_risk": overall.value,
        "climate_zone": climate_zone,
        "br25_typology": br25_typology,
        "dimensions": [
            {
                "dimension": d.dimension,
                "verdict": d.verdict.value if hasattr(d.verdict, "value") else d.verdict,
                "requirement": d.requirement,
                "specified_value": d.specified_value,
                "proposed_value": d.proposed_value,
                "delta": d.delta,
                "code_reference": d.code_reference,
            }
            for d in dimensions
        ],
    }

    try:
        from api.services.llm_service import generate_narrative as llm_narrative
        summary, recommendations = await llm_narrative(assessment_data)
    except Exception:
        summary, recommendations = _generate_narrative_offline(assessment_data, dimensions)

    # Step 5: Alternative suggestions (when verdict is not clean pass)
    alternatives: list[AlternativeSuggestion] = []
    if overall != RiskVerdict.PASS and specified and proposed:
        raw_alts = engine.suggest_alternatives(
            building_function=building_function,
            building_class=building_class,
            element=building_element,
            specified_product=specified,
            proposed_product=proposed,
            climate_zone=climate_zone,
            adjacent_materials=adjacent_materials or [],
        )
        alternatives = [
            AlternativeSuggestion(
                name=alt["product"].name,
                manufacturer=alt["product"].manufacturer,
                product_type=alt["product"].product_type,
                fire_euroclass=alt["product"].fire_euroclass,
                epd_co2_per_m2=alt["product"].epd_co2_per_m2,
                service_life_years=alt["product"].service_life_years,
                verdict=alt["verdict"],
                why=alt["why"],
            )
            for alt in raw_alts
        ]

    # Step 6: Log and return
    log_entry = AssessmentLog(
        timestamp=datetime.now(timezone.utc).isoformat(),
        query_text=request.query or f"{specified_name} -> {proposed_name}",
        specified_product=specified_name,
        proposed_product=proposed_name,
        building_function=building_function,
        building_class=building_class,
        building_element=building_element,
        overall_risk=overall.value,
        assessment_json=json.dumps(assessment_data),
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    code_docs = list({d.code_reference.split(" art.")[0] for d in dimensions})

    return SubstitutionAssessment(
        overall_risk=overall,
        risk_summary=summary,
        specified_product=specified_name or "unknown",
        proposed_product=proposed_name or "unknown",
        building_function=building_function,
        building_class=building_class,
        building_element=building_element,
        climate_zone=climate_zone,
        dimensions=dimensions,
        recommendations=recommendations,
        code_documents_referenced=code_docs or ["Bbl"],
        data_completeness=data_completeness,
        missing_data=missing_data,
        alternatives=alternatives,
        assessment_id=log_entry.id,
    )
