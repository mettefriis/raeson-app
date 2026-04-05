"""
Daylight Service — Phase 3 of the ræson assessment.

Extracts room geometry from a floor plan image (via Claude Vision) or IFC file,
then calculates the daylight factor (DF) change caused by a glazing substitution.

Regulation:
  BR18 § 382 — minimum DF ≥ 2% in habitable rooms (boliger, undervisning, institutioner)
  BR18 § 383 — natural lighting ≥ 10% of floor area (glazed area)
  EN 17037:2018 — European standard for daylight in buildings

Method: BRE split-flux simplified daylight factor formula (Littlefair 1996, BRE BR305)
  DF ≈ (Aw × τ_v × θ) / (A_total × (1 − R̄²)) × 100
where:
  Aw      = total window area (m²)
  τ_v     = visible light transmittance of glazing (0–1)
  θ       = combined angle factor + maintenance factor (0.85 typical)
  A_total = total room surface area — all 6 faces (m²)
  R̄       = mean room surface reflectance (0.5 assumed)
"""

import base64
import json
import os
from typing import Optional

from api.models.schemas import DimensionResult, RiskVerdict


# BR18 thresholds
BR18_MIN_DF = 2.0          # % — § 382, minimum daylight factor in habitable rooms
BR18_MIN_GLAZED_RATIO = 0.10  # — § 383, minimum glazed area as fraction of floor area

# BRE split-flux constants
THETA = 0.85               # combined angle + maintenance factor (Littlefair 1996 BRE BR305)
MEAN_REFLECTANCE = 0.5     # typical interior room reflectance (BS 8206-2:2008)


# ---------------------------------------------------------------------------
# VLT lookup — visible light transmittance by product name patterns
# These are typical market values; product-specific values override when available.
# Sources: glazing manufacturer data; EN 410:2011 test method
# ---------------------------------------------------------------------------

VLT_NAME_PATTERNS = [
    # High-solar-control glazing — typically VLT 30-45%
    (["suncool", "sunguard", "cool-lite", "stopray", "ipasol", "stopsol"], 0.38),
    (["solar control", "zonwering", "zonnebescherming", "sg "], 0.38),
    # Standard low-e double glazing
    (["low-e", "lowe", "iplus", "climaplus", "energy saver"], 0.65),
    # Triple glazing — typically VLT 55-65%
    (["triple", "3-fach", "drievoudig", "3-lag", " iii "], 0.60),
    # Tinted / body-tinted
    (["bronze", "grey tint", "tinted", "grau", "bronze"], 0.45),
    # Clear / standard double glazing
    (["clear", "planilux", "float", "transparant", "standard double"], 0.72),
    # Translucent / frosted
    (["frosted", "satin", "sandblast", "opal", "translucent"], 0.50),
    # Electrochromic / smart glass
    (["electrochromic", "smart", "switchable", "pdlc"], 0.30),
]

VLT_MATERIAL_CLASS_DEFAULTS = {
    "glass": 0.70,
    "window_glazing": 0.70,
    "triple_glazing": 0.60,
    "solar_control_glazing": 0.38,
    "tinted_glazing": 0.45,
    "frosted_glass": 0.50,
    "structural_glazing": 0.60,
}


def _vlt_from_product(product) -> Optional[float]:
    """
    Infer visible light transmittance from a product record.
    Priority: DB field → name pattern → material class default → None
    """
    # 1. Direct DB field
    if hasattr(product, 'visible_light_transmittance'):
        val = getattr(product, 'visible_light_transmittance', None)
        if val is not None:
            return float(val)

    # 2. Product name keyword matching
    if hasattr(product, 'name') and product.name:
        name_lower = product.name.lower()
        for patterns, vlt in VLT_NAME_PATTERNS:
            if any(p in name_lower for p in patterns):
                return vlt

    # 3. Material class default
    if hasattr(product, 'material_class') and product.material_class:
        mc = product.material_class.lower()
        if mc in VLT_MATERIAL_CLASS_DEFAULTS:
            return VLT_MATERIAL_CLASS_DEFAULTS[mc]
        if 'glass' in mc or 'glaz' in mc:
            return 0.70

    # 4. Product type fallback
    if hasattr(product, 'product_type') and product.product_type:
        pt = product.product_type.lower()
        if 'triple' in pt:
            return 0.60
        if 'solar' in pt or 'sun' in pt:
            return 0.38
        if 'glaz' in pt or 'glass' in pt or 'window' in pt:
            return 0.70

    return None


