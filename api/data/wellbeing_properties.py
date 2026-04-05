"""
Wellbeing Properties — evidence-based data for Phase 2 assessment.

Three dimensions:
  1. Biophilic quality (0–10 scale)
  2. Thermal effusivity (W·s^0.5/(m²·K)) — perceived warmth/coldness
  3. Acoustic absorption (αw, EN ISO 11654)

All values are keyed by material_class (the same field used in the Product model).

Sources:
  - Biophilic: Browning et al. 2014; Salingaros 2012; Taylor et al. 2011;
    Tsunetsugu et al. 2007; Ikei et al. 2017
  - Effusivity: EN ISO 10456:2007 (tabulated design values)
  - Acoustic: EN ISO 11654:1997; ISO 354:2003; manufacturer data

Note: Biophilic scores are a structured synthesis from the literature, not a
single measured value. Encode with source_type = "synthesised_from_literature".
Component evidence: fractal dimension D (Salingaros/Taylor), cortisol response
(Ikei/Tsunetsugu), natural material origin, and texture complexity.
"""

# ---------------------------------------------------------------------------
# Biophilic quality scores (0–10)
# Key factors: material naturalness, fractal complexity, texture variation,
# connection to natural patterns, aging/patina behaviour.
# ---------------------------------------------------------------------------
# Format: material_class → (score, notes, primary_citation)

BIOPHILIC = {
    # High biophilic quality — natural materials with organic variation
    "timber":           (8.5, "Natural material, warm grain pattern, high fractal complexity (D≈1.7), cortisol reduction documented", "Ikei et al. 2017; Tsunetsugu et al. 2007; Browning et al. 2014 Pattern 11"),
    "glulam":           (8.5, "Natural timber — same evidence as solid wood", "Ikei et al. 2017; Tsunetsugu et al. 2007"),
    "clt":              (8.5, "Exposed CLT: natural timber surface, high fractal complexity", "Ikei et al. 2017; Browning et al. 2014"),
    "wood_fibre":       (7.0, "Wood-derived, natural texture, lower fractal complexity than solid timber", "Browning et al. 2014 Pattern 11; Salingaros 2012"),
    "clay_brick":       (7.5, "Natural fired clay, texture complexity from mortar joints and colour variation, D≈1.6–1.7", "Salingaros 2012; Taylor et al. 2011"),
    "calcium_silicate": (5.5, "Mineral origin but highly processed, uniform surface, lower fractal dimension", "Salingaros 2012"),

    # Medium biophilic quality — natural-derived but processed
    "copper":           (6.5, "Natural metal with organic patina development over time (verdigris), D increases with age", "Salingaros 2012; Browning et al. 2014 Pattern 12"),
    "zinc":             (5.0, "Metal with natural weathering (blaugrau patina), D≈1.1–1.3 from seam pattern", "Salingaros 2012"),
    "stone_wool_panel": (5.5, "Stone-derived but highly processed, limited texture complexity", "Browning et al. 2014"),
    "concrete":         (3.5, "Board-marked variant: up to 5.0; plain concrete: 3.5. D≈1.2 plain", "Salingaros 2012"),
    "lightweight_concrete": (4.0, "Slightly higher than plain concrete due to aggregate texture", "Salingaros 2012"),
    "aac_block":        (4.0, "Porous texture adds complexity vs plain concrete", "Salingaros 2012"),
    "glass":            (2.5, "Transparency provides connection to outside (positive) but flat surface = D≈1.0", "Taylor et al. 2011; Browning et al. 2014 Pattern 4"),

    # Low biophilic quality — synthetic/industrial materials
    "fibre_cement":     (2.5, "Synthetic composite, smooth/uniform face, D≈1.0–1.2, no natural pattern", "Taylor et al. 2011; Salingaros 2012"),
    "gypsum_board":     (3.0, "Smooth, featureless surface, D≈1.0–1.1. Acceptable for ceilings, not ideal for walls", "Taylor et al. 2011"),
    "gypsum_fibre":     (3.0, "Similar to gypsum board", "Taylor et al. 2011"),
    "aluminium":        (1.5, "Industrial metal, uniform, D≈1.0–1.1, no natural reference", "Taylor et al. 2011"),
    "stainless_steel":  (1.5, "Industrial metal, highly uniform surface", "Taylor et al. 2011"),
    "hpl_panel":        (2.5, "Synthetic panel, may have printed wood/stone texture but lacks depth", "Salingaros 2012"),
    "aluminium_composite": (1.5, "Clearly synthetic, industrial aesthetic", "Taylor et al. 2011"),
    "wood_panel":       (6.0, "Natural wood veneer or solid, good biophilic quality", "Ikei et al. 2017"),
    "particle_board":   (3.5, "Wood-derived but highly processed, visible grain varies", "Browning et al. 2014"),
    "osb":              (5.0, "Visible strand pattern creates some fractal complexity", "Salingaros 2012"),
    "plywood":          (6.0, "Natural wood face veneer, visible grain", "Ikei et al. 2017"),

    # Concealed materials — biophilic score not applicable (hidden from occupants)
    "mineral_wool":     (None, "Concealed insulation — not in direct contact with occupants", "N/A"),
    "glass_wool":       (None, "Concealed insulation — not in direct contact with occupants", "N/A"),
    "pir_foam":         (None, "Concealed insulation — not in direct contact with occupants", "N/A"),
    "phenolic_foam":    (None, "Concealed insulation — not in direct contact with occupants", "N/A"),
    "eps_foam":         (None, "Concealed insulation — not in direct contact with occupants", "N/A"),
    "xps_foam":         (None, "Concealed insulation — not in direct contact with occupants", "N/A"),
    "cellulose":        (None, "Concealed insulation", "N/A"),
    "foam_concrete":    (None, "Concealed insulation", "N/A"),
    "bitumen":          (None, "Concealed waterproofing membrane", "N/A"),
    "mortar":           (None, "Substrate material, typically concealed", "N/A"),
    "render":           (5.0, "Exposed render — texture-dependent; smooth=3.0, rough/textured=6.0. Mid value used", "Salingaros 2012"),
}

