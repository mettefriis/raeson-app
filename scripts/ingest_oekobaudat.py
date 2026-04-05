"""
ÖKOBAUDAT 2024 I Ingestion Script

Parses the ÖKOBAUDAT ILCD/EPD XML archive and populates the products table
with real embodied carbon (GWP A1-A3) data.

ÖKOBAUDAT is the German Federal Ministry generic LCA database, also used
by LCAbyg (the Danish BR25 calculation tool). It is freely available.

Source: https://www.oekobaudat.de/en/service/downloads.html
Format: ILCD+EPD XML (EN 15804+A2)

Run from project root:
    python scripts/ingest_oekobaudat.py [--zip path/to/OBD_2024_I.zip]
"""

import sys
import os
import zipfile
import xml.etree.ElementTree as ET
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.models.database import init_db, SessionLocal, Product

# ---------------------------------------------------------------------------
# XML namespaces
# ---------------------------------------------------------------------------
NS = {
    "p":    "http://lca.jrc.it/ILCD/Process",
    "c":    "http://lca.jrc.it/ILCD/Common",
    "epd":  "http://www.iai.kit.edu/EPD/2013",
    "epd2": "http://www.indata.network/EPD/2019",
    "xml":  "http://www.w3.org/XML/1998/namespace",
}

# UUID of the "Climate change" (GWP-total) LCIA indicator in ÖKOBAUDAT 2024
GWP_LCIA_UUID = "a7ea142a-9749-11ed-a8fc-0242ac120002"

# ---------------------------------------------------------------------------
# Category → product schema mapping
# Level-1 category from oekobau.dat classification
# ---------------------------------------------------------------------------
CATEGORY_MAP = {
    # Insulation — mineral
    "mineralwolle":              ("mineral wool insulation",    "mineral_wool",     "A1", ["facade_insulation", "roof_insulation", "floor_insulation", "internal_wall"]),
    "glaswolle":                 ("glass wool insulation",      "mineral_wool",     "A1", ["facade_insulation", "roof_insulation", "floor_insulation"]),
    "steinwolle":                ("stone wool insulation",      "mineral_wool",     "A1", ["facade_insulation", "roof_insulation", "floor_insulation"]),

    # Insulation — foam
    "polystyrol expandiert":     ("EPS insulation",             "eps_foam",         "E",  ["facade_insulation", "roof_insulation", "floor_insulation"]),
    "polystyrol extrudiert":     ("XPS insulation",             "xps_foam",         "E",  ["facade_insulation", "roof_insulation", "floor_insulation"]),
    "polyurethan":               ("PUR/PIR insulation",         "pir_foam",         "B-s2,d0", ["facade_insulation", "roof_insulation"]),
    "polyisocyanurat":           ("PIR insulation",             "pir_foam",         "B-s2,d0", ["facade_insulation", "roof_insulation"]),
    "phenolharz":                ("phenolic foam insulation",   "phenolic_foam",    "B-s1,d0", ["facade_insulation", "roof_insulation"]),

    # Insulation — bio/natural
    "holzwolle":                 ("wood wool insulation",       "wood_wool",        "D-s2,d0", ["internal_wall", "facade_insulation"]),
    "zellulose":                 ("cellulose insulation",       "cellulose",        "E",  ["roof_insulation", "internal_wall"]),
    "schaumbeton":               ("foam concrete insulation",   "foam_concrete",    "A1", ["facade_insulation", "floor_insulation"]),

    # Concrete
    "beton":                     ("concrete",                   "concrete",         "A1", ["structural_frame", "load_bearing_wall", "floor_insulation"]),
    "stahlbeton":                ("reinforced concrete",        "concrete",         "A1", ["structural_frame", "load_bearing_wall"]),
    "leichtbeton":               ("lightweight concrete",       "lightweight_concrete", "A1", ["external_wall", "load_bearing_wall"]),
    "porenbeton":                ("aerated concrete (AAC)",     "aac_block",        "A1", ["external_wall", "load_bearing_wall"]),

    # Masonry / clay
    "mauerziegel":               ("clay brick",                 "clay_brick",       "A1", ["external_wall", "load_bearing_wall"]),
    "kalksandstein":             ("calcium silicate block",     "calcium_silicate", "A1", ["external_wall", "load_bearing_wall", "internal_wall"]),

    # Steel / metals
    "stahl":                     ("steel",                      "steel",            "A1", ["structural_frame"]),
    "edelstahl":                 ("stainless steel",            "stainless_steel",  "A1", ["facade_cladding", "structural_frame"]),
    "aluminium":                 ("aluminium",                  "aluminium",        "A1", ["facade_cladding", "window_glazing"]),
    "kupfer":                    ("copper",                     "copper",           "A1", ["facade_cladding"]),
    "zink":                      ("zinc",                       "zinc",             "A1", ["facade_cladding"]),

    # Timber / wood
    "holz":                      ("timber",                     "timber",           "D-s2,d0", ["structural_frame", "facade_cladding", "internal_wall"]),
    "vollholz":                  ("solid timber",               "timber",           "D-s2,d0", ["structural_frame", "internal_wall"]),
    "brettschichtholz":          ("glulam",                     "glulam",           "D-s2,d0", ["structural_frame"]),
    "brettsperrholz":            ("cross-laminated timber (CLT)", "clt",            "D-s2,d0", ["structural_frame", "internal_wall"]),
    "holzfaserplatten":          ("wood fibre board",           "wood_fibre",       "D-s2,d0", ["facade_insulation", "internal_wall"]),
    "spanplatten":               ("particle board",             "particle_board",   "D-s2,d1", ["internal_wall"]),
    "osb":                       ("OSB",                        "osb",              "D-s2,d0", ["internal_wall", "structural_frame"]),
    "sperrholz":                 ("plywood",                    "plywood",          "D-s2,d0", ["internal_wall", "structural_frame"]),

    # Facade / cladding
    "faserzement":               ("fibre cement",               "fibre_cement",     "A1", ["facade_cladding"]),
    "gipskarton":                ("gypsum board",               "gypsum_board",     "A2-s1,d0", ["internal_wall"]),
    "gipsfaserplatten":          ("gypsum fibre board",         "gypsum_fibre",     "A2-s1,d0", ["internal_wall"]),

    # Mortar / render
    "putze":                     ("render / plaster",           "render",           "A1", ["external_wall", "internal_wall"]),
    "mörtel":                    ("mortar",                     "mortar",           "A1", ["external_wall", "load_bearing_wall"]),

    # Glass
    "glas":                      ("glass",                      "glass",            "A1", ["window_glazing"]),

    # Flooring / membranes
    "bitumen":                   ("bitumen membrane",           "bitumen",          "E",  ["roof_insulation"]),
    "kunststoffe":               ("plastic / synthetic",        "plastic",          "E",  ["facade_insulation"]),
}

