"""
Wellbeing Engine — Phase 2 of the ræson assessment.

Evaluates the human experiential impact of a material substitution across:
  1. Biophilic quality
  2. Acoustic quality (absorption)
  3. Thermal comfort feel (effusivity)

These are NOT pass/fail compliance checks — they are evidence-grounded
assessments of how the substitution changes the experiential quality of
the space. The outputs are advisory dimensions, not code violations.

Evidence base:
  - Biophilic: Browning et al. 2014 "14 Patterns of Biophilic Design"
    (Terrapin Bright Green); Salingaros fractal complexity research;
    Ulrich 1984 recovery and views research.
  - Acoustic: EN ISO 11654 (weighted absorption coefficient αw).
  - Thermal feel: EN ISO 10456 / ISO 7726 (thermal effusivity b).
"""

from api.models.database import Product
from api.models.schemas import DimensionResult, RiskVerdict
from typing import Optional


# ---------------------------------------------------------------------------
# Biophilic score thresholds (scale 0–10)
# ---------------------------------------------------------------------------
BIOPHILIC_SIGNIFICANT_DROP = 2.0   # drop of ≥ 2.0 → CONDITIONAL
BIOPHILIC_MAJOR_DROP = 4.0         # drop of ≥ 4.0 → FAIL (for exposed surfaces)

# EN ISO 11654 absorption class boundaries (αw)
ABSORPTION_CLASSES = {
    "A": (0.90, 1.00),
    "B": (0.80, 0.89),
    "C": (0.60, 0.79),
    "D": (0.30, 0.59),
    "E": (0.15, 0.29),
    "not classified": (0.00, 0.14),
}


def _absorption_class(aw: float) -> str:
    for cls, (lo, hi) in ABSORPTION_CLASSES.items():
        if lo <= aw <= hi:
            return cls
    return "not classified"


def _effusivity_feel(b: float) -> str:
    if b < 100:
        return "very warm"
    if b < 300:
        return "warm"
    if b < 600:
        return "neutral"
    if b < 1000:
        return "cool"
    return "cold"


def check_biophilic(
    specified: Product,
    proposed: Product,
    building_element: str,
) -> Optional[DimensionResult]:
    """
    Assess biophilic quality change between specified and proposed material.

    Only meaningful for visible/exposed elements: facade_cladding, internal_wall,
    window_glazing, structural_frame (exposed timber etc.).
    Hidden elements (facade_insulation behind cladding) are skipped.
    """
    # Biophilic quality is only relevant for exposed surfaces
    EXPOSED_ELEMENTS = {
        "facade_cladding", "internal_wall", "external_wall",
        "structural_frame", "window_glazing", "floor_insulation",
    }
    if building_element not in EXPOSED_ELEMENTS:
        return None

    spec_score = specified.biophilic_score
    prop_score = proposed.biophilic_score

    if spec_score is None or prop_score is None:
        return DimensionResult(
            dimension="biophilic_quality",
            verdict=RiskVerdict.CONDITIONAL,
            requirement="Biophilic quality should not significantly decrease (Browning et al. 2014)",
            specified_value=f"{spec_score:.1f}/10" if spec_score is not None else "no data",
            proposed_value=f"{prop_score:.1f}/10" if prop_score is not None else "no data",
            delta="Insufficient biophilic data to assess impact",
            code_reference="Browning et al. 2014 — 14 Patterns of Biophilic Design (Terrapin)",
        )

    delta = prop_score - spec_score
    abs_delta = abs(delta)

    spec_notes = specified.biophilic_notes or ""
    prop_notes = proposed.biophilic_notes or ""

    if delta >= 0:
        verdict = RiskVerdict.PASS
        if delta > 0:
            delta_str = (
                f"Biophilic quality improves by +{delta:.1f} points "
                f"({specified.name}: {spec_score:.1f} → {proposed.name}: {prop_score:.1f}/10). "
                f"{prop_notes}"
            )
        else:
            delta_str = (
                f"No change in biophilic quality ({spec_score:.1f}/10). "
                f"{prop_notes}"
            )
    elif abs_delta < BIOPHILIC_SIGNIFICANT_DROP:
        verdict = RiskVerdict.PASS
        delta_str = (
            f"Minor biophilic quality reduction: −{abs_delta:.1f} points "
            f"({spec_score:.1f} → {prop_score:.1f}/10). "
            f"Specified: {spec_notes} Proposed: {prop_notes}"
        )
    elif abs_delta < BIOPHILIC_MAJOR_DROP:
        verdict = RiskVerdict.CONDITIONAL
        delta_str = (
            f"Notable biophilic quality reduction: −{abs_delta:.1f} points "
            f"({spec_score:.1f} → {prop_score:.1f}/10). "
            f"Specified ({specified.name}): {spec_notes} "
            f"Proposed ({proposed.name}): {prop_notes} "
            f"Research (Browning et al. 2014) links reduced biophilic density "
            f"to lower occupant wellbeing, productivity, and stress recovery."
        )
    else:
        verdict = RiskVerdict.FAIL
        delta_str = (
            f"Significant biophilic quality reduction: −{abs_delta:.1f} points "
            f"({spec_score:.1f} → {prop_score:.1f}/10). "
            f"Specified ({specified.name}): {spec_notes} "
            f"Proposed ({proposed.name}): {prop_notes} "
            f"This level of reduction is associated with measurable negative "
            f"effects on occupant stress, cognitive performance, and wellbeing "
            f"(Browning et al. 2014; Salingaros fractal complexity research; "
            f"Ulrich 1984 recovery study)."
        )

    return DimensionResult(
        dimension="biophilic_quality",
        verdict=verdict,
        requirement="Biophilic quality maintained or improved (Browning et al. 2014 — Pattern 7: Material Connection with Nature)",
        specified_value=f"{spec_score:.1f}/10 — {spec_notes[:60]}" if spec_notes else f"{spec_score:.1f}/10",
        proposed_value=f"{prop_score:.1f}/10 — {prop_notes[:60]}" if prop_notes else f"{prop_score:.1f}/10",
        delta=delta_str,
        code_reference="Browning et al. 2014; Salingaros 2012; Ulrich 1984",
    )


