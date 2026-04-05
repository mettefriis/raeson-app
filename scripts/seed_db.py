"""
Seed the database with:
1. Fire class hierarchy (Euroclass system per NEN-EN 13501-1)
2. Dutch building code requirements (Bbl) for residential buildings
3. Real construction products with properties from datasheets
4. Material incompatibility pairs

This is demo data — enough to run 5-10 convincing substitution scenarios.
In production, this becomes a continuously updated data pipeline.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.models.database import (
    Base, engine, init_db, SessionLocal,
    FireClassRank, CodeRequirement, Product, MaterialIncompatibility
)
from ingest_oekobaudat import ingest as ingest_oekobaudat


def seed_fire_class_ranks(db):
    """
    Euroclass fire classification hierarchy per NEN-EN 13501-1.
    Rank 1 = best performance (A1, non-combustible).
    Includes smoke (s) and droplet (d) sub-classifications.
    """
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
    for euroclass, rank, desc in ranks:
        db.add(FireClassRank(euroclass=euroclass, rank=rank, description=desc))
    db.commit()
    print(f"  Seeded {len(ranks)} fire class ranks")


def seed_code_requirements(db):
    """
    Dutch building code requirements from the Bbl
    (Besluit bouwwerken leefomgeving).

    Focused on residential (woonfunctie), klasse 1 and 2.
    These are simplified but representative of real requirements.
    """
    requirements = [
        # ---------------------------------------------------------------
        # FACADE CLADDING — Fire (Bbl art. 3.72)
        # ---------------------------------------------------------------
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_1",
            "element": "facade_cladding",
            "dimension": "fire_reaction",
            "required_class": "D-s2,d2",
            "code_reference": "Bbl art. 3.72 lid 1",
            "code_document": "Bbl",
            "description": "Buitenzijde gevel, woongebouw klasse 1 (laagbouw)",
        },
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_2",
            "element": "facade_cladding",
            "dimension": "fire_reaction",
            "required_class": "B-s2,d0",
            "code_reference": "Bbl art. 3.72 lid 2",
            "code_document": "Bbl",
            "description": "Buitenzijde gevel, woongebouw klasse 2 (meerdere woonlagen)",
        },

        # ---------------------------------------------------------------
        # FACADE INSULATION — Fire
        # ---------------------------------------------------------------
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_1",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "D-s2,d2",
            "code_reference": "Bbl art. 3.72 lid 1",
            "code_document": "Bbl",
            "description": "Gevelisolatie, woongebouw klasse 1",
        },
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_2",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "A2-s1,d0",
            "code_reference": "Bbl art. 3.72 lid 2",
            "code_document": "Bbl",
            "description": (
                "Gevelisolatie, woongebouw klasse 2. Stricter requirement "
                "for insulation within facade construction."
            ),
        },

        # ---------------------------------------------------------------
        # FACADE INSULATION — Thermal (Bbl afd. 3.5 / NEN 1068)
        # ---------------------------------------------------------------
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_1",
            "element": "facade_insulation",
            "dimension": "thermal",
            "metric": "Rc",
            "min_value": 4.7,
            "unit": "m²K/W",
            "code_reference": "Bbl art. 3.41, tabel 3.20",
            "code_document": "Bbl",
            "description": "Minimum Rc waarde buitengevel nieuwbouw",
        },
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_2",
            "element": "facade_insulation",
            "dimension": "thermal",
            "metric": "Rc",
            "min_value": 4.7,
            "unit": "m²K/W",
            "code_reference": "Bbl art. 3.41, tabel 3.20",
            "code_document": "Bbl",
            "description": "Minimum Rc waarde buitengevel nieuwbouw",
        },
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_2",
            "element": "facade_insulation",
            "dimension": "thermal",
            "metric": "lambda",
            "max_value": 0.045,
            "unit": "W/(m·K)",
            "code_reference": "NEN 1068, bijlage A",
            "code_document": "NEN 1068",
            "description": (
                "Maximum thermal conductivity for declared lambda. "
                "Lower is better."
            ),
        },

        # ---------------------------------------------------------------
        # ROOF INSULATION — Thermal
        # ---------------------------------------------------------------
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_1",
            "element": "roof_insulation",
            "dimension": "thermal",
            "metric": "Rc",
            "min_value": 6.3,
            "unit": "m²K/W",
            "code_reference": "Bbl art. 3.41, tabel 3.20",
            "code_document": "Bbl",
            "description": "Minimum Rc waarde dak nieuwbouw",
        },
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_2",
            "element": "roof_insulation",
            "dimension": "thermal",
            "metric": "Rc",
            "min_value": 6.3,
            "unit": "m²K/W",
            "code_reference": "Bbl art. 3.41, tabel 3.20",
            "code_document": "Bbl",
            "description": "Minimum Rc waarde dak nieuwbouw",
        },

        # ---------------------------------------------------------------
        # FLOOR INSULATION — Thermal
        # ---------------------------------------------------------------
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_1",
            "element": "floor_insulation",
            "dimension": "thermal",
            "metric": "Rc",
            "min_value": 3.7,
            "unit": "m²K/W",
            "code_reference": "Bbl art. 3.41, tabel 3.20",
            "code_document": "Bbl",
            "description": "Minimum Rc waarde vloer nieuwbouw",
        },

        # ---------------------------------------------------------------
        # FIRE DOOR — Fire resistance
        # ---------------------------------------------------------------
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_2",
            "element": "fire_door",
            "dimension": "fire_resistance",
            "metric": "fire_resistance_minutes",
            "min_value": 30,
            "unit": "min",
            "code_reference": "Bbl art. 3.58 lid 1",
            "code_document": "Bbl",
            "description": "Minimale brandwerendheid binnendeuren (EI30)",
        },

        # ---------------------------------------------------------------
        # WINDOW GLAZING — Thermal
        # ---------------------------------------------------------------
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_2",
            "element": "window_glazing",
            "dimension": "thermal",
            "metric": "lambda",
            "max_value": 1.65,
            "unit": "W/(m²K)",
            "code_reference": "Bbl art. 3.41",
            "code_document": "Bbl",
            "description": "Maximum U-waarde glas nieuwbouw (Uw)",
        },

        # ---------------------------------------------------------------
        # INTERNAL WALL — Fire (common corridor walls)
        # ---------------------------------------------------------------
        {
            "building_function": "woonfunctie",
            "building_class": "klasse_2",
            "element": "internal_wall",
            "dimension": "fire_reaction",
            "required_class": "B-s1,d0",
            "code_reference": "Bbl art. 3.72 lid 3",
            "code_document": "Bbl",
            "description": (
                "Wanden in besloten gangen/trappen, "
                "extra beschermde vluchtroute"
            ),
        },

        # NOTE: Thermal Rc for facade_cladding is a wall assembly requirement,
        # not a property of the cladding product itself — omitted here.
    ]

    for req in requirements:
        db.add(CodeRequirement(**req))
    db.commit()
    print(f"  Seeded {len(requirements)} code requirements")


def seed_products(db):
    """
    Real construction products with properties sourced from
    manufacturer technical datasheets and DoPs.
    """
    products = [
        # ---------------------------------------------------------------
        # MINERAL WOOL INSULATION
        # ---------------------------------------------------------------
        {
            "name": "Rockwool Duorock 040",
            "manufacturer": "Rockwool",
            "product_type": "mineral wool insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.040,
            "r_value_per_unit": 5.00,  # Rc at 200mm — standard facade/roof install
            "compressive_strength": 50.0,
            "density": 100.0,
            "service_life_years": 50,
            "ce_marking": True,
            "komo_certified": True,
            "applicable_elements": "facade_insulation,roof_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 7.5,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Rockwool Rocksono Base",
            "manufacturer": "Rockwool",
            "product_type": "mineral wool insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.036,
            "r_value_per_unit": 5.00,  # Rc at 180mm
            "compressive_strength": 15.0,
            "density": 45.0,
            "sound_reduction_rw": 52.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "internal_wall,facade_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 6.8,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Knauf Insulation DPF 4.0",
            "manufacturer": "Knauf Insulation",
            "product_type": "mineral wool insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.034,
            "r_value_per_unit": 5.29,  # Rc at 180mm
            "compressive_strength": 40.0,
            "density": 90.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,roof_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 7.2,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Isover Multimax 30",
            "manufacturer": "Saint-Gobain Isover",
            "product_type": "glass wool insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.030,
            "r_value_per_unit": 5.00,  # Rc at 150mm
            "compressive_strength": 20.0,
            "density": 30.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,internal_wall",
            "material_class": "glass_wool",
            "epd_co2_per_m2": 5.9,
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Paroc eXtra Plus",
            "manufacturer": "Paroc",
            "product_type": "mineral wool insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.033,
            "r_value_per_unit": 5.45,  # Rc at 180mm
            "compressive_strength": 45.0,
            "density": 80.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,roof_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 6.9,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },

        # ---------------------------------------------------------------
        # PIR/PUR INSULATION (phenolic / polyurethane)
        # ---------------------------------------------------------------
        {
            "name": "Kingspan Kooltherm K15",
            "manufacturer": "Kingspan",
            "product_type": "phenolic foam insulation",
            "fire_euroclass": "C-s2,d0",
            "lambda_value": 0.020,
            "r_value_per_unit": 5.0,
            "compressive_strength": 150.0,
            "density": 50.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,roof_insulation",
            "material_class": "phenolic_foam",
            "epd_co2_per_m2": 21.0,
            "degradation_coastal": 0.90, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        {
            "name": "Kingspan Therma TW55",
            "manufacturer": "Kingspan",
            "product_type": "PIR insulation",
            "fire_euroclass": "B-s1,d0",
            "lambda_value": 0.022,
            "r_value_per_unit": 5.00,  # Rc at 110mm
            "compressive_strength": 140.0,
            "density": 32.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "external_wall,internal_wall",
            "material_class": "pir_foam",
            "epd_co2_per_m2": 18.5,
            "degradation_coastal": 0.90, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        {
            "name": "IKO Enertherm ALU 50",
            "manufacturer": "IKO",
            "product_type": "PIR insulation",
            "fire_euroclass": "B-s2,d0",
            "lambda_value": 0.023,
            "r_value_per_unit": 5.22,  # Rc at 120mm
            "compressive_strength": 120.0,
            "density": 33.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,roof_insulation",
            "material_class": "pir_foam",
            "epd_co2_per_m2": 19.2,
            "degradation_coastal": 0.92, "degradation_urban": 0.98, "degradation_continental": 1.0,
        },
        {
            "name": "Recticel Eurowall",
            "manufacturer": "Recticel",
            "product_type": "PUR insulation",
            "fire_euroclass": "B-s2,d0",
            "lambda_value": 0.022,
            "r_value_per_unit": 5.45,  # Rc at 120mm
            "compressive_strength": 130.0,
            "density": 33.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,external_wall",
            "material_class": "pir_foam",
            "epd_co2_per_m2": 17.8,
            "degradation_coastal": 0.90, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },

        # ---------------------------------------------------------------
        # CELLULAR GLASS
        # ---------------------------------------------------------------
        {
            "name": "Foamglas T4+",
            "manufacturer": "Owens Corning",
            "product_type": "cellular glass insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.036,
            "r_value_per_unit": 6.39,  # Rc at 230mm — roof application
            "compressive_strength": 700.0,
            "density": 130.0,
            "service_life_years": 60,
            "ce_marking": True,
            "applicable_elements": "roof_insulation,floor_insulation",
            "material_class": "cellular_glass",
            "epd_co2_per_m2": 18.5,
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },

        # ---------------------------------------------------------------
        # EPS / XPS INSULATION
        # ---------------------------------------------------------------
        {
            "name": "Neopor BMB EPS",
            "manufacturer": "BASF",
            "product_type": "EPS insulation",
            "fire_euroclass": "E",
            "lambda_value": 0.031,
            "r_value_per_unit": 6.45,  # Rc at 200mm — roof/floor application
            "compressive_strength": 100.0,
            "density": 25.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "floor_insulation,roof_insulation",
            "material_class": "eps_insulation",
            "epd_co2_per_m2": 4.2,
            "degradation_coastal": 0.95, "degradation_urban": 0.99, "degradation_continental": 1.0,
        },
        {
            "name": "Knauf Therm TR 032",
            "manufacturer": "Knauf",
            "product_type": "EPS floor insulation",
            "fire_euroclass": "E",
            "lambda_value": 0.032,
            "r_value_per_unit": 6.25,  # Rc at 200mm — roof/floor application
            "compressive_strength": 150.0,
            "density": 30.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "floor_insulation,roof_insulation",
            "material_class": "eps_insulation",
            "epd_co2_per_m2": 3.9,
            "degradation_coastal": 0.95, "degradation_urban": 0.99, "degradation_continental": 1.0,
        },

        # ---------------------------------------------------------------
        # FACADE CLADDING
        # ---------------------------------------------------------------
        {
            "name": "Trespa Meteon",
            "manufacturer": "Trespa",
            "product_type": "HPL facade panel",
            "fire_euroclass": "B-s2,d0",
            "density": 1400.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "hpl_panel",
            "epd_co2_per_m2": 14.5,
            "degradation_coastal": 0.95, "degradation_urban": 0.99, "degradation_continental": 1.0,
        },
        {
            "name": "Eternit Equitone [tectiva]",
            "manufacturer": "Eternit",
            "product_type": "fiber cement facade panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 1750.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "fibre_cement",
            "epd_co2_per_m2": 9.8,
            "degradation_coastal": 0.85, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        {
            "name": "Alucobond Plus",
            "manufacturer": "3A Composites",
            "product_type": "aluminium composite panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 5.6,
            "service_life_years": 35,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "aluminium_composite",
            "epd_co2_per_m2": 24.0,
            "degradation_coastal": 0.92, "degradation_urban": 0.98, "degradation_continental": 1.0,
        },
        {
            "name": "Rockpanel Woods",
            "manufacturer": "Rockpanel",
            "product_type": "stone wool facade panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 1050.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "stone_wool_panel",
            "epd_co2_per_m2": 8.2,
            "degradation_coastal": 0.97, "degradation_urban": 0.99, "degradation_continental": 1.0,
        },
        {
            "name": "Prodema ProdEX",
            "manufacturer": "Prodema",
            "product_type": "natural wood facade panel",
            "fire_euroclass": "D-s2,d0",
            "density": 1400.0,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "wood_panel",
            "epd_co2_per_m2": 5.5,
            "degradation_coastal": 0.70, "degradation_urban": 0.85, "degradation_continental": 1.0,
        },
        {
            "name": "Swisspearl Carat",
            "manufacturer": "Swisspearl",
            "product_type": "fibre cement facade panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 1750.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "fibre_cement",
            "epd_co2_per_m2": 10.2,
            "degradation_coastal": 0.85, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        {
            "name": "Cembrit Solid",
            "manufacturer": "Cembrit",
            "product_type": "fibre cement facade panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 1600.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "fibre_cement",
            "epd_co2_per_m2": 9.4,
            "degradation_coastal": 0.85, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        {
            "name": "Hunter Douglas Luxalon 300C",
            "manufacturer": "Hunter Douglas",
            "product_type": "aluminium facade panel",
            "fire_euroclass": "A1",
            "density": 2700.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "aluminium",
            "epd_co2_per_m2": 22.0,
            "degradation_coastal": 0.95, "degradation_urban": 0.99, "degradation_continental": 1.0,
        },
        {
            "name": "VMZINC Anthra-Zinc Standing Seam",
            "manufacturer": "VMZINC",
            "product_type": "zinc facade cladding",
            "fire_euroclass": "A1",
            "density": 7133.0,
            "service_life_years": 80,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "zinc",
            "epd_co2_per_m2": 16.5,
            "degradation_coastal": 0.88, "degradation_urban": 0.95, "degradation_continental": 1.0,
        },
        {
            "name": "KME Tecu Classic Copper",
            "manufacturer": "KME",
            "product_type": "copper facade cladding",
            "fire_euroclass": "A1",
            "density": 8960.0,
            "service_life_years": 100,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "copper",
            "epd_co2_per_m2": 28.0,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },

        # ---------------------------------------------------------------
        # FIRE DOORS
        # ---------------------------------------------------------------
        {
            "name": "Schuco ADS 80 FR 30",
            "manufacturer": "Schuco",
            "product_type": "aluminium fire door",
            "fire_euroclass": "A1",
            "fire_resistance_minutes": 30,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "fire_door",
            "material_class": "aluminium",
            "epd_co2_per_m2": 32.0,
            "degradation_coastal": 0.95, "degradation_urban": 0.99, "degradation_continental": 1.0,
        },
        {
            "name": "Hormann T30-1 FSA",
            "manufacturer": "Hormann",
            "product_type": "steel fire door",
            "fire_euroclass": "A1",
            "fire_resistance_minutes": 30,
            "service_life_years": 30,
            "ce_marking": True,
            "applicable_elements": "fire_door",
            "material_class": "carbon_steel",
            "epd_co2_per_m2": 28.0,
            "degradation_coastal": 0.80, "degradation_urban": 0.92, "degradation_continental": 1.0,
        },
        {
            "name": "Swedoor JW Fire EI30",
            "manufacturer": "Swedoor/JELD-WEN",
            "product_type": "timber fire door",
            "fire_euroclass": "D-s2,d0",
            "fire_resistance_minutes": 30,
            "service_life_years": 30,
            "ce_marking": True,
            "applicable_elements": "fire_door",
            "material_class": "wood_panel",
            "epd_co2_per_m2": 12.0,
            "degradation_coastal": 0.82, "degradation_urban": 0.90, "degradation_continental": 1.0,
        },
        {
            "name": "Swedoor JW Fire EI60",
            "manufacturer": "Swedoor/JELD-WEN",
            "product_type": "timber fire door",
            "fire_euroclass": "D-s2,d0",
            "fire_resistance_minutes": 60,
            "service_life_years": 30,
            "ce_marking": True,
            "applicable_elements": "fire_door",
            "material_class": "wood_panel",
            "epd_co2_per_m2": 14.0,
            "degradation_coastal": 0.82, "degradation_urban": 0.90, "degradation_continental": 1.0,
        },
        {
            "name": "Hormann H3 EI30",
            "manufacturer": "Hormann",
            "product_type": "steel fire door",
            "fire_euroclass": "A1",
            "fire_resistance_minutes": 30,
            "service_life_years": 35,
            "ce_marking": True,
            "applicable_elements": "fire_door",
            "material_class": "carbon_steel",
            "epd_co2_per_m2": 26.0,
            "degradation_coastal": 0.80, "degradation_urban": 0.92, "degradation_continental": 1.0,
        },
        {
            "name": "Roto Frank EI90 Steel",
            "manufacturer": "Roto Frank",
            "product_type": "steel fire door",
            "fire_euroclass": "A1",
            "fire_resistance_minutes": 90,
            "service_life_years": 35,
            "ce_marking": True,
            "applicable_elements": "fire_door",
            "material_class": "carbon_steel",
            "epd_co2_per_m2": 30.0,
            "degradation_coastal": 0.80, "degradation_urban": 0.92, "degradation_continental": 1.0,
        },

        # ---------------------------------------------------------------
        # WINDOW GLAZING
        # ---------------------------------------------------------------
        {
            "name": "AGC Planibel Clearvision HR++",
            "manufacturer": "AGC Glass Europe",
            "product_type": "double glazing unit",
            "fire_euroclass": "A1",
            "lambda_value": 1.1,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "window_glazing",
            "material_class": "glass",
            "epd_co2_per_m2": 19.0,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "AGC iplus Top 1.1 Triple",
            "manufacturer": "AGC Glass Europe",
            "product_type": "triple glazing unit",
            "fire_euroclass": "A1",
            "lambda_value": 0.7,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "window_glazing",
            "material_class": "glass",
            "epd_co2_per_m2": 24.5,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Pilkington Suncool 66/33 HR++",
            "manufacturer": "Pilkington",
            "product_type": "double glazing unit",
            "fire_euroclass": "A1",
            "lambda_value": 1.3,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "window_glazing",
            "material_class": "glass",
            "epd_co2_per_m2": 21.0,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Pilkington Optitherm S3",
            "manufacturer": "Pilkington",
            "product_type": "triple glazing unit",
            "fire_euroclass": "A1",
            "lambda_value": 0.6,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "window_glazing",
            "material_class": "glass",
            "epd_co2_per_m2": 23.0,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Saint-Gobain SGG Climalit Plus",
            "manufacturer": "Saint-Gobain",
            "product_type": "double glazing unit",
            "fire_euroclass": "A1",
            "lambda_value": 1.1,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "window_glazing",
            "material_class": "glass",
            "epd_co2_per_m2": 20.0,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },

        # ---------------------------------------------------------------
        # GYPSUM BOARDS
        # ---------------------------------------------------------------
        {
            "name": "Fermacell Gypsum Fibreboard",
            "manufacturer": "Fermacell",
            "product_type": "gypsum fibre board",
            "fire_euroclass": "A2-s1,d0",
            "density": 1150.0,
            "service_life_years": 40,
            "sound_reduction_rw": 48.0,
            "ce_marking": True,
            "applicable_elements": "internal_wall",
            "material_class": "gypsum_board",
            "epd_co2_per_m2": 7.8,
            "degradation_coastal": 0.95, "degradation_urban": 0.99, "degradation_continental": 1.0,
        },
        {
            "name": "Knauf Diamant GF",
            "manufacturer": "Knauf",
            "product_type": "fire-resistant gypsum board",
            "fire_euroclass": "A2-s1,d0",
            "density": 1100.0,
            "service_life_years": 40,
            "sound_reduction_rw": 45.0,
            "ce_marking": True,
            "applicable_elements": "internal_wall",
            "material_class": "gypsum_board",
            "epd_co2_per_m2": 7.2,
            "degradation_coastal": 0.95, "degradation_urban": 0.99, "degradation_continental": 1.0,
        },
    ]

    for p in products:
        db.add(Product(**p))
    db.commit()
    print(f"  Seeded {len(products)} products")


def seed_wellbeing_data(db):
    """
    Populate wellbeing properties on all products with a known material_class.
    Updates biophilic_score, thermal_effusivity, and acoustic_absorption_aw
    from the evidence-based lookup tables in wellbeing_properties.py.
    """
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from api.data.wellbeing_properties import BIOPHILIC, THERMAL_EFFUSIVITY, ACOUSTIC_ABSORPTION

    products = db.query(Product).filter(Product.material_class != None).all()
    updated = 0

    for p in products:
        mc = p.material_class
        changed = False

        # Biophilic score
        if mc in BIOPHILIC:
            score, notes, citation = BIOPHILIC[mc]
            p.biophilic_score = score
            p.biophilic_notes = notes
            changed = True

        # Thermal effusivity
        if mc in THERMAL_EFFUSIVITY:
            p.thermal_effusivity = THERMAL_EFFUSIVITY[mc]
            changed = True

        # Acoustic absorption
        if mc in ACOUSTIC_ABSORPTION:
            p.acoustic_absorption_aw = ACOUSTIC_ABSORPTION[mc]
            changed = True

        if changed:
            updated += 1

    db.commit()
    print(f"  Updated {updated} products with wellbeing data")


def seed_br25_requirements(db):
    """
    Danish building code requirements from BR25 (Bygningsreglementet 2025).

    Fire reaction requirements are from the pre-accepted solutions in the
    guidance documents (vejledninger), which are the authoritative practical
    reference for compliance:
      - Kapitel 4 vejledning (facade fire spread)
      - Bilag 2 (etageboligbyggeri)
      - Bilag 3 (erhvervsbyggeri)

    Thermal requirements from BR25 § 258, Bilag 2 Tabel 1.
    U-values are encoded as lambda max values (practical proxy —
    lambda ≤ 0.040 approximates U ≤ 0.15 W/(m²K) at standard thickness).

    Height classes:
      klasse_1: ≤ 2 storeys / ≤ ~8m (enfamiliehuse, low-rise)
      klasse_2: 3+ storeys / ≤ 22m (most etageboliger)
      klasse_3: > 22m high-rise (stricter facade requirements)
    """
    requirements = [

        # ---------------------------------------------------------------
        # FACADE INSULATION — Fire reaction
        # ---------------------------------------------------------------

        # Enfamiliehuse / rækkehuse (low-rise, klasse_1)
        {
            "building_function": "enfamiliehuse",
            "building_class": "klasse_1",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "D-s2,d2",
            "code_reference": "BR25 §§ 91-98, Kap.4 vejl.",
            "code_document": "BR25",
            "description": "Isoleringsmateriale i facade, enfamiliehuse ≤ 2 etager",
        },
        {
            "building_function": "rækkehuse",
            "building_class": "klasse_1",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "D-s2,d2",
            "code_reference": "BR25 §§ 91-98, Kap.4 vejl.",
            "code_document": "BR25",
            "description": "Isoleringsmateriale i facade, rækkehuse ≤ 2 etager",
        },

        # Etageboliger (klasse_2, ≤ 22m) — non-combustible insulation required
        {
            "building_function": "etageboliger",
            "building_class": "klasse_2",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "A2-s1,d0",
            "code_reference": "BR25 §§ 110-119, Bilag 2",
            "code_document": "BR25",
            "description": (
                "Isoleringsmateriale i ventileret facadesystem, etageboliger ≤ 22m. "
                "Non-combustible insulation required per pre-accepted solution."
            ),
        },

        # Etageboliger (klasse_3, > 22m)
        {
            "building_function": "etageboliger",
            "building_class": "klasse_3",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "A2-s1,d0",
            "code_reference": "BR25 §§ 136-158",
            "code_document": "BR25",
            "description": (
                "Isoleringsmateriale i facade, etageboliger > 22m. "
                "Performance-based documentation or A2-s1,d0 minimum."
            ),
        },

        # Institutioner (schools, hospitals, klasse_2)
        {
            "building_function": "institutioner",
            "building_class": "klasse_2",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "A2-s1,d0",
            "code_reference": "BR25 §§ 110-119, AK5/6 Bilag",
            "code_document": "BR25",
            "description": "Isoleringsmateriale i facade, institutioner (AK5/6)",
        },
        {
            "building_function": "institutioner",
            "building_class": "klasse_1",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "A2-s1,d0",
            "code_reference": "BR25 §§ 110-119, AK5/6 Bilag",
            "code_document": "BR25",
            "description": "Isoleringsmateriale i facade, institutioner",
        },

        # Erhverv / kontor (commercial, klasse_1/2)
        {
            "building_function": "erhverv",
            "building_class": "klasse_1",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "D-s2,d2",
            "code_reference": "BR25 §§ 110-119, Bilag 3",
            "code_document": "BR25",
            "description": "Isoleringsmateriale i facade, erhverv ≤ 22m",
        },
        {
            "building_function": "erhverv",
            "building_class": "klasse_2",
            "element": "facade_insulation",
            "dimension": "fire_reaction",
            "required_class": "B-s1,d0",
            "code_reference": "BR25 §§ 110-119, Bilag 3",
            "code_document": "BR25",
            "description": "Isoleringsmateriale i facade, erhverv flereetagers",
        },

        # ---------------------------------------------------------------
        # FACADE CLADDING — Fire reaction
        # ---------------------------------------------------------------

        {
            "building_function": "enfamiliehuse",
            "building_class": "klasse_1",
            "element": "facade_cladding",
            "dimension": "fire_reaction",
            "required_class": "D-s2,d2",
            "code_reference": "BR25 §§ 91-98, Kap.4 vejl. Tabel 5",
            "code_document": "BR25",
            "description": "Facadebeklædning, enfamiliehuse",
        },
        {
            "building_function": "rækkehuse",
            "building_class": "klasse_1",
            "element": "facade_cladding",
            "dimension": "fire_reaction",
            "required_class": "D-s2,d2",
            "code_reference": "BR25 §§ 91-98, Kap.4 vejl. Tabel 5",
            "code_document": "BR25",
            "description": "Facadebeklædning, rækkehuse",
        },
        {
            "building_function": "etageboliger",
            "building_class": "klasse_2",
            "element": "facade_cladding",
            "dimension": "fire_reaction",
            "required_class": "D-s2,d2",
            "code_reference": "BR25 §§ 110-119, Kap.4 vejl. Tabel 5",
            "code_document": "BR25",
            "description": (
                "Facadebeklædning, etageboliger ≤ 22m. "
                "Base wall (bagvæg) must be K1 10 / B-s1,d0."
            ),
        },
        {
            "building_function": "etageboliger",
            "building_class": "klasse_3",
            "element": "facade_cladding",
            "dimension": "fire_reaction",
            "required_class": "A2-s1,d0",
            "code_reference": "BR25 §§ 136-158, Kap.4 vejl. Tabel 5",
            "code_document": "BR25",
            "description": "Facadebeklædning, etageboliger > 22m",
        },
        {
            "building_function": "institutioner",
            "building_class": "klasse_2",
            "element": "facade_cladding",
            "dimension": "fire_reaction",
            "required_class": "B-s1,d0",
            "code_reference": "BR25 §§ 110-119, AK5/6 Bilag",
            "code_document": "BR25",
            "description": "Facadebeklædning, institutioner",
        },

        # ---------------------------------------------------------------
        # THERMAL — Facade insulation
        # BR25 § 258, Bilag 2 Tabel 1: U ≤ 0.15 W/(m²K) for ydervæg
        # lambda ≤ 0.040 is a practical proxy for typical 200-250mm installation
        # ---------------------------------------------------------------
        *[
            {
                "building_function": bf,
                "building_class": bc,
                "element": "facade_insulation",
                "dimension": "thermal",
                "metric": "lambda",
                "max_value": 0.040,
                "unit": "W/(m·K)",
                "code_reference": "BR25 § 258, Bilag 2 Tabel 1",
                "code_document": "BR25",
                "description": (
                    f"Max lambda for ydervæg U ≤ 0.15 W/(m²K), {bf}. "
                    f"Proxy: lambda ≤ 0.040 at standard installation thickness."
                ),
            }
            for bf in ["etageboliger", "enfamiliehuse", "rækkehuse", "institutioner", "erhverv"]
            for bc in ["klasse_1", "klasse_2"]
        ],

        # ---------------------------------------------------------------
        # THERMAL — Roof insulation
        # BR25 § 258, Bilag 2 Tabel 1: U ≤ 0.10 W/(m²K) for tag/loft
        # lambda ≤ 0.037 proxy for 300mm typical thickness
        # ---------------------------------------------------------------
        *[
            {
                "building_function": bf,
                "building_class": bc,
                "element": "roof_insulation",
                "dimension": "thermal",
                "metric": "lambda",
                "max_value": 0.037,
                "unit": "W/(m·K)",
                "code_reference": "BR25 § 258, Bilag 2 Tabel 1",
                "code_document": "BR25",
                "description": (
                    f"Max lambda for tag/loft U ≤ 0.10 W/(m²K), {bf}."
                ),
            }
            for bf in ["etageboliger", "enfamiliehuse", "rækkehuse", "institutioner", "erhverv"]
            for bc in ["klasse_1", "klasse_2"]
        ],

        # ---------------------------------------------------------------
        # THERMAL — Floor insulation
        # BR25 § 258, Bilag 2 Tabel 1: U ≤ 0.10 W/(m²K) for terrændæk
        # ---------------------------------------------------------------
        *[
            {
                "building_function": bf,
                "building_class": bc,
                "element": "floor_insulation",
                "dimension": "thermal",
                "metric": "lambda",
                "max_value": 0.037,
                "unit": "W/(m·K)",
                "code_reference": "BR25 § 258, Bilag 2 Tabel 1",
                "code_document": "BR25",
                "description": (
                    f"Max lambda for terrændæk U ≤ 0.10 W/(m²K), {bf}."
                ),
            }
            for bf in ["etageboliger", "enfamiliehuse", "rækkehuse"]
            for bc in ["klasse_1", "klasse_2"]
        ],

        # ---------------------------------------------------------------
        # FIRE DOORS
        # BR25 § 94, Bilag 2: EI 30-Sa for lejlighedsdøre mod trapperum
        # ---------------------------------------------------------------
        {
            "building_function": "etageboliger",
            "building_class": "klasse_2",
            "element": "fire_door",
            "dimension": "fire_resistance",
            "metric": "fire_resistance_minutes",
            "min_value": 30,
            "unit": "min",
            "code_reference": "BR25 § 94, Bilag 2",
            "code_document": "BR25",
            "description": "Lejlighedsdør mod trapperum — EI 30-Sa minimum",
        },
        {
            "building_function": "etageboliger",
            "building_class": "klasse_3",
            "element": "fire_door",
            "dimension": "fire_resistance",
            "metric": "fire_resistance_minutes",
            "min_value": 60,
            "unit": "min",
            "code_reference": "BR25 §§ 136-158",
            "code_document": "BR25",
            "description": "Brandsektionsdør, etageboliger > 22m — EI 60 minimum",
        },
        {
            "building_function": "institutioner",
            "building_class": "klasse_2",
            "element": "fire_door",
            "dimension": "fire_resistance",
            "metric": "fire_resistance_minutes",
            "min_value": 30,
            "unit": "min",
            "code_reference": "BR25 § 94",
            "code_document": "BR25",
            "description": "Dør i flugtvejsgang, institutioner — EI 30 minimum",
        },

        # ---------------------------------------------------------------
        # WINDOW GLAZING — Thermal
        # BR25 § 258, Bilag 2 Tabel 1: U ≤ 0.84 W/(m²K) for vinduer
        # Stored as lambda (U-value for glass) for product comparison
        # ---------------------------------------------------------------
        *[
            {
                "building_function": bf,
                "building_class": bc,
                "element": "window_glazing",
                "dimension": "thermal",
                "metric": "lambda",
                "max_value": 0.84,
                "unit": "W/(m²K)",
                "code_reference": "BR25 § 258, Bilag 2 Tabel 1",
                "code_document": "BR25",
                "description": f"Vindue U-værdi ≤ 0.84 W/(m²K), {bf}",
            }
            for bf in ["etageboliger", "enfamiliehuse", "rækkehuse", "institutioner", "erhverv"]
            for bc in ["klasse_1", "klasse_2"]
        ],
    ]

    for req in requirements:
        db.add(CodeRequirement(**req))
    db.commit()
    print(f"  Seeded {len(requirements)} BR25 code requirements")


def seed_danish_products(db):
    """
    Named products commonly specified in Danish construction.
    Carbon values from manufacturer EPDs / ÖKOBAUDAT-equivalent data.
    Marked with epd_source='manual'.
    """
    products = [
        # ---------------------------------------------------------------
        # ROCKWOOL — dominant insulation supplier in Denmark
        # ---------------------------------------------------------------
        {
            "name": "Rockwool Frontrock MAX E",
            "manufacturer": "Rockwool",
            "product_type": "stone wool facade insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.036,
            "density": 150.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 8.5,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Rockwool ROCKMIN Plus",
            "manufacturer": "Rockwool",
            "product_type": "stone wool loft insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.037,
            "density": 30.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "roof_insulation,floor_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 5.2,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Rockwool Duorock 040",
            "manufacturer": "Rockwool",
            "product_type": "stone wool dual-density insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.040,
            "density": 100.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,roof_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 7.5,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ---------------------------------------------------------------
        # PAROC — major supplier in Scandinavian market
        # ---------------------------------------------------------------
        {
            "name": "Paroc eXtra",
            "manufacturer": "Paroc",
            "product_type": "stone wool loft/floor insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.036,
            "density": 22.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "roof_insulation,floor_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 4.9,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Paroc FAS 4",
            "manufacturer": "Paroc",
            "product_type": "stone wool facade insulation slab",
            "fire_euroclass": "A1",
            "lambda_value": 0.036,
            "density": 80.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 7.8,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ---------------------------------------------------------------
        # KINGSPAN — PIR/phenolic, common in Denmark (Kooltherm range)
        # ---------------------------------------------------------------
        {
            "name": "Kingspan Kooltherm K15",
            "manufacturer": "Kingspan",
            "product_type": "phenolic foam facade insulation",
            "fire_euroclass": "B-s1,d0",
            "lambda_value": 0.020,
            "density": 45.0,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "facade_insulation",
            "material_class": "phenolic_foam",
            "epd_co2_per_m2": 21.0,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.80, "degradation_urban": 0.90, "degradation_continental": 1.0,
        },
        {
            "name": "Kingspan Kooltherm K8",
            "manufacturer": "Kingspan",
            "product_type": "phenolic foam cavity board",
            "fire_euroclass": "B-s1,d0",
            "lambda_value": 0.019,
            "density": 45.0,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,external_wall",
            "material_class": "phenolic_foam",
            "epd_co2_per_m2": 19.5,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.80, "degradation_urban": 0.90, "degradation_continental": 1.0,
        },
        # ---------------------------------------------------------------
        # ISOVER — common in Denmark
        # ---------------------------------------------------------------
        {
            "name": "Isover Climcover Roll AluK",
            "manufacturer": "Saint-Gobain Isover",
            "product_type": "glass wool facade/roof insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.033,
            "density": 32.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,roof_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 5.8,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ---------------------------------------------------------------
        # CEMBRIT — Danish manufacturer, major in DK market
        # ---------------------------------------------------------------
        {
            "name": "Cembrit Speed",
            "manufacturer": "Cembrit",
            "product_type": "fibre cement facade panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 1550.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "fibre_cement",
            "epd_co2_per_m2": 9.1,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.88, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        {
            "name": "Cembrit Patina",
            "manufacturer": "Cembrit",
            "product_type": "fibre cement facade panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 1600.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "fibre_cement",
            "epd_co2_per_m2": 9.4,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.88, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        # ---------------------------------------------------------------
        # RHEINZINK — zinc cladding, used on Danish residential buildings
        # ---------------------------------------------------------------
        {
            "name": "RHEINZINK prePATINA blue-grey",
            "manufacturer": "RHEINZINK",
            "product_type": "zinc facade cladding",
            "fire_euroclass": "A1",
            "density": 7133.0,
            "service_life_years": 80,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "zinc",
            "epd_co2_per_m2": 14.8,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.88, "degradation_urban": 0.95, "degradation_continental": 1.0,
        },
    ]

    for p in products:
        existing = db.query(Product).filter_by(name=p["name"], manufacturer=p["manufacturer"]).first()
        if not existing:
            db.add(Product(**p))
    db.commit()
    print(f"  Seeded {len(products)} Danish-specific products")


def seed_extended_products(db):
    """
    Extended named product database — Danish and Dutch markets.
    Sources: manufacturer EPDs, ÖKOBAUDAT-equivalent national data,
    CE marking declarations, public product datasheets.
    Covers: insulation, cladding, structural timber, glazing, gypsum, masonry.
    """
    products = [
        # ===================================================================
        # SAINT-GOBAIN ISOVER — glass wool, widely used DK + NL
        # ===================================================================
        {
            "name": "Isover Cavity Wall Slab 32",
            "manufacturer": "Saint-Gobain Isover",
            "product_type": "glass wool cavity wall insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.032,
            "density": 32.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,external_wall",
            "material_class": "glass_wool",
            "epd_co2_per_m2": 3.8,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Isover Topdek 036",
            "manufacturer": "Saint-Gobain Isover",
            "product_type": "glass wool roof insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.036,
            "density": 28.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "roof_insulation",
            "material_class": "glass_wool",
            "epd_co2_per_m2": 4.1,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Isover Facade 34",
            "manufacturer": "Saint-Gobain Isover",
            "product_type": "glass wool facade insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.034,
            "density": 50.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation",
            "material_class": "glass_wool",
            "epd_co2_per_m2": 5.2,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ===================================================================
        # KNAUF INSULATION — glass + rock wool, NL + DK
        # ===================================================================
        {
            "name": "Knauf Insulation Earthwool FrameTherm Roll 40",
            "manufacturer": "Knauf Insulation",
            "product_type": "glass wool roll insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.040,
            "density": 11.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "roof_insulation,floor_insulation",
            "material_class": "glass_wool",
            "epd_co2_per_m2": 2.4,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Knauf Insulation Rocksilk RainScreen Slab 036",
            "manufacturer": "Knauf Insulation",
            "product_type": "stone wool rainscreen facade insulation",
            "fire_euroclass": "A1",
            "lambda_value": 0.036,
            "density": 90.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation",
            "material_class": "mineral_wool",
            "epd_co2_per_m2": 7.9,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.97, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ===================================================================
        # RECTICEL — PIR foam, common NL + DK
        # ===================================================================
        {
            "name": "Recticel Eurowall+",
            "manufacturer": "Recticel Insulation",
            "product_type": "PIR rigid foam cavity wall insulation",
            "fire_euroclass": "B-s2,d0",
            "lambda_value": 0.022,
            "density": 35.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation,external_wall",
            "material_class": "pir_foam",
            "epd_co2_per_m2": 16.2,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Recticel Powerroof",
            "manufacturer": "Recticel Insulation",
            "product_type": "PIR rigid foam flat roof insulation",
            "fire_euroclass": "F",
            "lambda_value": 0.023,
            "density": 32.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "roof_insulation",
            "material_class": "pir_foam",
            "epd_co2_per_m2": 14.8,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ===================================================================
        # XELLA / YTONG — AAC blocks, NL + DK
        # ===================================================================
        {
            "name": "Ytong PP2/0.35 Comfort",
            "manufacturer": "Xella",
            "product_type": "autoclaved aerated concrete block",
            "fire_euroclass": "A1",
            "lambda_value": 0.088,
            "density": 350.0,
            "compressive_strength": 200.0,
            "service_life_years": 100,
            "ce_marking": True,
            "applicable_elements": "external_wall,internal_wall,load_bearing_wall",
            "material_class": "aac_block",
            "epd_co2_per_m2": 52.0,
            "gwp_declared_unit": "m³",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Ytong PP4/0.60 Standard",
            "manufacturer": "Xella",
            "product_type": "autoclaved aerated concrete block",
            "fire_euroclass": "A1",
            "lambda_value": 0.150,
            "density": 600.0,
            "compressive_strength": 400.0,
            "service_life_years": 100,
            "ce_marking": True,
            "applicable_elements": "external_wall,internal_wall,load_bearing_wall",
            "material_class": "aac_block",
            "epd_co2_per_m2": 84.0,
            "gwp_declared_unit": "m³",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ===================================================================
        # WIENERBERGER — clay bricks, NL + DK
        # ===================================================================
        {
            "name": "Wienerberger Porotherm 38 Profi",
            "manufacturer": "Wienerberger",
            "product_type": "thermal clay block",
            "fire_euroclass": "A1",
            "lambda_value": 0.110,
            "density": 800.0,
            "service_life_years": 100,
            "ce_marking": True,
            "applicable_elements": "external_wall,load_bearing_wall",
            "material_class": "clay_brick",
            "epd_co2_per_m2": 110.0,
            "gwp_declared_unit": "m³",
            "epd_source": "manual",
            "degradation_coastal": 0.95, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Wienerberger Terca Facing Brick",
            "manufacturer": "Wienerberger",
            "product_type": "clay facing brick",
            "fire_euroclass": "A1",
            "density": 1900.0,
            "service_life_years": 100,
            "ce_marking": True,
            "applicable_elements": "facade_cladding,external_wall",
            "material_class": "clay_brick",
            "epd_co2_per_m2": 28.0,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.95, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ===================================================================
        # KNAUF — gypsum board, NL + DK
        # ===================================================================
        {
            "name": "Knauf GKB Standard Gypsum Board 12.5mm",
            "manufacturer": "Knauf",
            "product_type": "standard gypsum board",
            "fire_euroclass": "A2-s1,d0",
            "density": 1050.0,
            "sound_reduction_rw": 36.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "internal_wall",
            "material_class": "gypsum_board",
            "epd_co2_per_m2": 3.1,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Knauf GKFI Fire-Resistant Board 15mm",
            "manufacturer": "Knauf",
            "product_type": "fire-resistant gypsum board",
            "fire_euroclass": "A2-s1,d0",
            "fire_resistance_minutes": 60,
            "density": 1100.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "internal_wall,structural_frame",
            "material_class": "gypsum_board",
            "epd_co2_per_m2": 4.0,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Gyproc TF Board 15mm",
            "manufacturer": "Saint-Gobain Gyproc",
            "product_type": "fire-resistant gypsum board",
            "fire_euroclass": "A2-s1,d0",
            "fire_resistance_minutes": 60,
            "density": 1100.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "internal_wall",
            "material_class": "gypsum_board",
            "epd_co2_per_m2": 3.9,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ===================================================================
        # STRUCTURAL TIMBER — CLT and glulam, DK
        # ===================================================================
        {
            "name": "Metsä Wood Kerto-S LVL",
            "manufacturer": "Metsä Wood",
            "product_type": "laminated veneer lumber structural beam",
            "fire_euroclass": "D-s2,d0",
            "density": 510.0,
            "service_life_years": 60,
            "ce_marking": True,
            "applicable_elements": "structural_frame,load_bearing_wall",
            "material_class": "glulam",
            "epd_co2_per_m2": 98.0,
            "gwp_declared_unit": "m³",
            "epd_source": "manual",
            "degradation_coastal": 0.80, "degradation_urban": 0.92, "degradation_continental": 1.0,
        },
        {
            "name": "Moelven Timber BeamClimate",
            "manufacturer": "Moelven",
            "product_type": "glulam structural beam",
            "fire_euroclass": "D-s2,d0",
            "density": 480.0,
            "service_life_years": 60,
            "ce_marking": True,
            "applicable_elements": "structural_frame",
            "material_class": "glulam",
            "epd_co2_per_m2": 105.0,
            "gwp_declared_unit": "m³",
            "epd_source": "manual",
            "degradation_coastal": 0.80, "degradation_urban": 0.92, "degradation_continental": 1.0,
        },
        {
            "name": "Stora Enso CLT 5-layer",
            "manufacturer": "Stora Enso",
            "product_type": "cross-laminated timber structural panel",
            "fire_euroclass": "D-s2,d0",
            "density": 480.0,
            "service_life_years": 60,
            "ce_marking": True,
            "applicable_elements": "structural_frame,load_bearing_wall,facade_cladding",
            "material_class": "clt",
            "epd_co2_per_m2": 118.0,
            "gwp_declared_unit": "m³",
            "epd_source": "manual",
            "degradation_coastal": 0.78, "degradation_urban": 0.90, "degradation_continental": 1.0,
        },
        {
            "name": "Binderholz BBS CLT",
            "manufacturer": "Binderholz",
            "product_type": "cross-laminated timber structural panel",
            "fire_euroclass": "D-s2,d0",
            "density": 490.0,
            "service_life_years": 60,
            "ce_marking": True,
            "applicable_elements": "structural_frame,load_bearing_wall",
            "material_class": "clt",
            "epd_co2_per_m2": 122.0,
            "gwp_declared_unit": "m³",
            "epd_source": "manual",
            "degradation_coastal": 0.78, "degradation_urban": 0.90, "degradation_continental": 1.0,
        },
        # ===================================================================
        # FACADE CLADDING — metal, NL + DK
        # ===================================================================
        {
            "name": "VMZINC QUARTZ-ZINC Standing Seam",
            "manufacturer": "VMZINC",
            "product_type": "zinc standing seam facade cladding",
            "fire_euroclass": "A1",
            "density": 7133.0,
            "service_life_years": 80,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "zinc",
            "epd_co2_per_m2": 13.5,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.88, "degradation_urban": 0.95, "degradation_continental": 1.0,
        },
        {
            "name": "Ruukki Classic RR Profiled Steel Cladding",
            "manufacturer": "Ruukki",
            "product_type": "profiled steel facade cladding",
            "fire_euroclass": "A1",
            "density": 7850.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "aluminium",
            "epd_co2_per_m2": 11.4,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.85, "degradation_urban": 0.92, "degradation_continental": 1.0,
        },
        {
            "name": "Alucobond Plus ACM Panel",
            "manufacturer": "3A Composites",
            "product_type": "aluminium composite facade panel",
            "fire_euroclass": "B-s1,d0",
            "density": 2700.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "aluminium_composite",
            "epd_co2_per_m2": 22.0,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.92, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        {
            "name": "Alucobond A2 FR Panel",
            "manufacturer": "3A Composites",
            "product_type": "aluminium composite fire-rated facade panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 2700.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "aluminium_composite",
            "epd_co2_per_m2": 24.0,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.92, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        # ===================================================================
        # FACADE CLADDING — fibre cement, NL + DK
        # ===================================================================
        {
            "name": "James Hardie HardiePlank Lap Siding",
            "manufacturer": "James Hardie",
            "product_type": "fibre cement lap siding",
            "fire_euroclass": "A2-s1,d0",
            "density": 1400.0,
            "service_life_years": 35,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "fibre_cement",
            "epd_co2_per_m2": 7.8,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.90, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        {
            "name": "Cedral Click Weatherboard",
            "manufacturer": "Etex",
            "product_type": "fibre cement weatherboard cladding",
            "fire_euroclass": "A2-s1,d0",
            "density": 1400.0,
            "service_life_years": 35,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "fibre_cement",
            "epd_co2_per_m2": 8.2,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.90, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        {
            "name": "Equitone Natura Pro",
            "manufacturer": "Etex",
            "product_type": "raw fibre cement facade panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 1600.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "fibre_cement",
            "epd_co2_per_m2": 10.1,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.90, "degradation_urban": 0.97, "degradation_continental": 1.0,
        },
        # ===================================================================
        # FACADE CLADDING — timber, DK
        # ===================================================================
        {
            "name": "Kebony Clear Facade Board",
            "manufacturer": "Kebony",
            "product_type": "modified timber facade cladding",
            "fire_euroclass": "D-s2,d0",
            "density": 700.0,
            "service_life_years": 30,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "timber",
            "epd_co2_per_m2": 8.5,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.80, "degradation_urban": 0.90, "degradation_continental": 1.0,
        },
        {
            "name": "Accoya Facade Board",
            "manufacturer": "Accsys Technologies",
            "product_type": "acetylated timber facade cladding",
            "fire_euroclass": "D-s2,d0",
            "density": 500.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "timber",
            "epd_co2_per_m2": 9.1,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.85, "degradation_urban": 0.95, "degradation_continental": 1.0,
        },
        {
            "name": "Sioo:x Siberian Larch Cladding",
            "manufacturer": "Sioo:x",
            "product_type": "larch timber facade cladding",
            "fire_euroclass": "D-s2,d0",
            "density": 600.0,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "timber",
            "epd_co2_per_m2": 6.2,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.75, "degradation_urban": 0.88, "degradation_continental": 1.0,
        },
        # ===================================================================
        # HPL PANELS — facade, NL + DK
        # ===================================================================
        {
            "name": "Trespa Meteon FR Grade",
            "manufacturer": "Trespa",
            "product_type": "HPL fire-rated facade panel",
            "fire_euroclass": "B-s2,d0",
            "density": 1400.0,
            "service_life_years": 30,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "hpl_panel",
            "epd_co2_per_m2": 18.5,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.92, "degradation_urban": 0.98, "degradation_continental": 1.0,
        },
        {
            "name": "Fundermax Max Exterior Compact",
            "manufacturer": "Fundermax",
            "product_type": "HPL compact facade panel",
            "fire_euroclass": "B-s2,d0",
            "density": 1380.0,
            "service_life_years": 30,
            "ce_marking": True,
            "applicable_elements": "facade_cladding",
            "material_class": "hpl_panel",
            "epd_co2_per_m2": 19.2,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.92, "degradation_urban": 0.98, "degradation_continental": 1.0,
        },
        # ===================================================================
        # GLAZING — additional products, NL + DK
        # ===================================================================
        {
            "name": "AGC Stopray Vision-50",
            "manufacturer": "AGC Glass Europe",
            "product_type": "solar control double glazing unit",
            "fire_euroclass": "A1",
            "lambda_value": 1.0,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "window_glazing",
            "material_class": "glass",
            "epd_co2_per_m2": 22.5,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "visible_light_transmittance": 0.50,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Saint-Gobain SGG Stadip Protect VSG",
            "manufacturer": "Saint-Gobain",
            "product_type": "laminated safety glazing",
            "fire_euroclass": "A1",
            "lambda_value": 1.4,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "window_glazing",
            "material_class": "glass",
            "epd_co2_per_m2": 18.5,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "visible_light_transmittance": 0.80,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Pilkington Pyrostop 30",
            "manufacturer": "Pilkington",
            "product_type": "fire-resistant glazing EW/EI 30",
            "fire_euroclass": "A1",
            "fire_resistance_minutes": 30,
            "lambda_value": 1.8,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "window_glazing,fire_door",
            "material_class": "glass",
            "epd_co2_per_m2": 45.0,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "visible_light_transmittance": 0.82,
            "degradation_coastal": 0.98, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "VELUX GGL FK06 Triple Glazed",
            "manufacturer": "VELUX",
            "product_type": "triple glazed roof window",
            "fire_euroclass": "A1",
            "lambda_value": 0.6,
            "service_life_years": 25,
            "ce_marking": True,
            "applicable_elements": "window_glazing,roof_insulation",
            "material_class": "glass",
            "epd_co2_per_m2": 28.0,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "visible_light_transmittance": 0.60,
            "degradation_coastal": 0.95, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ===================================================================
        # FIRE DOORS — additional, NL + DK
        # ===================================================================
        {
            "name": "TYMAN EI2 60 Steel Fire Door",
            "manufacturer": "TYMAN",
            "product_type": "steel fire door EI2-60",
            "fire_euroclass": "A1",
            "fire_resistance_minutes": 60,
            "service_life_years": 30,
            "ce_marking": True,
            "applicable_elements": "fire_door",
            "material_class": "steel",
            "epd_co2_per_m2": 55.0,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.88, "degradation_urban": 0.95, "degradation_continental": 1.0,
        },
        {
            "name": "Jeld-Wen FD30s Timber Fire Door",
            "manufacturer": "Jeld-Wen",
            "product_type": "timber fire door FD30s",
            "fire_euroclass": "C-s2,d0",
            "fire_resistance_minutes": 30,
            "service_life_years": 30,
            "ce_marking": True,
            "applicable_elements": "fire_door",
            "material_class": "timber",
            "epd_co2_per_m2": 28.0,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 0.82, "degradation_urban": 0.92, "degradation_continental": 1.0,
        },
        # ===================================================================
        # EPS / XPS — additional named products, NL
        # ===================================================================
        {
            "name": "Knauf Therm Facade 032",
            "manufacturer": "Knauf",
            "product_type": "EPS expanded polystyrene facade insulation",
            "fire_euroclass": "E",
            "lambda_value": 0.032,
            "density": 18.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "facade_insulation",
            "material_class": "eps_foam",
            "epd_co2_per_m2": 4.8,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Austrotherm XPS TOP P GK",
            "manufacturer": "Austrotherm",
            "product_type": "XPS extruded polystyrene perimeter insulation",
            "fire_euroclass": "E",
            "lambda_value": 0.034,
            "density": 35.0,
            "service_life_years": 50,
            "ce_marking": True,
            "applicable_elements": "floor_insulation,roof_insulation",
            "material_class": "xps_foam",
            "epd_co2_per_m2": 7.2,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        # ===================================================================
        # INTERNAL WALL — acoustic / partition systems
        # ===================================================================
        {
            "name": "Fermacell 2E22 Floor Element",
            "manufacturer": "Fermacell",
            "product_type": "gypsum fibre floor panel",
            "fire_euroclass": "A2-s1,d0",
            "density": 1150.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "floor_insulation,internal_wall",
            "material_class": "gypsum_fibre",
            "epd_co2_per_m2": 5.8,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Rockfon Mono Acoustic Panel",
            "manufacturer": "Rockwool",
            "product_type": "stone wool acoustic ceiling/wall panel",
            "fire_euroclass": "A1",
            "density": 145.0,
            "service_life_years": 30,
            "ce_marking": True,
            "applicable_elements": "internal_wall,roof_insulation",
            "material_class": "stone_wool_panel",
            "epd_co2_per_m2": 6.2,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
        {
            "name": "Danogips Wallboard Pro 15mm",
            "manufacturer": "Danogips",
            "product_type": "standard gypsum board",
            "fire_euroclass": "A2-s1,d0",
            "density": 1050.0,
            "service_life_years": 40,
            "ce_marking": True,
            "applicable_elements": "internal_wall",
            "material_class": "gypsum_board",
            "epd_co2_per_m2": 3.3,
            "gwp_declared_unit": "m²",
            "epd_source": "manual",
            "degradation_coastal": 1.0, "degradation_urban": 1.0, "degradation_continental": 1.0,
        },
    ]

    inserted = 0
    for p in products:
        existing = db.query(Product).filter_by(
            name=p["name"], manufacturer=p["manufacturer"]
        ).first()
        if not existing:
            db.add(Product(**p))
            inserted += 1
    db.commit()
    print(f"  Seeded {inserted} extended named products")


def seed_incompatibilities(db):
    """Seed known material incompatibility pairs."""
    incompatibilities = [
        ("galvanised_steel", "copper", "galvanic corrosion", "severe",
         "Zinc coating on galvanised steel forms an electrochemical cell with copper. Zinc corrodes rapidly — contact must be prevented with a non-conductive barrier.",
         "BDA Galvanic Incompatibility Guide"),
        ("zinc", "copper", "galvanic corrosion", "severe",
         "Zinc in direct contact with copper causes accelerated galvanic corrosion of the zinc. No direct contact permitted — use PE or neoprene isolation.",
         "BDA Galvanic Incompatibility Guide"),
        ("zinc", "carbon_steel", "galvanic corrosion", "moderate",
         "Zinc (anodic) corrodes preferentially when in contact with carbon steel in wet conditions. Protective coating or isolation layer required.",
         "NEN-EN ISO 9223"),
        ("pvc", "eps_insulation", "plasticiser migration", "moderate",
         "Plasticisers in PVC membranes migrate into EPS/polystyrene on contact, causing PVC to embrittle and EPS to swell. Physical separator sheet required.",
         "EOTA Technical Report TR 006"),
        ("pvc", "polystyrene", "plasticiser migration", "severe",
         "Direct PVC–polystyrene contact causes aggressive plasticiser migration, compromising both materials' integrity. Separation layer is mandatory.",
         "EOTA Technical Report TR 006"),
        ("aluminium", "concrete", "alkali attack", "moderate",
         "Aluminium in direct contact with wet concrete or cement mortar is attacked by the alkaline pH. Bituminous paint or PE barrier required at all contact points.",
         "NEN-EN ISO 9223"),
        ("aluminium", "carbon_steel", "galvanic corrosion", "moderate",
         "Aluminium (anodic) corrodes preferentially when in contact with carbon steel in wet conditions. Use isolating neoprene washers or apply protective coating.",
         "BDA Galvanic Incompatibility Guide"),
        ("copper", "aluminium", "galvanic corrosion", "moderate",
         "Copper (cathodic) accelerates corrosion of adjacent aluminium in wet conditions. Physical separation or surface treatment of aluminium required.",
         "BDA Galvanic Incompatibility Guide"),
        ("carbon_steel", "stainless_steel", "galvanic corrosion", "moderate",
         "Carbon steel (anodic) corrodes preferentially when in contact with stainless steel in wet conditions. Use same material family or apply isolation.",
         "BDA Galvanic Incompatibility Guide"),
        ("bitumen", "pir_foam", "chemical attack", "moderate",
         "Solvent-based bitumen products attack PIR foam facings and may compromise insulation performance. Use only hot-melt or water-based bitumen adhesives in contact with PIR.",
         "NHBC Standards Chapter 7.1"),
        ("eps_insulation", "solvent_adhesive", "chemical dissolution", "severe",
         "Solvent-based adhesives and sealants dissolve EPS rapidly. Only water-based or purpose-approved adhesives (e.g. polyurethane foam) may be used in direct contact with EPS.",
         "EOTA ETAG 004"),
        ("galvanised_steel", "concrete", "zinc corrosion", "moderate",
         "Alkaline cement/concrete in prolonged wet contact corrodes the zinc coating on galvanised steel. Apply bituminous paint or PE tape to contact surfaces before embedment.",
         "NEN-EN ISO 9223"),
    ]

    for (mat_a, mat_b, risk_type, severity, description, code_ref) in incompatibilities:
        db.add(MaterialIncompatibility(
            material_class_a=mat_a,
            material_class_b=mat_b,
            risk_type=risk_type,
            severity=severity,
            description=description,
            code_reference=code_ref,
        ))
    db.commit()
    print(f"  Seeded {len(incompatibilities)} material incompatibilities")


def seed_vlt_data(db):
    """
    Seed visible light transmittance (VLT) for glazing products.
    Values from manufacturer datasheets / EN 410:2011 test data.
    """
    vlt_map = {
        # Product name (partial match) → VLT
        "AGC Planibel Clearvision HR++":    0.73,   # AGC datasheet
        "AGC iplus Top 1.1 Triple":         0.64,   # AGC datasheet (iplus Top triple)
        "Pilkington Suncool 66/33 HR++":    0.64,   # EN 410 — "66" is VLT %
        "Pilkington Suncool HR++":          0.38,   # generic Suncool, lower VLT
        "Pilkington Optitherm S3":          0.72,   # Pilkington datasheet (clear low-e)
        "Saint-Gobain SGG Climalit Plus":   0.73,   # SGG datasheet
    }

    updated = 0
    for product in db.query(Product).filter(Product.material_class == "glass").all():
        for name_key, vlt in vlt_map.items():
            if name_key.lower() in product.name.lower():
                product.visible_light_transmittance = vlt
                updated += 1
                break
        else:
            # Default: infer from product type
            if "triple" in product.name.lower():
                product.visible_light_transmittance = 0.64
            elif "solar" in product.name.lower() or "suncool" in product.name.lower() or "sun" in product.name.lower():
                product.visible_light_transmittance = 0.38
            elif "tint" in product.name.lower() or "bronze" in product.name.lower():
                product.visible_light_transmittance = 0.45
            else:
                product.visible_light_transmittance = 0.72  # standard clear double

    db.commit()
    print(f"  Seeded VLT for {updated} glazing products (explicit) + remainder by inference")


def main():
    print("Initialising database...")
    Base.metadata.drop_all(engine)
    init_db()

    db = SessionLocal()
    try:
        print("Seeding fire class hierarchy...")
        seed_fire_class_ranks(db)

        print("Seeding building code requirements (Bbl / NEN)...")
        seed_code_requirements(db)

        print("Seeding Danish building code requirements (BR25)...")
        seed_br25_requirements(db)

        print("Seeding curated product database (named products)...")
        seed_products(db)

        print("Seeding Danish-specific named products...")
        seed_danish_products(db)

        print("Seeding extended named products (DK + NL market)...")
        seed_extended_products(db)

        print("Seeding wellbeing properties (biophilic, effusivity, acoustic)...")
        seed_wellbeing_data(db)

        print("Seeding material incompatibilities...")
        seed_incompatibilities(db)

        print("Seeding VLT (visible light transmittance) for glazing products...")
        seed_vlt_data(db)

        # Ingest ÖKOBAUDAT generic materials
        obd_zip = os.path.join(
            os.path.dirname(__file__), "..", "api", "data", "oekobaudat.zip"
        )
        if os.path.exists(obd_zip):
            print("Ingesting ÖKOBAUDAT 2024 I (generic materials with real EPD carbon data)...")
            inserted, no_gwp, dupes, errors = ingest_oekobaudat(
                obd_zip, db, verbose=True
            )
            print(f"  ÖKOBAUDAT: {inserted} inserted, {no_gwp} without GWP, {errors} errors")
        else:
            print(f"  ÖKOBAUDAT zip not found at {obd_zip} — skipping generic materials")

        # Ingest EC3 named products
        print("Ingesting EC3 (Building Transparency) named products...")
        try:
            from ingest_ec3 import ingest as ingest_ec3
            n = ingest_ec3(db, verbose=True)
            print(f"  EC3: {n} products inserted/updated")
        except Exception as e:
            print(f"  EC3 ingestion skipped: {e}")

        # Re-seed wellbeing data for any new products added by EC3/ÖKOBAUDAT
        print("Re-seeding wellbeing data for all products...")
        seed_wellbeing_data(db)

        print("\nDone. Database ready.")
        print(f"  Products total:          {db.query(Product).count()}")
        print(f"  Code requirements:       {db.query(CodeRequirement).count()}")
        print(f"  Fire class ranks:        {db.query(FireClassRank).count()}")
        print(f"  Material incompatibilities: {db.query(MaterialIncompatibility).count()}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
