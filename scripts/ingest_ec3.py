"""
EC3 (Building Transparency) product ingestion.

Fetches real EPD data for named European construction products from the
EC3 API (buildingtransparency.org) and inserts them into the ræson database.

API docs: https://buildingtransparency.org/ec3/api/
Auth:     Bearer token (EC3_API_KEY in .env)
Format:   openEPD JSON

Fetches products in these categories most relevant to DK/NL construction:
  - Insulation (mineral wool, PIR, EPS, glass wool)
  - CLT / mass timber
  - Facade cladding (fibre cement, aluminium composite, zinc)
  - Gypsum board
  - Concrete / AAC
  - Window glazing

Run: python scripts/ingest_ec3.py  (from raeson/ root)
"""

import os
import sys
import json
import time
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from api.models.database import init_db, SessionLocal, Product


EC3_BASE = os.getenv("EC3_BASE_URL", "https://buildingtransparency.org/api")
EC3_API_KEY = os.getenv("EC3_API_KEY", "")

# EC3 changed auth scheme in 2024. Check your account at:
# https://buildingtransparency.org/ec3/manage-apps
# for the current base URL and auth header format.
# Set EC3_BASE_URL in .env if the base URL differs.


# Map EC3 category names → our material_class
# EC3 uses a hierarchical category system — we match on partial strings
CATEGORY_TO_MATERIAL_CLASS = {
    # Insulation
    "mineral wool":          "mineral_wool",
    "stone wool":            "mineral_wool",
    "rock wool":             "mineral_wool",
    "glass wool":            "glass_wool",
    "glass fiber":           "glass_wool",
    "polyisocyanurate":      "pir_foam",
    "pir":                   "pir_foam",
    "polyurethane":          "pir_foam",
    "eps":                   "eps_foam",
    "expanded polystyrene":  "eps_foam",
    "xps":                   "xps_foam",
    "extruded polystyrene":  "xps_foam",
    "phenolic":              "phenolic_foam",
    "cellulose":             "cellulose",
    "wood fiber":            "wood_fibre",
    "wood fibre":            "wood_fibre",

    # Timber
    "cross laminated":       "clt",
    "clt":                   "clt",
    "glulam":                "glulam",
    "glued laminated":       "glulam",
    "timber":                "timber",
    "lumber":                "timber",
    "plywood":               "plywood",
    "osb":                   "osb",

    # Concrete / masonry
    "concrete":              "concrete",
    "aac":                   "aac_block",
    "autoclaved aerated":    "aac_block",
    "clay brick":            "clay_brick",
    "brick":                 "clay_brick",
    "calcium silicate":      "calcium_silicate",

    # Cladding / facades
    "fibre cement":          "fibre_cement",
    "fiber cement":          "fibre_cement",
    "aluminium composite":   "aluminium_composite",
    "aluminum composite":    "aluminium_composite",
    "zinc":                  "zinc",
    "copper":                "copper",
    "aluminium":             "aluminium",
    "aluminum":              "aluminium",
    "hpl":                   "hpl_panel",
    "high pressure":         "hpl_panel",

    # Gypsum
    "gypsum board":          "gypsum_board",
    "plasterboard":          "gypsum_board",
    "gypsum fibre":          "gypsum_fibre",

    # Glazing
    "glazing":               "glass",
    "glass":                 "glass",
    "window":                "glass",
}


def _infer_material_class(category_name: str, product_name: str) -> str | None:
    """Match EC3 category + product name to a material_class."""
    text = (category_name + " " + product_name).lower()
    for keyword, mc in CATEGORY_TO_MATERIAL_CLASS.items():
        if keyword in text:
            return mc
    return None