# ---------------------------------------------------------------------------
# BRE simplified daylight factor
# ---------------------------------------------------------------------------

def _room_surface_area(w: float, d: float, h: float) -> float:
    """Total interior surface area of a box room (m²)."""
    return 2 * (w * d + w * h + d * h)


def _calc_daylight_factor(room: dict, vlt: float) -> float:
    """
    Simplified BRE split-flux daylight factor (%).

    DF = (Aw × τ_v × θ) / (A_total × (1 − R̄²)) × 100
    """
    w = room.get("width_m") or 3.5
    d = room.get("depth_m") or 4.5
    h = room.get("ceiling_height_m") or 2.6

    windows = room.get("windows") or []
    if windows:
        aw = sum(
            (win.get("width_m") or 1.5) * (win.get("height_m") or 1.2)
            for win in windows
        )
    else:
        # No window data — assume 15% of floor area as typical minimum
        aw = w * d * 0.15

    a_total = _room_surface_area(w, d, h)
    df = (aw * vlt * THETA) / (a_total * (1 - MEAN_REFLECTANCE ** 2)) * 100
    return round(max(df, 0.0), 2)


def _glazed_floor_ratio(room: dict) -> float:
    """Window area as a fraction of floor area (for BR18 § 383 check)."""
    w = room.get("width_m") or 3.5
    d = room.get("depth_m") or 4.5
    floor_area = w * d

    windows = room.get("windows") or []
    if not windows:
        return 0.15  # assumed default

    aw = sum(
        (win.get("width_m") or 1.5) * (win.get("height_m") or 1.2)
        for win in windows
    )
    return round(aw / floor_area, 3) if floor_area > 0 else 0.0


# ---------------------------------------------------------------------------
# Vision prompt — sent to Claude with the floor plan image
# ---------------------------------------------------------------------------

VISION_PROMPT = """You are an architectural drawing analyser.

Look at this floor plan image and extract room geometry data for daylight assessment.

For each room or space you can identify:
1. Room name/label (e.g. "living room", "bedroom", "stue", "soveværelse")
2. Width (m) — dimension perpendicular to the window wall. Read from dimension lines or scale bar.
3. Depth (m) — dimension from the window wall to the opposite wall.
4. Ceiling height (m) — if shown in a section or noted. If unknown, use null.
5. Windows: list each window with its approximate width (m) × height (m). For orientation: use any north arrow in the drawing. If no north arrow is visible, write "unknown".

Return ONLY valid JSON in this exact format — no other text:
{
  "rooms": [
    {
      "name": "living room",
      "width_m": 4.2,
      "depth_m": 5.5,
      "ceiling_height_m": 2.6,
      "windows": [
        {"width_m": 2.1, "height_m": 1.4, "orientation": "south"},
        {"width_m": 0.9, "height_m": 1.0, "orientation": "west"}
      ]
    }
  ],
  "confidence": "high",
  "notes": "Scale bar read as 1:100. North arrow points upward."
}

Confidence levels:
- "high": dimension lines or scale bar clearly visible and readable
- "medium": proportions estimated from room layout without explicit dimensions
- "low": image quality too poor to extract reliable dimensions

Use null for values you cannot determine. Include all habitable rooms (bedrooms, living rooms, studies). Skip bathrooms, corridors, storage unless they have windows."""


async def parse_floor_plan_image(image_bytes: bytes, media_type: str) -> dict:
    """
    Send a floor plan image to Claude Vision and extract room geometry.

    Returns a geometry dict with keys: rooms, confidence, notes.
    """
    from anthropic import Anthropic

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set")

    client = Anthropic(api_key=api_key)

    # Normalise media type
    mt = media_type.lower()
    if mt in ("image/jpg", "image/jpeg", "jpg", "jpeg"):
        media_type = "image/jpeg"
    elif mt in ("image/png", "png"):
        media_type = "image/png"
    elif mt in ("image/webp", "webp"):
        media_type = "image/webp"
    elif mt in ("image/gif", "gif"):
        media_type = "image/gif"
    else:
        media_type = "image/jpeg"  # fallback

    image_data = base64.standard_b64encode(image_bytes).decode("utf-8")

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1200,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_data,
                    },
                },
                {
                    "type": "text",
                    "text": VISION_PROMPT,
                }
            ],
        }],
    )

    response_text = message.content[0].text.strip()

    # Strip markdown code fences if present
    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
        response_text = response_text.strip()

    return json.loads(response_text)