# Default fire classes by material class (fallback if not in map)
FIRE_CLASS_DEFAULTS = {
    "mineral_wool":   "A1",
    "eps_foam":       "E",
    "xps_foam":       "E",
    "pir_foam":       "B-s2,d0",
    "phenolic_foam":  "B-s1,d0",
    "wood_wool":      "D-s2,d0",
    "cellulose":      "E",
    "foam_concrete":  "A1",
    "concrete":       "A1",
    "lightweight_concrete": "A1",
    "aac_block":      "A1",
    "clay_brick":     "A1",
    "calcium_silicate": "A1",
    "steel":          "A1",
    "stainless_steel": "A1",
    "aluminium":      "A1",
    "copper":         "A1",
    "zinc":           "A1",
    "timber":         "D-s2,d0",
    "glulam":         "D-s2,d0",
    "clt":            "D-s2,d0",
    "wood_fibre":     "D-s2,d0",
    "particle_board": "D-s2,d1",
    "osb":            "D-s2,d0",
    "plywood":        "D-s2,d0",
    "fibre_cement":   "A1",
    "gypsum_board":   "A2-s1,d0",
    "gypsum_fibre":   "A2-s1,d0",
    "render":         "A1",
    "mortar":         "A1",
    "glass":          "A1",
    "bitumen":        "E",
    "plastic":        "E",
}