def check_acoustic_absorption(
    specified: Product,
    proposed: Product,
    building_element: str,
) -> Optional[DimensionResult]:
    """
    Assess acoustic absorption change for elements that affect room acoustics.

    Relevant for: internal_wall, roof_insulation (acoustic ceiling), floor_insulation.
    For facade elements: only relevant if the building element has an exposed
    interior face (e.g. exposed insulation in an industrial/educational space).
    """
    ACOUSTIC_ELEMENTS = {
        "internal_wall", "floor_insulation", "roof_insulation",
        "facade_insulation",  # matters when comparing mineral wool vs foam
    }
    if building_element not in ACOUSTIC_ELEMENTS:
        return None

    spec_aw = specified.acoustic_absorption_aw
    prop_aw = proposed.acoustic_absorption_aw

    if spec_aw is None or prop_aw is None:
        return None  # skip silently if no data

    spec_cls = _absorption_class(spec_aw)
    prop_cls = _absorption_class(prop_aw)

    delta = prop_aw - spec_aw

    if delta >= 0:
        verdict = RiskVerdict.PASS
        delta_str = (
            f"Acoustic absorption maintained or improved. "
            f"Class {spec_cls} (αw={spec_aw:.2f}) → Class {prop_cls} (αw={prop_aw:.2f}). "
            f"EN ISO 11654."
        )
    elif abs(delta) < 0.15:
        verdict = RiskVerdict.PASS
        delta_str = (
            f"Minor acoustic absorption reduction: αw {spec_aw:.2f} → {prop_aw:.2f} "
            f"(Class {spec_cls} → {prop_cls}). Perceptible but unlikely to significantly "
            f"affect room acoustic quality. EN ISO 11654."
        )
    elif abs(delta) < 0.40:
        verdict = RiskVerdict.CONDITIONAL
        delta_str = (
            f"Meaningful acoustic absorption reduction: αw {spec_aw:.2f} → {prop_aw:.2f} "
            f"(Class {spec_cls} → Class {prop_cls}). "
            f"For spaces with acoustic performance requirements (classrooms, offices, "
            f"healthcare), review reverberation time implications. EN ISO 11654."
        )
    else:
        verdict = RiskVerdict.FAIL
        delta_str = (
            f"Significant acoustic absorption loss: αw {spec_aw:.2f} → {prop_aw:.2f} "
            f"(Class {spec_cls} → Class {prop_cls}). "
            f"Mineral wool (Class A) replaced by low-absorption material. "
            f"Reverberation time will increase substantially — compensatory "
            f"acoustic treatment required, especially for institutioner. EN ISO 11654."
        )

    return DimensionResult(
        dimension="acoustic_quality",
        verdict=verdict,
        requirement="Acoustic absorption maintained (EN ISO 11654 — Class A/B for institutional spaces)",
        specified_value=f"Class {spec_cls} (αw = {spec_aw:.2f})",
        proposed_value=f"Class {prop_cls} (αw = {prop_aw:.2f})",
        delta=delta_str,
        code_reference="EN ISO 11654 / ISO 354",
    )