def parse_ifc_file(ifc_bytes: bytes) -> dict:
    """
    Parse an IFC file and extract room geometry using ifcopenshell.
    Returns a geometry dict with the same structure as parse_floor_plan_image.
    Falls back gracefully if ifcopenshell is not installed.
    """
    try:
        import ifcopenshell
        import tempfile
        import os as _os

        # ifcopenshell requires a file path, not bytes
        with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as f:
            f.write(ifc_bytes)
            tmp_path = f.name

        try:
            model = ifcopenshell.open(tmp_path)
        finally:
            _os.unlink(tmp_path)

        rooms = []
        for space in model.by_type("IfcSpace"):
            name = space.LongName or space.Name or "Room"

            width, depth, height = None, None, None

            # Try to read geometry from element quantities
            for rel in (space.IsDefinedBy or []):
                if rel.is_a("IfcRelDefinesByProperties"):
                    pset = rel.RelatingPropertyDefinition
                    if pset.is_a("IfcElementQuantity"):
                        for qty in (pset.Quantities or []):
                            if qty.is_a("IfcQuantityLength"):
                                qname = qty.Name.lower()
                                if "width" in qname:
                                    width = qty.LengthValue
                                elif "depth" in qname or "length" in qname:
                                    depth = qty.LengthValue
                                elif "height" in qname:
                                    height = qty.LengthValue

            # Collect windows bounding this space
            windows = []
            for boundary in (getattr(space, "BoundedBy", None) or []):
                el = getattr(boundary, "RelatedBuildingElement", None)
                if el and el.is_a("IfcWindow"):
                    w_w = getattr(el, "OverallWidth", None) or 1.2
                    w_h = getattr(el, "OverallHeight", None) or 1.4
                    windows.append({
                        "width_m": round(float(w_w), 2),
                        "height_m": round(float(w_h), 2),
                        "orientation": "unknown",
                    })

            rooms.append({
                "name": str(name),
                "width_m": round(float(width), 2) if width else None,
                "depth_m": round(float(depth), 2) if depth else None,
                "ceiling_height_m": round(float(height), 2) if height else 2.6,
                "windows": windows,
            })

        has_dims = any(r.get("width_m") for r in rooms)
        return {
            "rooms": rooms,
            "confidence": "high" if has_dims else "medium",
            "notes": f"Parsed {len(rooms)} spaces from IFC. Window orientations not extracted (requires IfcSite north direction).",
        }

    except ImportError:
        return {
            "rooms": [],
            "confidence": "low",
            "notes": "IFC parsing requires ifcopenshell. Install with: pip install ifcopenshell",
            "error": "ifc_not_supported",
        }
    except Exception as e:
        return {
            "rooms": [],
            "confidence": "low",
            "notes": f"IFC parsing error: {str(e)}",
            "error": str(e),
        }


# ---------------------------------------------------------------------------
# Main daylight check — called by orchestrator
# ---------------------------------------------------------------------------