# Typical service life and climate degradation by material class
SERVICE_LIFE = {
    "mineral_wool":      (50, 0.92, 0.97, 1.00),   # (years, coastal, urban, continental)
    "eps_foam":          (50, 0.85, 0.95, 1.00),
    "xps_foam":          (50, 0.90, 0.97, 1.00),
    "pir_foam":          (25, 0.80, 0.90, 1.00),   # PIR degrades faster, esp. coastal
    "phenolic_foam":     (25, 0.80, 0.90, 1.00),
    "wood_wool":         (50, 0.75, 0.90, 1.00),   # moisture-sensitive
    "cellulose":         (30, 0.75, 0.90, 1.00),
    "foam_concrete":     (50, 0.92, 0.97, 1.00),
    "concrete":          (80, 0.95, 0.98, 1.00),
    "lightweight_concrete": (60, 0.93, 0.97, 1.00),
    "aac_block":         (60, 0.90, 0.97, 1.00),
    "clay_brick":        (100, 1.00, 1.00, 1.00),
    "calcium_silicate":  (80, 0.97, 0.99, 1.00),
    "steel":             (80, 0.88, 0.96, 1.00),   # corrosion risk
    "stainless_steel":   (100, 0.99, 1.00, 1.00),
    "aluminium":         (80, 0.99, 1.00, 1.00),
    "copper":            (100, 1.00, 1.00, 1.00),
    "zinc":              (80, 0.85, 0.95, 1.00),
    "timber":            (30, 0.65, 0.85, 1.00),   # exposed timber degrades fast coastal
    "glulam":            (50, 0.80, 0.95, 1.00),
    "clt":               (50, 0.80, 0.95, 1.00),
    "wood_fibre":        (40, 0.78, 0.90, 1.00),
    "particle_board":    (25, 0.65, 0.85, 1.00),
    "osb":               (30, 0.72, 0.88, 1.00),
    "plywood":           (35, 0.78, 0.90, 1.00),
    "fibre_cement":      (50, 0.95, 0.98, 1.00),
    "gypsum_board":      (50, 0.80, 0.95, 1.00),   # moisture-sensitive
    "gypsum_fibre":      (50, 0.82, 0.95, 1.00),
    "render":            (30, 0.85, 0.95, 1.00),
    "mortar":            (50, 0.95, 0.98, 1.00),
    "glass":             (40, 0.99, 1.00, 1.00),
    "bitumen":           (20, 0.82, 0.90, 1.00),
    "plastic":           (25, 0.85, 0.92, 1.00),
}


def _text(elem, lang="en"):
    """Get text content, preferring English."""
    if elem is None:
        return None
    return (elem.text or "").strip() or None


def _find_text(root, xpath, lang="en"):
    """Find element by xpath and return text."""
    results = root.findall(xpath, NS)
    en_val = None
    de_val = None
    for r in results:
        r_lang = r.get("{http://www.w3.org/XML/1998/namespace}lang", "")
        val = (r.text or "").strip()
        if val:
            if r_lang == "en":
                en_val = val
            elif r_lang == "de":
                de_val = val
    return en_val or de_val


def parse_process(xml_bytes):
    """
    Parse one ÖKOBAUDAT process XML and return a dict of extracted fields,
    or None if the process should be skipped.
    """
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return None

    # UUID
    uuid_elem = root.find(".//c:UUID", NS)
    uuid = _text(uuid_elem) if uuid_elem is not None else None
    if not uuid:
        return None

    # Name
    name = _find_text(root, ".//p:processInformation/p:dataSetInformation/p:name/p:baseName")
    if not name:
        return None

    # Categories (oekobau.dat classification)
    cats = root.findall(".//c:classification[@name='oekobau.dat']/c:class", NS)
    cat_level = {c.get("level"): (c.text or "").strip() for c in cats}
    cat0 = cat_level.get("0", "")  # e.g. "Dämmstoffe"
    cat1 = cat_level.get("1", "")  # e.g. "Mineralwolle"
    cat2 = cat_level.get("2", "")  # e.g. "Mineralwolle Fassade"

    # Match category to our schema
    product_type = None
    material_class = None
    fire_class = None
    applicable_elements = []

    cat1_lower = cat1.lower()
    for key, (pt, mc, fc, elems) in CATEGORY_MAP.items():
        if key in cat1_lower or key in cat0.lower():
            product_type = pt
            material_class = mc
            fire_class = fc
            applicable_elements = elems
            break

    # Fall back to generic label if no match
    if not product_type:
        product_type = f"{cat1} ({cat0})" if cat1 else cat0
        material_class = None

    # GWP A1-A3 (Climate change indicator)
    gwp_a1a3 = None
    for result in root.findall(".//p:LCIAResult", NS):
        ref = result.find("p:referenceToLCIAMethodDataSet", NS)
        if ref is not None and ref.get("refObjectId") == GWP_LCIA_UUID:
            for elem in result.iter():
                module = elem.get(f"{{{NS['epd']}}}module")
                scenario = elem.get(f"{{{NS['epd']}}}scenario")
                if module == "A1-A3" and scenario is None:
                    try:
                        gwp_a1a3 = float(elem.text)
                    except (TypeError, ValueError):
                        pass
                    break
            break

    # Declared unit — look at the reference flow's unit group name
    declared_unit = "m³"  # default for most building materials
    # Try to find unit from flow property
    mean_elem = root.find(".//p:exchanges/p:exchange/p:meanAmount", NS)
    # The declared unit is usually implicit; for insulation it's typically m³
    # We'll use the category to infer unit
    cat0_lower = cat0.lower()
    if "dämm" in cat0_lower or "insulation" in cat0_lower:
        declared_unit = "m³"
    elif "stahl" in cat0_lower or "metall" in cat0_lower or "holz" in cat0_lower:
        declared_unit = "kg"
    elif "beton" in cat0_lower or "mauerwerk" in cat0_lower:
        declared_unit = "m³"
    elif "glas" in cat0_lower:
        declared_unit = "m²"
    else:
        declared_unit = "m³"

    # Service life from lookup table
    service_life_years = None
    deg_coastal = None
    deg_urban = None
    deg_continental = None
    if material_class and material_class in SERVICE_LIFE:
        sl, dc, du, dcon = SERVICE_LIFE[material_class]
        service_life_years = sl
        deg_coastal = dc
        deg_urban = du
        deg_continental = dcon

    # Fire class
    if not fire_class and material_class:
        fire_class = FIRE_CLASS_DEFAULTS.get(material_class)

    return {
        "uuid": uuid,
        "name": name,
        "product_type": product_type,
        "material_class": material_class,
        "gwp_a1a3": gwp_a1a3,
        "declared_unit": declared_unit,
        "fire_class": fire_class,
        "applicable_elements": ",".join(applicable_elements) if applicable_elements else None,
        "service_life_years": service_life_years,
        "deg_coastal": deg_coastal,
        "deg_urban": deg_urban,
        "deg_continental": deg_continental,
        "cat0": cat0,
        "cat1": cat1,
        "cat2": cat2,
    }