def _infer_product_type(material_class: str, category_name: str) -> str:
    """Human-readable product type string."""
    TYPE_MAP = {
        "mineral_wool": "stone wool insulation",
        "glass_wool": "glass wool insulation",
        "pir_foam": "PIR foam insulation",
        "eps_foam": "EPS foam insulation",
        "xps_foam": "XPS foam insulation",
        "phenolic_foam": "phenolic foam insulation",
        "cellulose": "cellulose insulation",
        "wood_fibre": "wood fibre insulation",
        "clt": "cross-laminated timber",
        "glulam": "glued laminated timber",
        "timber": "structural timber",
        "plywood": "structural plywood",
        "osb": "oriented strand board",
        "concrete": "concrete",
        "aac_block": "autoclaved aerated concrete",
        "clay_brick": "clay brick masonry",
        "calcium_silicate": "calcium silicate masonry",
        "fibre_cement": "fibre cement cladding",
        "aluminium_composite": "aluminium composite panel",
        "zinc": "zinc cladding",
        "copper": "copper cladding",
        "aluminium": "aluminium cladding",
        "hpl_panel": "HPL facade panel",
        "gypsum_board": "gypsum board",
        "gypsum_fibre": "gypsum fibre board",
        "glass": "glazing",
    }
    return TYPE_MAP.get(material_class, category_name or "building product")


def _parse_gwp(epd: dict) -> tuple[float | None, str | None]:
    """
    Extract GWP A1-A3 value and declared unit from an EC3 EPD record.
    EC3 uses openEPD format — GWP is nested under 'gwp' or 'impacts'.
    Returns (gwp_value_per_declared_unit, declared_unit_string).
    """
    gwp = None
    declared_unit = None

    # Try openEPD format: impacts.gwp.a1a3
    impacts = epd.get("impacts") or {}
    if isinstance(impacts, dict):
        gwp_block = impacts.get("gwp") or impacts.get("GWP") or {}
        if isinstance(gwp_block, dict):
            # Modules A1-A3 combined, or sum of A1+A2+A3
            for key in ("a1a3", "A1A3", "a1-a3", "A1-A3"):
                if key in gwp_block:
                    gwp = gwp_block[key]
                    break
            if gwp is None:
                a1 = gwp_block.get("a1") or gwp_block.get("A1") or 0
                a2 = gwp_block.get("a2") or gwp_block.get("A2") or 0
                a3 = gwp_block.get("a3") or gwp_block.get("A3") or 0
                if a1 or a2 or a3:
                    gwp = (a1 or 0) + (a2 or 0) + (a3 or 0)

    # Try flat field: gwp_a1a3 (some EC3 versions)
    if gwp is None:
        for key in ("gwp_a1a3", "gwp", "GWP", "global_warming_potential"):
            if key in epd and epd[key] is not None:
                val = epd[key]
                if isinstance(val, dict):
                    for sub in ("a1a3", "A1A3", "value"):
                        if sub in val:
                            gwp = val[sub]
                            break
                elif isinstance(val, (int, float)):
                    gwp = val
                break

    # Declared unit
    du_raw = epd.get("declared_unit") or epd.get("declaredUnit") or ""
    if isinstance(du_raw, str):
        du = du_raw.lower().strip()
        if "m3" in du or "m³" in du or "cubic" in du:
            declared_unit = "m³"
        elif "m2" in du or "m²" in du or "square" in du:
            declared_unit = "m²"
        elif "kg" in du:
            declared_unit = "kg"
        elif "piece" in du or "pcs" in du or "unit" in du:
            declared_unit = "piece"
        else:
            declared_unit = du_raw[:20] if du_raw else None

    if gwp is not None:
        try:
            gwp = float(gwp)
        except (TypeError, ValueError):
            gwp = None

    return gwp, declared_unit


