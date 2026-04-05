# ræson — Known Limitations

This document records what ræson currently does not do, does incorrectly, or does with caveats. It is written for the development team and for potential users who need to understand the tool's boundaries before relying on it.

---

## 1. Jurisdictional scope

**What works:** Danish (BR18/BR25) and Dutch (Bbl) building code requirements.

**What is missing:**
- Sweden, Norway, Finland, Germany, France — no code requirements seeded. The engine will still run checks using fire euroclass hierarchy (which is harmonised across EU), but thermal, carbon, and daylight thresholds will not fire for non-DK/NL projects.
- Sub-national variation is not captured. Dutch municipalities can impose stricter local requirements beyond Bbl. Danish municipalities can impose local plans (lokalplan) with additional constraints. ræson does not know about these.
- BR25 implementation date: the carbon requirements (§ 297) formally apply to building permits submitted from 2023. Earlier permits use BR18 without carbon limits. ræson always applies the BR25 carbon thresholds regardless of permit date.

---

## 2. Product database

**Current state:** 638 products total — 35 manual (NL/generic), 11 manual Danish named products, 594 from ÖKOBAUDAT 2024 I.

**Key limitations:**

- **Named product matching is shallow.** If an architect writes "Rockwool Frontrock MAX E 80mm" the engine finds it. If they write "Frontrock" or a typo, it may fall back to a generic mineral wool product from ÖKOBAUDAT. The LLM parser helps but is not perfect.
- **ÖKOBAUDAT products are German-market generic materials**, not named commercial products. They give real GWP data (A1–A3) but have no manufacturer name, fire euroclass, or service life. Many compliance checks return CONDITIONAL rather than PASS/FAIL for these products because key fields are missing.
- **EC3 (Building Transparency) integration is blocked** on a business account requirement. EC3 would add named European products (Rockwool, Knauf, Saint-Gobain, Kingspan, etc.) with full EPD data. Until this is resolved, named-product coverage is limited to the ~46 manually seeded products.
- **No Dutch manufacturer products are manually seeded** beyond the generic Bbl scenarios. Companies like Isover, Fermacell, Weber, Knauf NL are not in the database as named products.
- **No product version history.** Products are seeded once. When a manufacturer updates an EPD (typically every 5 years), the database does not update automatically.
- **Declared units are inconsistent.** ÖKOBAUDAT products declare GWP per m³, per kg, or per piece. The carbon engine normalises to kg CO₂e/m² using density and thickness assumptions where possible, but some conversions are approximate.

---

## 3. Compliance engine

**Fire reaction:**
- The engine checks euroclass against BR18/Bbl thresholds for the stated building element and class. It does NOT check whether a specific test system (e.g. SP FIRE 105 for ventilated facades) has been conducted — only the rated euroclass is compared.
- For some BR18 contexts (e.g. etageboliger klasse 2 facade cladding), D-s2,d2 in a compliant system with SP FIRE 105 test is also acceptable. The engine only flags the A2-s1,d0 path and marks D-s2,d2 as FAIL, which is overly conservative.

**Thermal:**
- U-value / Rc checks compare product lambda to BR18 Annex 2 / Bbl minimum values. The engine does not model the full building assembly — it checks one product in isolation. A product with a lower lambda value may still achieve the required Rc at a different thickness.
- No condensation or vapour permeability checks are implemented despite these being relevant for facade assemblies (EN ISO 13788).

**Carbon:**
- BR25 § 297 sets a whole-building lifecycle carbon limit (e.g. 7.5 kg CO₂e/m²/yr for etageboliger). ræson cannot check a single material substitution against this limit directly — it shows the product-level GWP delta and flags the building-level context as information only.
- GWP values cover modules A1–A3 only (product stage). Modules A4 (transport), A5 (installation), B (use), and C (end-of-life) are not included.
- No biogenic carbon accounting. For CLT and timber products, biogenic carbon sequestration (negative CO₂ during growth) is not captured. ÖKOBAUDAT includes it in some datasets but the engine does not distinguish.

