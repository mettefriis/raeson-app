"""
Safe production seed script — inserts missing data, never drops tables.

Usage:
  DATABASE_URL=postgresql://... python scripts/seed_production.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.models.database import Base, engine, SessionLocal, FireClassRank, CodeRequirement, Product, MaterialIncompatibility


def upsert_fire_class_ranks(db):
    ranks = [
        ("A1", 1, "Non-combustible, no contribution to fire"),
        ("A2-s1,d0", 2, "Very limited combustibility, low smoke, no droplets"),
        ("A2-s1,d1", 3, "Very limited combustibility, low smoke, limited droplets"),
        ("A2-s2,d0", 4, "Very limited combustibility, medium smoke, no droplets"),
        ("A2-s2,d1", 5, "Very limited combustibility, medium smoke, limited droplets"),
        ("A2-s3,d0", 6, "Very limited combustibility, high smoke, no droplets"),
        ("B-s1,d0", 7, "Limited combustibility, low smoke, no droplets"),
        ("B-s1,d1", 8, "Limited combustibility, low smoke, limited droplets"),
        ("B-s2,d0", 9, "Limited combustibility, medium smoke, no droplets"),
        ("B-s2,d1", 10, "Limited combustibility, medium smoke, limited droplets"),
        ("B-s3,d0", 11, "Limited combustibility, high smoke, no droplets"),
        ("C-s1,d0", 12, "Combustible, limited contribution, low smoke"),
        ("C-s2,d0", 13, "Combustible, limited contribution, medium smoke"),
        ("C-s3,d0", 14, "Combustible, limited contribution, high smoke"),
        ("D-s1,d0", 15, "Combustible, medium contribution, low smoke"),
        ("D-s2,d0", 16, "Combustible, medium contribution, medium smoke"),
        ("D-s2,d2", 17, "Combustible, medium contribution, heavy droplets"),
        ("E", 18, "Combustible, high contribution"),
        ("E-d2", 19, "Combustible, high contribution, heavy droplets"),
        ("F", 20, "No performance determined"),
    ]
    added = 0
    for euroclass, rank, desc in ranks:
        if not db.query(FireClassRank).filter_by(euroclass=euroclass).first():
            db.add(FireClassRank(euroclass=euroclass, rank=rank, description=desc))
            added += 1
    db.commit()
    print(f"  Fire class ranks: {added} added")


def upsert_code_requirements(db):
    requirements = [
        # FACADE CLADDING — Fire
        {"building_function": "woonfunctie", "building_class": "klasse_1", "element": "facade_cladding", "dimension": "fire_reaction", "required_class": "D-s2,d2", "code_reference": "Bbl art. 3.72 lid 1", "code_document": "Bbl", "description": "Buitenzijde gevel, woongebouw klasse 1"},
        {"building_function": "woonfunctie", "building_class": "klasse_2", "element": "facade_cladding", "dimension": "fire_reaction", "required_class": "B-s2,d0", "code_reference": "Bbl art. 3.72 lid 2", "code_document": "Bbl", "description": "Buitenzijde gevel, woongebouw klasse 2"},
        # FACADE INSULATION — Fire
        {"building_function": "woonfunctie", "building_class": "klasse_1", "element": "facade_insulation", "dimension": "fire_reaction", "required_class": "D-s2,d2", "code_reference": "Bbl art. 3.72 lid 1", "code_document": "Bbl", "description": "Gevelisolatie, woongebouw klasse 1"},
        {"building_function": "woonfunctie", "building_class": "klasse_2", "element": "facade_insulation", "dimension": "fire_reaction", "required_class": "A2-s1,d0", "code_reference": "Bbl art. 3.72 lid 2", "code_document": "Bbl", "description": "Gevelisolatie, woongebouw klasse 2"},
        # FACADE INSULATION — Thermal
        {"building_function": "woonfunctie", "building_class": "klasse_1", "element": "facade_insulation", "dimension": "thermal", "metric": "Rc", "min_value": 4.7, "unit": "m²K/W", "code_reference": "Bbl art. 3.41, tabel 3.20", "code_document": "Bbl", "description": "Minimum Rc waarde buitengevel nieuwbouw"},
        {"building_function": "woonfunctie", "building_class": "klasse_2", "element": "facade_insulation", "dimension": "thermal", "metric": "Rc", "min_value": 4.7, "unit": "m²K/W", "code_reference": "Bbl art. 3.41, tabel 3.20", "code_document": "Bbl", "description": "Minimum Rc waarde buitengevel nieuwbouw"},
        # ROOF INSULATION — Thermal
        {"building_function": "woonfunctie", "building_class": "klasse_1", "element": "roof_insulation", "dimension": "thermal", "metric": "Rc", "min_value": 6.3, "unit": "m²K/W", "code_reference": "Bbl art. 3.41, tabel 3.20", "code_document": "Bbl", "description": "Minimum Rc waarde dak nieuwbouw"},
        {"building_function": "woonfunctie", "building_class": "klasse_2", "element": "roof_insulation", "dimension": "thermal", "metric": "Rc", "min_value": 6.3, "unit": "m²K/W", "code_reference": "Bbl art. 3.41, tabel 3.20", "code_document": "Bbl", "description": "Minimum Rc waarde dak nieuwbouw"},
        # FLOOR INSULATION — Thermal
        {"building_function": "woonfunctie", "building_class": "klasse_1", "element": "floor_insulation", "dimension": "thermal", "metric": "Rc", "min_value": 3.7, "unit": "m²K/W", "code_reference": "Bbl art. 3.41, tabel 3.20", "code_document": "Bbl", "description": "Minimum Rc waarde vloer nieuwbouw"},
        # FIRE DOOR
        {"building_function": "woonfunctie", "building_class": "klasse_2", "element": "fire_door", "dimension": "fire_resistance", "metric": "fire_resistance_minutes", "min_value": 30, "unit": "min", "code_reference": "Bbl art. 3.58 lid 1", "code_document": "Bbl", "description": "Minimale brandwerendheid binnendeuren (EI30)"},
        # WINDOW GLAZING — Thermal
        {"building_function": "woonfunctie", "building_class": "klasse_2", "element": "window_glazing", "dimension": "thermal", "metric": "lambda", "max_value": 1.65, "unit": "W/(m²K)", "code_reference": "Bbl art. 3.41", "code_document": "Bbl", "description": "Maximum U-waarde glas nieuwbouw (Uw)"},
        # INTERNAL WALL — Fire
        {"building_function": "woonfunctie", "building_class": "klasse_2", "element": "internal_wall", "dimension": "fire_reaction", "required_class": "B-s1,d0", "code_reference": "Bbl art. 3.72 lid 3", "code_document": "Bbl", "description": "Wanden in besloten gangen/trappen"},
        # Danish BR25 requirements
        {"jurisdiction": "DK", "building_function": "beboelsesbygning", "building_class": "bygningsklasse_2", "element": "facade_insulation", "dimension": "fire_reaction", "required_class": "A2-s1,d0", "code_reference": "BR25 § 295", "code_document": "BR25", "description": "Facade isolering, beboelsesbygning over 2 etager"},
        {"jurisdiction": "DK", "building_function": "beboelsesbygning", "building_class": "bygningsklasse_1", "element": "facade_insulation", "dimension": "fire_reaction", "required_class": "D-s2,d2", "code_reference": "BR25 § 294", "code_document": "BR25", "description": "Facade isolering, lav beboelsesbygning"},
        {"jurisdiction": "DK", "building_function": "beboelsesbygning", "building_class": "bygningsklasse_2", "element": "facade_cladding", "dimension": "fire_reaction", "required_class": "B-s2,d0", "code_reference": "BR25 § 297", "code_document": "BR25", "description": "Facadebeklædning, beboelsesbygning over 2 etager"},
        {"jurisdiction": "DK", "building_function": "beboelsesbygning", "building_class": "bygningsklasse_2", "element": "facade_insulation", "dimension": "thermal", "metric": "U-value", "max_value": 0.18, "unit": "W/(m²K)", "code_reference": "BR25 § 258, tabel 2", "code_document": "BR25", "description": "Maksimal U-værdi ydervæg nybyggeri"},
        {"jurisdiction": "DK", "building_function": "beboelsesbygning", "building_class": "bygningsklasse_2", "element": "roof_insulation", "dimension": "thermal", "metric": "U-value", "max_value": 0.10, "unit": "W/(m²K)", "code_reference": "BR25 § 258, tabel 2", "code_document": "BR25", "description": "Maksimal U-værdi tag nybyggeri"},
        {"jurisdiction": "DK", "building_function": "beboelsesbygning", "building_class": "bygningsklasse_2", "element": "window_glazing", "dimension": "thermal", "metric": "U-value", "max_value": 0.80, "unit": "W/(m²K)", "code_reference": "BR25 § 258, tabel 2", "code_document": "BR25", "description": "Maksimal U-værdi vinduer nybyggeri"},
    ]
    added = 0
    for r in requirements:
        exists = db.query(CodeRequirement).filter_by(
            element=r["element"],
            dimension=r["dimension"],
            building_function=r["building_function"],
            building_class=r["building_class"],
            code_reference=r["code_reference"],
        ).first()
        if not exists:
            row = CodeRequirement(**r)
            db.add(row)
            added += 1
    db.commit()
    print(f"  Code requirements: {added} added")


def upsert_products(db):
    products = [
        # Rockwool
        {"name": "Rockwool Duorock 040", "manufacturer": "Rockwool", "product_type": "facade_insulation", "fire_euroclass": "A1", "lambda_value": 0.040, "ce_marking": True, "epd_co2_per_m2": 3.2, "service_life_years": 50},
        {"name": "Rockwool Frontrock MAX E", "manufacturer": "Rockwool", "product_type": "facade_insulation", "fire_euroclass": "A1", "lambda_value": 0.036, "ce_marking": True, "epd_co2_per_m2": 3.8, "service_life_years": 50},
        {"name": "Rockwool Conlit 150 U", "manufacturer": "Rockwool", "product_type": "fire_protection", "fire_euroclass": "A1", "ce_marking": True, "service_life_years": 50},
        {"name": "Rockwool Cavity Slab 50", "manufacturer": "Rockwool", "product_type": "cavity_insulation", "fire_euroclass": "A1", "lambda_value": 0.036, "ce_marking": True, "epd_co2_per_m2": 2.9, "service_life_years": 50},
        # Kingspan
        {"name": "Kingspan Kooltherm K15", "manufacturer": "Kingspan", "product_type": "facade_insulation", "fire_euroclass": "B-s1,d0", "lambda_value": 0.020, "ce_marking": True, "epd_co2_per_m2": 22.5, "service_life_years": 50},
        {"name": "Kingspan Kooltherm K5", "manufacturer": "Kingspan", "product_type": "roof_insulation", "fire_euroclass": "C-s1,d0", "lambda_value": 0.018, "ce_marking": True, "epd_co2_per_m2": 24.0, "service_life_years": 50},
        {"name": "Kingspan Thermawall TW55", "manufacturer": "Kingspan", "product_type": "facade_insulation", "fire_euroclass": "B-s2,d0", "lambda_value": 0.023, "ce_marking": True, "epd_co2_per_m2": 18.0, "service_life_years": 50},
        # Isover
        {"name": "Isover Facade 32", "manufacturer": "Saint-Gobain Isover", "product_type": "facade_insulation", "fire_euroclass": "A1", "lambda_value": 0.032, "ce_marking": True, "epd_co2_per_m2": 2.5, "service_life_years": 50},
        {"name": "Isover Topdec Roof", "manufacturer": "Saint-Gobain Isover", "product_type": "roof_insulation", "fire_euroclass": "A1", "lambda_value": 0.033, "ce_marking": True, "epd_co2_per_m2": 2.7, "service_life_years": 50},
        # Knauf
        {"name": "Knauf Insulation Framewool", "manufacturer": "Knauf Insulation", "product_type": "facade_insulation", "fire_euroclass": "A1", "lambda_value": 0.035, "ce_marking": True, "epd_co2_per_m2": 2.2, "service_life_years": 50},
        {"name": "Knauf Insulation OmniFit Slab 35", "manufacturer": "Knauf Insulation", "product_type": "facade_insulation", "fire_euroclass": "A1", "lambda_value": 0.035, "ce_marking": True, "epd_co2_per_m2": 2.4, "service_life_years": 50},
        # Paroc (Danish/Nordic)
        {"name": "Paroc FAS 4", "manufacturer": "Owens Corning / Paroc", "product_type": "facade_insulation", "fire_euroclass": "A1", "lambda_value": 0.033, "ce_marking": True, "epd_co2_per_m2": 2.8, "service_life_years": 50},
        {"name": "Paroc eXtra", "manufacturer": "Owens Corning / Paroc", "product_type": "facade_insulation", "fire_euroclass": "A1", "lambda_value": 0.036, "ce_marking": True, "epd_co2_per_m2": 2.6, "service_life_years": 50},
        # Glazing
        {"name": "AGC Stopray Ultra-50", "manufacturer": "AGC Glass Europe", "product_type": "window_glazing", "fire_euroclass": "A1", "ce_marking": True, "service_life_years": 30},
        {"name": "Pilkington Optitherm S3", "manufacturer": "NSG Group / Pilkington", "product_type": "window_glazing", "fire_euroclass": "A1", "ce_marking": True, "service_life_years": 30},
        # Danish products
        {"name": "Rockwool Flexi A-batts", "manufacturer": "Rockwool DK", "product_type": "facade_insulation", "fire_euroclass": "A1", "lambda_value": 0.037, "ce_marking": True, "epd_co2_per_m2": 2.9, "service_life_years": 50},
        {"name": "Rockwool Fabrock A", "manufacturer": "Rockwool DK", "product_type": "facade_insulation", "fire_euroclass": "A1", "lambda_value": 0.034, "ce_marking": True, "epd_co2_per_m2": 3.1, "service_life_years": 50},
        {"name": "Kingspan Kooltherm K12 Framing Board", "manufacturer": "Kingspan DK", "product_type": "facade_insulation", "fire_euroclass": "B-s1,d0", "lambda_value": 0.021, "ce_marking": True, "epd_co2_per_m2": 21.0, "service_life_years": 50},
        {"name": "Sundolitt S80", "manufacturer": "Sundolitt", "product_type": "facade_insulation", "fire_euroclass": "E", "lambda_value": 0.036, "ce_marking": True, "epd_co2_per_m2": 5.2, "service_life_years": 50},
        {"name": "Jackon Jackodur KF 300", "manufacturer": "Jackon", "product_type": "foundation_insulation", "fire_euroclass": "E", "lambda_value": 0.033, "ce_marking": True, "epd_co2_per_m2": 6.1, "service_life_years": 50},
    ]
    added = 0
    for p in products:
        if not db.query(Product).filter_by(name=p["name"], manufacturer=p["manufacturer"]).first():
            db.add(Product(**p))
            added += 1
    db.commit()
    print(f"  Products: {added} added")


def main():
    print("Connecting to database...")
    # Create any missing tables (safe — won't drop existing)
    Base.metadata.create_all(engine)

    db = SessionLocal()
    try:
        print("Seeding fire class hierarchy...")
        upsert_fire_class_ranks(db)

        print("Seeding building code requirements (Bbl + BR25)...")
        upsert_code_requirements(db)

        print("Seeding products...")
        upsert_products(db)

        print("\nDone.")
        print(f"  Products total:        {db.query(Product).count()}")
        print(f"  Code requirements:     {db.query(CodeRequirement).count()}")
        print(f"  Fire class ranks:      {db.query(FireClassRank).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