def ingest(zip_path, db, verbose=False, limit=None):
    """Parse ÖKOBAUDAT zip and insert products into the database."""

    inserted = 0
    skipped_no_gwp = 0
    skipped_duplicate = 0
    errors = 0

    with zipfile.ZipFile(zip_path, "r") as zf:
        process_files = [
            name for name in zf.namelist()
            if name.startswith("ILCD/processes/") and name.endswith(".xml")
            and "_" not in os.path.basename(name).split(".")[0]  # skip versioned duplicates
        ]

        if verbose:
            print(f"  Found {len(process_files)} process files")

        for i, fname in enumerate(process_files):
            if limit and inserted >= limit:
                break

            try:
                xml_bytes = zf.read(fname)
            except Exception:
                errors += 1
                continue

            data = parse_process(xml_bytes)
            if data is None:
                errors += 1
                continue

            # Skip if no GWP data
            if data["gwp_a1a3"] is None:
                skipped_no_gwp += 1
                continue

            # Skip duplicates (by ÖKOBAUDAT UUID)
            existing = db.query(Product).filter_by(oekobaudat_uuid=data["uuid"]).first()
            if existing:
                skipped_duplicate += 1
                continue

            product = Product(
                name=data["name"],
                manufacturer="ÖKOBAUDAT 2024 I (generic)",
                product_type=data["product_type"],
                material_class=data["material_class"],
                fire_euroclass=data["fire_class"],
                epd_co2_per_m2=data["gwp_a1a3"],
                gwp_declared_unit=data["declared_unit"],
                oekobaudat_uuid=data["uuid"],
                epd_source="oekobaudat",
                applicable_elements=data["applicable_elements"],
                service_life_years=data["service_life_years"],
                degradation_coastal=data["deg_coastal"],
                degradation_urban=data["deg_urban"],
                degradation_continental=data["deg_continental"],
                epd_available=True,
                ce_marking=True,
            )
            db.add(product)
            inserted += 1

            if verbose and inserted % 100 == 0:
                print(f"    {inserted} products inserted...")

        db.commit()

    return inserted, skipped_no_gwp, skipped_duplicate, errors


def main():
    parser = argparse.ArgumentParser(description="Ingest ÖKOBAUDAT into ræson database")
    parser.add_argument(
        "--zip",
        default=os.path.join(os.path.dirname(__file__), "..", "api", "data", "oekobaudat.zip"),
        help="Path to ÖKOBAUDAT zip file",
    )
    parser.add_argument("--verbose", action="store_true", default=True)
    parser.add_argument("--limit", type=int, default=None, help="Limit number of products (for testing)")
    args = parser.parse_args()

    if not os.path.exists(args.zip):
        print(f"ERROR: zip not found at {args.zip}")
        sys.exit(1)

    print(f"Ingesting ÖKOBAUDAT from {args.zip}")
    init_db()
    db = SessionLocal()

    try:
        inserted, no_gwp, dupes, errors = ingest(args.zip, db, verbose=args.verbose, limit=args.limit)
        print(f"\nDone.")
        print(f"  Inserted:          {inserted}")
        print(f"  Skipped (no GWP):  {no_gwp}")
        print(f"  Skipped (dupes):   {dupes}")
        print(f"  Errors:            {errors}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