**Durability:**
- Service life values are seeded from manufacturer datasheets and ÖKOBAUDAT reference service lives (ISO 15686-1). They are indicative, not certified.
- Climate zone degradation multipliers (coastal, urban, continental) are estimated from corrosion exposure categories (ISO 9223) and BRE guidance. They have not been validated against Danish or Dutch failure data.

**Structural:**
- No structural checks are implemented. The engine does not assess load-bearing capacity, compressive strength, or Eurocode compliance for structural substitutions.

---

## 4. Wellbeing engine

**Biophilic quality:**
- Scores (0–10) are a synthesis from Browning et al. 2014, Salingaros fractal complexity research, and Ikei/Tsunetsugu cortisol studies. They are not a standardised metric — no ISO or EN standard exists for biophilic quality.
- The scoring weights (naturalness 40%, fractal complexity 40%, cortisol evidence 20%) are the authors' synthesis, not independently validated.
- Scores are assigned per material class, not per product. All products of material class "timber" get score 8.5 regardless of finish, treatment, or visible grain.

**Acoustic absorption:**
- αw values are typical mid-range values from EN ISO 11654 / ISO 354 test reports. They do not account for mounting condition (Type A, B, C, D per ISO 354), which significantly affects measured absorption — especially for porous materials.
- The engine flags changes in αw but does not model reverberation time (T60) or speech intelligibility (STI), which are the metrics architects and acousticians actually specify.

**Thermal comfort (effusivity):**
- Effusivity values are calculated from EN ISO 10456 tabulated λ, ρ, cp values. The perception threshold (500 W·s⁰·⁵/m²K, Johansson et al. 2014) is from a single study on wood vs. concrete in Scandinavian residential context. Generalisation to other material pairs or climates is uncertain.

**Daylight:**
- The BRE split-flux simplified daylight factor formula (Littlefair 1996, BRE BR305) is a 30-year-old first-order approximation. It does not account for: obstructions, neighbouring buildings, sky luminance distribution, room shape complexity, or light well geometries.
- Room geometry is extracted from images by Claude Vision. Extraction accuracy depends heavily on image quality, scale bar presence, and drawing clarity. Confidence levels (high/medium/low) are self-reported by the model.
- VLT values for glazing are inferred from product names where product-specific data is absent. Name-pattern inference (e.g. "suncool" → 0.38) is approximate.
- The BR18 2% DF threshold applies to habitable rooms in boliger and institutioner. The engine applies it universally regardless of room type or building use.

---

## 5. LLM parsing

- The query parser (Claude) makes reasonable inferences about building function, class, and element from free-text. It can be wrong, especially for ambiguous queries. The parsed fields are echoed in the result — architects should verify them.
- The parser is calibrated for Danish (BR25) and Dutch (Bbl) projects. Other jurisdictions default to Dutch building functions and classes, which may be incorrect.
- The narrative generator (Claude) may hallucinate specific clause numbers, threshold values, or product properties that differ from the structured assessment data. The structured dimension cards are authoritative; the narrative is illustrative.

---

## 6. What is explicitly out of scope

| Topic | Reason |
|---|---|
| Structural engineering checks | Requires Eurocode modelling, not data lookup |
| HVAC / MEP substitutions | Material substitution framing does not apply |
| Cost impact | No pricing data; market prices change too fast for a static DB |
| Acoustic transmission (Rw) | Whole-assembly calculation, not per-product |
| Moisture / hygrothermal | Requires assembly modelling (WUFI or equivalent) |
| Schedule impact | Outside scope |
| Local planning requirements | Highly variable, no data source |
| Building control submission | ræson is advisory, not a formal submission tool |

---

## 7. What this tool is and is not

ræson is a **decision-support tool** for architects. It flags risk dimensions, surfaces code references, and provides evidence-grounded context for a substitution decision.

It is **not**:
- A building control authority decision
- A structural or fire engineering calculation
- A certified EPD database
- A legal compliance certificate

Every assessment should be reviewed by a qualified architect or engineer before being used to approve or reject a substitution.

---

*Last updated: 2026-04-03*