# ---------------------------------------------------------------------------
# Thermal effusivity b = √(λ · ρ · cp)  [W·s^0.5/(m²·K)]
# Source: EN ISO 10456:2007 (Annex A, tabulated design values)
#
# Interpretation:
#   b < 300:   feels warm (timber, mineral wool)
#   300–600:   neutral (gypsum board)
#   600–1000:  cool (fibre cement, dense brick)
#   > 1000:    cold (concrete, stone, metal)
#
# Perceptually significant difference threshold: ~500 W·s^0.5/(m²·K)
# Source: Johansson et al. 2014, Journal of Wood Science 60(3)
# ---------------------------------------------------------------------------

THERMAL_EFFUSIVITY = {
    "timber":           322,     # EN ISO 10456:2007
    "glulam":           319,     # similar to solid timber
    "clt":              319,     # same
    "wood_fibre":       150,     # lower density than solid timber
    "particle_board":   350,
    "osb":              330,
    "plywood":          330,
    "wood_panel":       320,
    "gypsum_board":     474,     # EN ISO 10456:2007
    "gypsum_fibre":     510,
    "fibre_cement":     700,     # EN ISO 10456 / manufacturer data
    "concrete":         2145,    # EN ISO 10456:2007
    "lightweight_concrete": 800,
    "aac_block":        370,     # aerated = low density, lower effusivity
    "clay_brick":       1050,    # EN ISO 10456:2007 (solid clay brick)
    "calcium_silicate": 1300,    # dense calcium silicate block
    "glass":            1369,    # EN ISO 10456:2007
    "aluminium":        24000,   # EN ISO 10456:2007 (highly conductive)
    "stainless_steel":  12000,
    "copper":           36000,   # EN ISO 10456:2007
    "zinc":             15000,
    "steel":            44000,
    "stone_wool_panel": 200,     # surface panel, lower than solid stone
    "hpl_panel":        500,
    "aluminium_composite": 8000, # aluminium skin dominates
    "mineral_wool":     36,      # EN ISO 10456:2007 (λ≈0.035, ρ≈30, cp≈840)
    "glass_wool":       36,
    "pir_foam":         32,      # EN ISO 10456:2007 (λ≈0.022, ρ≈30, cp≈1400)
    "phenolic_foam":    30,
    "eps_foam":         32,
    "xps_foam":         35,
    "foam_concrete":    180,
    "render":           700,     # similar to fibre cement
    "mortar":           1500,
}

# Perception threshold — minimum effusivity difference that people notice
EFFUSIVITY_PERCEPTION_THRESHOLD = 500  # W·s^0.5/(m²·K), Johansson et al. 2014

# ---------------------------------------------------------------------------
# Acoustic absorption coefficient αw (weighted, EN ISO 11654:1997)
# Mid-point of range used for database value.
# Note: for concealed insulation products, value represents their absorption
# contribution to an assembly — most relevant when comparing mineral wool
# vs foam insulation in cavity/acoustic performance contexts.
# ---------------------------------------------------------------------------

ACOUSTIC_ABSORPTION = {
    # Natural/mineral insulation — excellent absorption
    "mineral_wool":     0.93,   # 50–100mm, Class A; EN ISO 11654 / ISO 354
    "glass_wool":       0.90,   # similar to stone wool
    "wood_fibre":       0.75,   # Class C; good for interior panels
    "cellulose":        0.70,   # Class C; blown cellulose in cavity

    # Foam insulation — essentially acoustically inert (closed-cell)
    "pir_foam":         0.07,   # Not rated; closed-cell, reflective
    "phenolic_foam":    0.07,
    "eps_foam":         0.07,
    "xps_foam":         0.05,
    "foam_concrete":    0.15,   # some porosity

    # Cladding / structural materials
    "timber":           0.12,   # solid wood, E border
    "glulam":           0.12,
    "clt":              0.12,   # exposed CLT; some absorption from joints
    "plywood":          0.10,
    "osb":              0.10,
    "particle_board":   0.10,
    "wood_panel":       0.12,
    "concrete":         0.04,   # hard, non-porous; fully reflective
    "lightweight_concrete": 0.10,
    "aac_block":        0.20,   # slightly porous
    "clay_brick":       0.05,
    "calcium_silicate": 0.05,
    "gypsum_board":     0.10,   # bare; panel resonance at low freq
    "gypsum_fibre":     0.10,
    "fibre_cement":     0.07,   # solid, non-porous
    "render":           0.04,
    "mortar":           0.04,
    "glass":            0.04,
    "aluminium":        0.04,
    "stainless_steel":  0.04,
    "copper":           0.04,
    "zinc":             0.04,
    "steel":            0.04,
    "hpl_panel":        0.05,
    "aluminium_composite": 0.04,
    "stone_wool_panel": 0.80,   # depends on facing; typical Class B
}

# EN ISO 11654 class boundaries
ABSORPTION_CLASS_BOUNDARIES = {
    "A": 0.90,
    "B": 0.80,
    "C": 0.60,
    "D": 0.30,
    "E": 0.15,
}


def get_absorption_class(aw: float) -> str:
    """Return EN ISO 11654 class label for an αw value."""
    if aw >= 0.90:
        return "A"
    if aw >= 0.80:
        return "B"
    if aw >= 0.60:
        return "C"
    if aw >= 0.30:
        return "D"
    if aw >= 0.15:
        return "E"
    return "not rated"