def check_daylight(
    geometry: dict,
    specified,   # Product
    proposed,    # Product
) -> DimensionResult:
    """
    Calculate daylight factor change for a glazing substitution.

    Returns a DimensionResult for dimension "daylight_quality".
    """
    rooms = geometry.get("rooms") or []
    confidence = geometry.get("confidence", "medium")
    parse_notes = geometry.get("notes", "")

    # No rooms parsed from image
    if not rooms:
        return DimensionResult(
            dimension="daylight_quality",
            verdict=RiskVerdict.CONDITIONAL,
            requirement="Daylight factor ≥ 2.0% in habitable rooms (BR18 § 382)",
            specified_value="No geometry extracted",
            proposed_value="No geometry extracted",
            delta=(
                f"Room geometry could not be read from the uploaded plan. "
                f"{parse_notes} "
                "Ensure the image shows a dimensioned floor plan with visible scale bar."
            ),
            code_reference="BR18 § 382; EN 17037:2018",
        )

    spec_vlt = _vlt_from_product(specified)
    prop_vlt = _vlt_from_product(proposed)

    # Missing VLT data
    if spec_vlt is None or prop_vlt is None:
        spec_label = f"VLT ≈ {spec_vlt:.0%}" if spec_vlt else "VLT unknown"
        prop_label = f"VLT ≈ {prop_vlt:.0%}" if prop_vlt else "VLT unknown"
        return DimensionResult(
            dimension="daylight_quality",
            verdict=RiskVerdict.CONDITIONAL,
            requirement="Daylight factor ≥ 2.0% in habitable rooms (BR18 § 382)",
            specified_value=spec_label,
            proposed_value=prop_label,
            delta=(
                "Visible light transmittance (VLT) not available for one or both products. "
                "Add VLT to the product technical datasheet to enable daylight calculation. "
                f"Geometry: {len(rooms)} room(s) parsed ({confidence} confidence)."
            ),
            code_reference="BR18 § 382; EN 17037:2018; EN 410:2011",
        )

    # Per-room daylight factor calculation
    room_results = []
    for room in rooms:
        df_spec = _calc_daylight_factor(room, spec_vlt)
        df_prop = _calc_daylight_factor(room, prop_vlt)
        gfr = _glazed_floor_ratio(room)
        room_results.append({
            "name": room.get("name", "room"),
            "df_spec": df_spec,
            "df_prop": df_prop,
            "glazed_floor_ratio": gfr,
        })

    fail_rooms = [r for r in room_results if r["df_prop"] < BR18_MIN_DF]
    near_rooms = [r for r in room_results
                  if BR18_MIN_DF <= r["df_prop"] < BR18_MIN_DF * 1.25]

    vlt_delta = prop_vlt - spec_vlt
    vlt_pct = (vlt_delta / spec_vlt * 100) if spec_vlt > 0 else 0

    # Compact room summary (max 4 rooms)
    room_summary = "; ".join(
        f"{r['name']}: {r['df_spec']:.1f}%→{r['df_prop']:.1f}%"
        for r in room_results[:4]
    )
    if len(room_results) > 4:
        room_summary += f" (+{len(room_results) - 4} more)"

    worst = min(room_results, key=lambda r: r["df_prop"])
    best_spec = max(room_results, key=lambda r: r["df_spec"])

    fail_list = ", ".join(f"{r['name']} ({r['df_prop']:.1f}%)" for r in fail_rooms)
    near_list = ", ".join(f"{r['name']} ({r['df_prop']:.1f}%)" for r in near_rooms)

    if fail_rooms:
        verdict = RiskVerdict.FAIL
        delta = (
            f"VLT drops {spec_vlt:.0%} → {prop_vlt:.0%} ({vlt_pct:+.0f}%). "
            f"{len(fail_rooms)} room(s) fall below BR18 2% daylight factor: {fail_list}. "
            f"All rooms: {room_summary}. "
            f"Source: {confidence}-confidence floor plan. Method: BRE split-flux (BR305)."
        )
    elif near_rooms:
        verdict = RiskVerdict.CONDITIONAL
        delta = (
            f"VLT drops {spec_vlt:.0%} → {prop_vlt:.0%} ({vlt_pct:+.0f}%). "
            f"All rooms remain above 2%, but {len(near_rooms)} room(s) are within 25% of threshold: {near_list}. "
            f"Recommend full EN 17037 assessment. All rooms: {room_summary}. "
            f"Source: {confidence}-confidence floor plan."
        )
    elif vlt_delta < -0.05:
        verdict = RiskVerdict.PASS
        delta = (
            f"VLT drops {spec_vlt:.0%} → {prop_vlt:.0%} ({vlt_pct:+.0f}%) "
            f"but all rooms remain above the 2% BR18 threshold. "
            f"Worst room: {worst['name']} ({worst['df_prop']:.1f}%). "
            f"All rooms: {room_summary}. Source: {confidence}-confidence floor plan."
        )
    else:
        verdict = RiskVerdict.PASS
        delta = (
            f"VLT maintained or improved ({spec_vlt:.0%} → {prop_vlt:.0%}). "
            f"Daylight factor maintained across all rooms. "
            f"All rooms: {room_summary}. Source: {confidence}-confidence floor plan."
        )

    return DimensionResult(
        dimension="daylight_quality",
        verdict=verdict,
        requirement="Daylight factor ≥ 2.0% in habitable rooms (BR18 § 382 / EN 17037)",
        specified_value=(
            f"VLT = {spec_vlt:.0%} → DF {best_spec['df_spec']:.1f}% "
            f"(best room: {best_spec['name']})"
        ),
        proposed_value=(
            f"VLT = {prop_vlt:.0%} → DF {worst['df_prop']:.1f}% "
            f"(worst room: {worst['name']})"
        ),
        delta=delta,
        code_reference="BR18 § 382; EN 17037:2018; BRE BR305 (Littlefair 1996)",
    )