def fetch_epds(category_filter: str = "", page_size: int = 100, page: int = 1) -> dict:
    """Fetch a page of EPDs from EC3."""
    # EC3 accepts both Bearer (old) and Token (new) auth schemes
    # Try Bearer first; if 401/403, caller should surface a clear error
    headers = {
        "Authorization": f"Bearer {EC3_API_KEY}",
        "Accept": "application/json",
    }
    params = {
        "page_size": page_size,
        "page": page,
        "jurisdiction__in": "DK,NL,DE,SE,NO,FI,EU",  # relevant markets
    }
    if category_filter:
        params["category"] = category_filter

    url = f"{EC3_BASE}/epds"
    resp = httpx.get(url, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def ingest(db, verbose: bool = True) -> int:
    """
    Fetch EPDs from EC3 and upsert into the Product table.
    Returns number of products inserted/updated.
    """
    if not EC3_API_KEY:
        if verbose:
            print("  EC3_API_KEY not set — skipping EC3 ingestion.")
        return 0

    # Categories to query — EC3 category slugs or display names
    # We fetch broadly and filter by our material class mapping
    QUERY_TERMS = [
        "",  # all categories, filtered by jurisdiction
    ]

    inserted = 0
    skipped_no_gwp = 0
    skipped_no_class = 0

    for query_term in QUERY_TERMS:
        page = 1
        while True:
            try:
                response = fetch_epds(
                    category_filter=query_term,
                    page_size=100,
                    page=page,
                )
            except httpx.HTTPStatusError as e:
                if verbose:
                    print(f"  EC3 API error ({e.response.status_code}): {e}")
                break
            except Exception as e:
                if verbose:
                    print(f"  EC3 connection error: {e}")
                break

            # Handle both {"data": [...]} and direct list responses
            if isinstance(response, list):
                epds = response
                total = len(epds)
            elif isinstance(response, dict):
                epds = response.get("data") or response.get("results") or []
                meta = response.get("meta") or {}
                total = meta.get("total_count") or meta.get("count") or len(epds)
            else:
                break

            if verbose and page == 1:
                print(f"  EC3: fetching up to {total} products...")

            for epd in epds:
                name = (epd.get("name") or "").strip()
                if not name:
                    continue

                # Manufacturer
                mfr_obj = epd.get("manufacturer") or {}
                if isinstance(mfr_obj, dict):
                    manufacturer = mfr_obj.get("name") or mfr_obj.get("display_name") or "Unknown"
                else:
                    manufacturer = str(mfr_obj) or "Unknown"

                # Category
                cat_obj = epd.get("category") or {}
                if isinstance(cat_obj, dict):
                    category_name = (
                        cat_obj.get("display_name") or
                        cat_obj.get("name") or
                        cat_obj.get("id") or ""
                    )
                elif isinstance(cat_obj, str):
                    category_name = cat_obj
                else:
                    category_name = ""

                material_class = _infer_material_class(category_name, name)
                if not material_class:
                    skipped_no_class += 1
                    continue

                gwp, declared_unit = _parse_gwp(epd)
                if gwp is None:
                    skipped_no_gwp += 1
                    continue

                product_type = _infer_product_type(material_class, category_name)

                # Check if product already exists by name + manufacturer
                existing = (
                    db.query(Product)
                    .filter(Product.name == name, Product.manufacturer == manufacturer)
                    .first()
                )

                if existing:
                    # Update GWP data if we have better data
                    if existing.epd_co2_per_m2 is None:
                        existing.epd_co2_per_m2 = gwp
                        existing.gwp_declared_unit = declared_unit
                        existing.epd_source = "ec3"
                        existing.oekobaudat_uuid = epd.get("open_xpd_uuid") or epd.get("id")
                        inserted += 1
                else:
                    product = Product(
                        name=name,
                        manufacturer=manufacturer,
                        product_type=product_type,
                        material_class=material_class,
                        epd_co2_per_m2=gwp,
                        gwp_declared_unit=declared_unit,
                        epd_source="ec3",
                        oekobaudat_uuid=epd.get("open_xpd_uuid") or epd.get("id"),
                        ce_marking=True,  # EC3 requires CE marking
                        epd_available=True,
                    )
                    db.add(product)
                    inserted += 1

            db.commit()

            # Pagination
            if not epds or (isinstance(response, dict) and page * 100 >= total):
                break
            page += 1
            time.sleep(0.3)  # be polite to the API

    if verbose:
        print(f"  EC3: {inserted} products inserted/updated "
              f"({skipped_no_gwp} skipped no GWP, {skipped_no_class} skipped unknown class)")

    return inserted


if __name__ == "__main__":
    print("Connecting to EC3 API...")
    db = SessionLocal()
    try:
        # Quick connectivity test first
        try:
            resp = httpx.get(
                f"{EC3_BASE}/epds",
                headers={"Authorization": f"Bearer {EC3_API_KEY}"},
                params={"page_size": 1},
                timeout=10,
            )
            print(f"EC3 API status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print(f"Sample response keys: {list(data.keys()) if isinstance(data, dict) else 'list'}")
        except Exception as e:
            print(f"Cannot reach EC3 API: {e}")
            sys.exit(1)

        n = ingest(db, verbose=True)
        print(f"Done: {n} products from EC3.")
    finally:
        db.close()
