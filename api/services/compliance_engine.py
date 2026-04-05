"""
Compliance Engine — the heart of Ræson.

This is DETERMINISTIC. No LLM calls. Given a building context
and two products, it checks every applicable code requirement
and returns pass/conditional/fail per dimension.

The LLM is used upstream (to parse queries) and downstream
(to generate narratives). This module is pure logic.
"""

from sqlalchemy.orm import Session
from api.models.database import (
    CodeRequirement, Product, FireClassRank, MaterialIncompatibility,
    BuildingFunction, BuildingClass, BuildingElement,
    ComplianceDimension
)
from api.models.schemas import DimensionResult, RiskVerdict
from api.data.br25_thresholds import (
    get_lifecycle_limit, get_typology_label, TYPOLOGY_ALIASES,
    CONSTRUCTION_PROCESS_LIMIT, REFERENCE_PERIOD_YEARS
)
from typing import Optional


class ComplianceEngine:

    def __init__(self, db: Session):
        self.db = db
        self._fire_ranks: dict[str, int] = {}
        self._load_fire_ranks()

    def _load_fire_ranks(self):
        """Cache fire class hierarchy for fast comparison."""
        ranks = self.db.query(FireClassRank).all()
        self._fire_ranks = {r.euroclass.upper(): r.rank for r in ranks}

    def _compare_fire_class(
        self, required: str, actual: str
    ) -> tuple[RiskVerdict, str]:
        """
        Compare two Euroclasses. Lower rank = better.
        Returns (verdict, explanation).
        """
        req_rank = self._fire_ranks.get(required.upper())
        act_rank = self._fire_ranks.get(actual.upper())

        if req_rank is None or act_rank is None:
            return (
                RiskVerdict.CONDITIONAL,
                f"Cannot compare: unknown class(es). Required={required}, Actual={actual}"
            )

        if act_rank <= req_rank:
            if act_rank < req_rank:
                return (
                    RiskVerdict.PASS,
                    f"{actual} exceeds requirement of {required}"
                )
            return (
                RiskVerdict.PASS,
                f"{actual} meets requirement of {required}"
            )
        else:
            diff = act_rank - req_rank
            return (
                RiskVerdict.FAIL,
                f"{actual} is {diff} class(es) below required {required}"
            )

    def _compare_numeric(
        self,
        requirement: CodeRequirement,
        actual_value: Optional[float]
    ) -> tuple[RiskVerdict, str]:
        """Compare a numeric property against a code threshold."""

        if actual_value is None:
            return (
                RiskVerdict.CONDITIONAL,
                f"No data available for {requirement.metric}"
            )

        if requirement.min_value is not None:
            if actual_value >= requirement.min_value:
                margin = actual_value - requirement.min_value
                return (
                    RiskVerdict.PASS,
                    f"{actual_value} {requirement.unit} meets minimum "
                    f"{requirement.min_value} {requirement.unit} "
                    f"(margin: +{margin:.2f})"
                )
            else:
                shortfall = requirement.min_value - actual_value
                return (
                    RiskVerdict.FAIL,
                    f"{actual_value} {requirement.unit} below minimum "
                    f"{requirement.min_value} {requirement.unit} "
                    f"(shortfall: -{shortfall:.2f})"
                )

        if requirement.max_value is not None:
            if actual_value <= requirement.max_value:
                return (
                    RiskVerdict.PASS,
                    f"{actual_value} {requirement.unit} within maximum "
                    f"{requirement.max_value} {requirement.unit}"
                )
            else:
                return (
                    RiskVerdict.FAIL,
                    f"{actual_value} {requirement.unit} exceeds maximum "
                    f"{requirement.max_value} {requirement.unit}"
                )

        return (RiskVerdict.CONDITIONAL, "No threshold defined")

    def _get_product_value_for_dimension(
        self, product: Product, dimension: str, metric: Optional[str]
    ) -> tuple[Optional[str], Optional[float]]:
        """
        Extract the relevant property from a product for a given dimension.
        Returns (class_value, numeric_value).
        """
        if dimension == ComplianceDimension.FIRE_REACTION:
            return (product.fire_euroclass, None)

        if dimension == ComplianceDimension.FIRE_RESISTANCE:
            return (None, product.fire_resistance_minutes)

        if dimension == ComplianceDimension.THERMAL:
            if metric == "lambda":
                return (None, product.lambda_value)
            if metric == "Rc":
                return (None, product.r_value_per_unit)
            return (None, product.lambda_value)

        if dimension == ComplianceDimension.STRUCTURAL:
            if metric == "compressive_strength":
                return (None, product.compressive_strength)
            if metric == "tensile_strength":
                return (None, product.tensile_strength)
            return (None, product.compressive_strength)

        if dimension == ComplianceDimension.ACOUSTIC:
            return (None, product.sound_reduction_rw)

        if dimension == ComplianceDimension.MOISTURE:
            return (None, product.moisture_absorption)

        return (None, None)

    def check_carbon(
        self,
        specified: Product,
        proposed: Product,
        br25_typology: Optional[str] = None,
    ) -> DimensionResult:
        spec_co2 = specified.epd_co2_per_m2
        prop_co2 = proposed.epd_co2_per_m2

        # Resolve BR25 context
        br25_limit = None
        br25_label = None
        if br25_typology:
            canonical = TYPOLOGY_ALIASES.get(br25_typology.lower(), br25_typology.lower())
            br25_limit = get_lifecycle_limit(canonical)
            if br25_limit:
                br25_label = get_typology_label(canonical)

        unit_label = f"kg CO₂e/{proposed.gwp_declared_unit or 'm²'}"
        spec_unit = f"kg CO₂e/{specified.gwp_declared_unit or 'm²'}"

        if spec_co2 is None or prop_co2 is None:
            br25_note = ""
            if br25_limit:
                br25_note = f" BR25 building limit: {br25_limit} kg CO₂e/m²/yr ({br25_label})."
            return DimensionResult(
                dimension="carbon",
                verdict=RiskVerdict.CONDITIONAL,
                requirement="EPD data (kg CO₂e per declared unit, A1–A3) required for embodied carbon assessment",
                specified_value=f"{spec_co2:.1f} {spec_unit}" if spec_co2 is not None else "no EPD data",
                proposed_value=f"{prop_co2:.1f} {unit_label}" if prop_co2 is not None else "no EPD data",
                delta=f"EPD data unavailable — carbon impact cannot be assessed.{br25_note}",
                code_reference="BR25 § 297 / EN 15978" if br25_limit else "EN 15978",
            )

        delta = prop_co2 - spec_co2
        pct = (delta / spec_co2 * 100) if spec_co2 > 0 else 0

        # Build BR25 context note
        br25_note = ""
        if br25_limit:
            br25_note = (
                f" BR25 whole-building limit for {br25_label}: "
                f"{br25_limit} kg CO₂e/m²/yr (A1–D, EN 15978, 50yr). "
                f"Construction process (A4–A5): max {CONSTRUCTION_PROCESS_LIMIT} kg CO₂e/m²/yr. "
                f"Source: bygningsreglementet.dk § 297."
            )

        if delta <= 0:
            verdict = RiskVerdict.PASS
            delta_str = (
                f"Carbon reduced by {abs(delta):.1f} {unit_label} "
                f"({abs(pct):.0f}% lower than specified, A1–A3).{br25_note}"
            )
        elif pct < 20:
            verdict = RiskVerdict.CONDITIONAL
            delta_str = (
                f"Carbon +{delta:.1f} {unit_label} (+{pct:.0f}%, A1–A3) — "
                f"marginal increase; review against project LCA budget.{br25_note}"
            )
        else:
            verdict = RiskVerdict.FAIL
            delta_str = (
                f"Carbon +{delta:.1f} {unit_label} (+{pct:.0f}%, A1–A3) — "
                f"significant increase; likely to affect project LCA budget.{br25_note}"
            )

        src_specified = f" (source: {specified.epd_source})" if specified.epd_source else ""
        src_proposed = f" (source: {proposed.epd_source})" if proposed.epd_source else ""

        return DimensionResult(
            dimension="carbon",
            verdict=verdict,
            requirement=(
                "Embodied carbon (A1–A3, per declared unit) — substitution should not "
                "significantly increase LCA impact"
                + (f". BR25 building limit: {br25_limit} kg CO₂e/m²/yr" if br25_limit else "")
            ),
            specified_value=f"{spec_co2:.1f} {spec_unit}{src_specified}",
            proposed_value=f"{prop_co2:.1f} {unit_label}{src_proposed}",
            delta=delta_str,
            code_reference="BR25 § 297 / EN 15978" if br25_limit else "NMD / EN 15978",
        )

    def check_climate_durability(
        self, specified: Product, proposed: Product, climate_zone: str
    ) -> Optional[DimensionResult]:
        base_life = proposed.service_life_years
        if base_life is None:
            return None  # no data, skip silently

        modifier_attr = {
            "coastal": "degradation_coastal",
            "urban": "degradation_urban",
            "continental": "degradation_continental",
        }.get(climate_zone.lower(), "degradation_urban")

        modifier = getattr(proposed, modifier_attr, None) or 1.0
        adjusted_life = int(base_life * modifier)

        spec_base = specified.service_life_years or 0
        spec_mod = getattr(specified, modifier_attr, None) or 1.0
        spec_adjusted = int(spec_base * spec_mod) if spec_base else None

        label = climate_zone.capitalize()
        MIN_LIFE = 30

        if adjusted_life >= MIN_LIFE:
            verdict = RiskVerdict.PASS
            if modifier >= 1.0:
                delta_str = f"Service life {adjusted_life} yr in {label} climate — no degradation penalty"
            else:
                reduction = int((1 - modifier) * base_life)
                delta_str = (
                    f"{label} climate reduces service life from {base_life} yr to {adjusted_life} yr "
                    f"(−{reduction} yr, ×{modifier:.2f}). Meets minimum — note B4 replacement cycle in LCA."
                )
        else:
            verdict = RiskVerdict.FAIL
            replacement_cycles = 50 / adjusted_life
            delta_str = (
                f"{label} climate reduces service life to {adjusted_life} yr "
                f"(base: {base_life} yr, ×{modifier:.2f}). "
                f"Below {MIN_LIFE} yr minimum — {replacement_cycles:.1f}× B4 replacements over 50yr building life."
            )

        return DimensionResult(
            dimension="durability",
            verdict=verdict,
            requirement=f"Service life ≥ {MIN_LIFE} yr in {label} climate exposure (NEN 2767 / ISO 15686)",
            specified_value=f"{spec_adjusted} yr (adjusted)" if spec_adjusted else f"{spec_base} yr (no climate modifier)",
            proposed_value=f"{adjusted_life} yr (adjusted from {base_life} yr base)",
            delta=delta_str,
            code_reference="NEN 2767 / ISO 15686-1",
        )

    def check_material_compatibility(
        self, proposed: Product, adjacent_material_classes: list[str]
    ) -> list[DimensionResult]:
        if not adjacent_material_classes or not proposed.material_class:
            return []

        prop_class = proposed.material_class.lower()
        results = []

        for adj in adjacent_material_classes:
            adj_lower = adj.lower()
            rows = (
                self.db.query(MaterialIncompatibility)
                .filter(
                    (
                        (MaterialIncompatibility.material_class_a == prop_class) &
                        (MaterialIncompatibility.material_class_b == adj_lower)
                    ) | (
                        (MaterialIncompatibility.material_class_a == adj_lower) &
                        (MaterialIncompatibility.material_class_b == prop_class)
                    )
                )
                .all()
            )
            for row in rows:
                verdict = RiskVerdict.FAIL if row.severity == "severe" else RiskVerdict.CONDITIONAL
                results.append(DimensionResult(
                    dimension="compatibility",
                    verdict=verdict,
                    requirement=f"No material incompatibility with adjacent {adj} in assembly",
                    specified_value="N/A",
                    proposed_value=f"{proposed.material_class} adjacent to {adj}",
                    delta=f"{row.risk_type}: {row.description}",
                    code_reference=row.code_reference or "BDA material compatibility guidance",
                ))

        return results

    def assess(
        self,
        building_function: str,
        building_class: str,
        element: str,
        specified_product: Product,
        proposed_product: Product,
        climate_zone: str = "urban",
        adjacent_materials: Optional[list[str]] = None,
        br25_typology: Optional[str] = None,
    ) -> list[DimensionResult]:
        """
        Run all applicable compliance checks for a substitution.

        Returns a list of DimensionResult — one per applicable requirement.
        """
        # Find all code requirements that apply to this context
        requirements = (
            self.db.query(CodeRequirement)
            .filter(
                CodeRequirement.building_function == building_function,
                CodeRequirement.building_class == building_class,
                CodeRequirement.element == element,
            )
            .all()
        )

        if not requirements:
            # Try without building class (some requirements are universal)
            requirements = (
                self.db.query(CodeRequirement)
                .filter(
                    CodeRequirement.building_function == building_function,
                    CodeRequirement.element == element,
                )
                .all()
            )

        results = []

        for req in requirements:
            spec_class, spec_numeric = self._get_product_value_for_dimension(
                specified_product, req.dimension, req.metric
            )
            prop_class, prop_numeric = self._get_product_value_for_dimension(
                proposed_product, req.dimension, req.metric
            )

            # Classification-based check (fire class)
            if req.required_class and req.dimension == ComplianceDimension.FIRE_REACTION:
                verdict, delta = self._compare_fire_class(
                    req.required_class, prop_class or "UNKNOWN"
                )
                results.append(DimensionResult(
                    dimension=req.dimension,
                    verdict=verdict,
                    requirement=f"Minimum {req.required_class} ({req.description or ''})",
                    specified_value=spec_class or "unknown",
                    proposed_value=prop_class or "unknown",
                    delta=delta,
                    code_reference=req.code_reference,
                ))

            # Numeric threshold check
            elif req.min_value is not None or req.max_value is not None:
                verdict, delta = self._compare_numeric(req, prop_numeric)

                # Also show what the specified product had
                spec_str = (
                    f"{spec_numeric} {req.unit}" if spec_numeric
                    else "unknown"
                )
                prop_str = (
                    f"{prop_numeric} {req.unit}" if prop_numeric
                    else "no data"
                )

                results.append(DimensionResult(
                    dimension=req.dimension,
                    verdict=verdict,
                    requirement=(
                        f"{req.metric} >= {req.min_value} {req.unit}"
                        if req.min_value
                        else f"{req.metric} <= {req.max_value} {req.unit}"
                    ),
                    specified_value=spec_str,
                    proposed_value=prop_str,
                    delta=delta,
                    code_reference=req.code_reference,
                ))

        # Layer 1: Carbon
        results.append(self.check_carbon(specified_product, proposed_product, br25_typology=br25_typology))

        # Layer 2: Climate durability (only if not already covered by a code requirement)
        if not any(r.dimension == ComplianceDimension.DURABILITY for r in results):
            dur = self.check_climate_durability(specified_product, proposed_product, climate_zone)
            if dur:
                results.append(dur)

        # Layer 3: Material compatibility
        if adjacent_materials:
            results.extend(self.check_material_compatibility(proposed_product, adjacent_materials))

        return results

    def suggest_alternatives(
        self,
        building_function: str,
        building_class: str,
        element: str,
        specified_product: Product,
        proposed_product: Product,
        climate_zone: str = "urban",
        adjacent_materials: Optional[list[str]] = None,
        max_results: int = 3,
    ) -> list[dict]:
        """
        Find products that would pass all compliance checks for this context.
        Returns up to max_results candidates, sorted by embodied carbon (ascending).
        """
        candidates = [
            p for p in self.db.query(Product).all()
            if p.applicable_elements
            and element in p.applicable_elements
            and p.id not in {specified_product.id, proposed_product.id}
        ]

        passing = []
        conditional = []
        for candidate in candidates:
            results = self.assess(
                building_function=building_function,
                building_class=building_class,
                element=element,
                specified_product=specified_product,
                proposed_product=candidate,
                climate_zone=climate_zone,
                adjacent_materials=adjacent_materials,
            )
            candidate_verdict = self.overall_verdict(results)
            if candidate_verdict in (RiskVerdict.PASS, RiskVerdict.CONDITIONAL):
                # Build a short reason string
                parts = []
                if candidate.fire_euroclass:
                    parts.append(f"fire class {candidate.fire_euroclass}")
                if candidate.epd_co2_per_m2 is not None:
                    spec_co2 = specified_product.epd_co2_per_m2
                    if spec_co2 and candidate.epd_co2_per_m2 <= spec_co2:
                        parts.append(f"{candidate.epd_co2_per_m2:.1f} kg CO₂e/m² (≤ specified)")
                    else:
                        parts.append(f"{candidate.epd_co2_per_m2:.1f} kg CO₂e/m²")
                modifier_attr = {
                    "coastal": "degradation_coastal",
                    "urban": "degradation_urban",
                    "continental": "degradation_continental",
                }.get(climate_zone.lower(), "degradation_urban")
                modifier = getattr(candidate, modifier_attr, None) or 1.0
                if candidate.service_life_years:
                    adj = int(candidate.service_life_years * modifier)
                    parts.append(f"{adj} yr service life in {climate_zone} climate")

                why = " · ".join(parts) if parts else "Meets all applicable requirements"
                entry = {
                    "product": candidate,
                    "verdict": candidate_verdict.value,
                    "why": why,
                    "co2": candidate.epd_co2_per_m2 if candidate.epd_co2_per_m2 is not None else 999.0,
                }
                if candidate_verdict == RiskVerdict.PASS:
                    passing.append(entry)
                else:
                    conditional.append(entry)

        passing.sort(key=lambda x: x["co2"])
        conditional.sort(key=lambda x: x["co2"])
        combined = passing + conditional
        return combined[:max_results]

    @staticmethod
    def overall_verdict(results: list[DimensionResult]) -> RiskVerdict:
        """Derive overall risk from individual dimension results."""
        if any(r.verdict == RiskVerdict.FAIL for r in results):
            return RiskVerdict.FAIL
        if any(r.verdict == RiskVerdict.CONDITIONAL for r in results):
            return RiskVerdict.CONDITIONAL
        return RiskVerdict.PASS
