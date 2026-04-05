"""
BR25 — Danish Building Regulations 2025 Carbon Thresholds

Implemented by Bekendtgørelse nr. 285 af 18/03/2025 (Social- og Boligministeriet).
In force from 1 July 2025.

Source: bygningsreglementet.dk/tekniske-bestemmelser/11/brv/bygningers-klimapaavirkning-1-juli-2025/
Methodology: EN 15978:2012, lifecycle modules A1–A5, B4, B6, C3–C4, D
Reference period: 50 years
Unit: kg CO₂e / m² floor area / year (heated gross floor area, BGF)

The thresholds apply to new buildings > 50 m² BGF.
Two separate limits:
  1. Full lifecycle limit (A1–D): applies to the whole building LCA
  2. Construction process limit (A4–A5): applies to construction phase only

Building typologies use Danish Bygningsreglementet kategorier.
"""

# ---------------------------------------------------------------------------
# Full lifecycle limits (modules A1–D) — kg CO₂e/m²/year
# ---------------------------------------------------------------------------
LIFECYCLE_LIMITS = {
    # Typology                   2025   2027*  2029*
    "etageboliger":             (7.5,   None,  None),   # multi-storey residential
    "enfamiliehuse":            (6.7,   None,  None),   # single-family houses
    "rækkehuse":                (6.7,   None,  None),   # terraced houses
    "sommerhuse_under_150":     (4.0,   None,  None),   # holiday homes < 150 m²
    "sommerhuse_150_plus":      (6.7,   None,  None),   # holiday homes ≥ 150 m²
    "erhverv":                  (7.5,   None,  None),   # commercial / industrial
    "institutioner":            (8.0,   None,  None),   # educational, healthcare, etc.
}

# Optional voluntary "Lavenergiklasse" (low-emission class)
LOW_EMISSION_CLASS = {
    "etageboliger":             5.4,
    "enfamiliehuse":            5.4,
    "rækkehuse":                5.4,
}

# Construction process limit (modules A4–A5) — kg CO₂e/m²/year
# Applies to ALL building typologies above
CONSTRUCTION_PROCESS_LIMIT = 1.5   # kg CO₂e/m²/year

# Reference period for all calculations
REFERENCE_PERIOD_YEARS = 50


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_lifecycle_limit(typology: str, year: int = 2025) -> float | None:
    """
    Return the BR25 lifecycle carbon limit for a building typology and year.
    Returns None if no limit applies.
    """
    entry = LIFECYCLE_LIMITS.get(typology)
    if entry is None:
        return None
    limit_2025, limit_2027, limit_2029 = entry
    if year >= 2029 and limit_2029 is not None:
        return limit_2029
    if year >= 2027 and limit_2027 is not None:
        return limit_2027
    return limit_2025


def get_typology_label(typology: str) -> str:
    """Human-readable Danish typology label."""
    labels = {
        "etageboliger":           "Etageboliger (multi-storey residential)",
        "enfamiliehuse":          "Enfamiliehuse (single-family houses)",
        "rækkehuse":              "Rækkehuse (terraced houses)",
        "sommerhuse_under_150":   "Sommerhuse < 150 m²",
        "sommerhuse_150_plus":    "Sommerhuse ≥ 150 m²",
        "erhverv":                "Erhverv (commercial/industrial)",
        "institutioner":          "Institutioner (schools, hospitals)",
    }
    return labels.get(typology, typology)


# Map from natural language building type descriptions to typology keys
TYPOLOGY_ALIASES = {
    "apartment": "etageboliger",
    "apartments": "etageboliger",
    "residential": "etageboliger",
    "multi-storey": "etageboliger",
    "etageboliger": "etageboliger",
    "house": "enfamiliehuse",
    "single family": "enfamiliehuse",
    "villa": "enfamiliehuse",
    "terraced": "rækkehuse",
    "townhouse": "rækkehuse",
    "rækkehus": "rækkehuse",
    "school": "institutioner",
    "hospital": "institutioner",
    "office": "erhverv",
    "commercial": "erhverv",
    "industrial": "erhverv",
    "holiday": "sommerhuse_under_150",
    "cottage": "sommerhuse_under_150",
}