def check_thermal_feel(
    specified: Product,
    proposed: Product,
    building_element: str,
) -> Optional[DimensionResult]:
    """
    Assess thermal effusivity change for surfaces that occupants perceive directly.

    Thermal effusivity b = √(λ · ρ · cp) determines whether a surface feels
    warm or cold to the touch — a key component of thermal comfort (ISO 7726).

    Only relevant for interior-facing or directly touchable surfaces.
    """
    TACTILE_ELEMENTS = {
        "internal_wall", "floor_insulation", "facade_cladding",
        "structural_frame",
    }
    if building_element not in TACTILE_ELEMENTS:
        return None

    spec_b = specified.thermal_effusivity
    prop_b = proposed.thermal_effusivity

    if spec_b is None or prop_b is None:
        return None

    spec_feel = _effusivity_feel(spec_b)
    prop_feel = _effusivity_feel(prop_b)

    delta = prop_b - spec_b

    # Perceptually significant difference threshold: ~500 W·s^0.5/(m²·K)
    # Source: Johansson et al. 2014, Journal of Wood Science 60(3)
    PERCEPTIBLE_THRESHOLD = 500

    if abs(delta) < PERCEPTIBLE_THRESHOLD:
        verdict = RiskVerdict.PASS
        delta_str = (
            f"Thermal feel unchanged. "
            f"Effusivity: {spec_b:.0f} ({spec_feel}) → {prop_b:.0f} ({prop_feel}) W·s^0.5/(m²·K). "
            f"Difference < perceptible threshold. ISO 7726."
        )
    elif delta > 0:
        # Feels colder
        if delta < 500:
            verdict = RiskVerdict.CONDITIONAL
        else:
            verdict = RiskVerdict.FAIL
        delta_str = (
            f"Surface will feel colder to occupants. "
            f"Effusivity increases from {spec_b:.0f} ({spec_feel}) to "
            f"{prop_b:.0f} ({prop_feel}) W·s^0.5/(m²·K) (+{delta:.0f}). "
            f"Higher effusivity = faster heat extraction from skin = perceived coldness. "
            f"Relevant for tactile comfort in residential and healthcare spaces (ISO 7726)."
        )
    else:
        # Feels warmer
        verdict = RiskVerdict.PASS
        delta_str = (
            f"Surface will feel warmer to occupants. "
            f"Effusivity decreases from {spec_b:.0f} ({spec_feel}) to "
            f"{prop_b:.0f} ({prop_feel}) W·s^0.5/(m²·K) ({delta:.0f}). "
            f"Lower effusivity = reduced heat extraction from skin = perceived warmth. ISO 7726."
        )

    return DimensionResult(
        dimension="thermal_comfort",
        verdict=verdict,
        requirement="Thermal feel maintained or improved for occupied surfaces (ISO 7726)",
        specified_value=f"b = {spec_b:.0f} W·s^0.5/(m²·K) ({spec_feel})",
        proposed_value=f"b = {prop_b:.0f} W·s^0.5/(m²·K) ({prop_feel})",
        delta=delta_str,
        code_reference="ISO 7726 / EN ISO 10456",
    )


def assess_wellbeing(
    specified: Product,
    proposed: Product,
    building_element: str,
) -> list[DimensionResult]:
    """Run all wellbeing checks and return non-None results."""
    results = []

    r = check_biophilic(specified, proposed, building_element)
    if r:
        results.append(r)

    r = check_acoustic_absorption(specified, proposed, building_element)
    if r:
        results.append(r)

    r = check_thermal_feel(specified, proposed, building_element)
    if r:
        results.append(r)

    return results
