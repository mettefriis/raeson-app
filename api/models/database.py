"""
Structured knowledge base models.

Two domains:
1. Building code requirements (what's required)
2. Material properties (what products deliver)

The compliance engine joins these: does product Y meet
the requirements that apply to element Z in building type W?
"""

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, Text,
    ForeignKey, create_engine, Enum as SQLEnum, DateTime
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime, timezone
import enum

Base = declarative_base()


# ---------------------------------------------------------------------------
# ENUMS
# ---------------------------------------------------------------------------

class BuildingFunction(str, enum.Enum):
    """Bbl 'gebruiksfuncties' — building use types."""
    RESIDENTIAL = "woonfunctie"
    OFFICE = "kantoorfunctie"
    EDUCATION = "onderwijsfunctie"
    HEALTHCARE = "gezondheidszorgfunctie"
    ASSEMBLY = "bijeenkomstfunctie"
    RETAIL = "winkelfunctie"
    INDUSTRIAL = "industriefunctie"
    ACCOMMODATION = "logiesfunctie"


class BuildingClass(str, enum.Enum):
    """Fire safety classes per Bbl."""
    CLASS_1 = "klasse_1"   # low-rise residential
    CLASS_2 = "klasse_2"   # mid-rise
    CLASS_3 = "klasse_3"   # high-rise (>70m)


class BuildingElement(str, enum.Enum):
    """Where in the building the material is used."""
    FACADE_CLADDING = "facade_cladding"
    FACADE_INSULATION = "facade_insulation"
    ROOF_INSULATION = "roof_insulation"
    FLOOR_INSULATION = "floor_insulation"
    INTERNAL_WALL = "internal_wall"
    EXTERNAL_WALL = "external_wall"
    STRUCTURAL_FRAME = "structural_frame"
    FIRE_DOOR = "fire_door"
    WINDOW_GLAZING = "window_glazing"
    LOAD_BEARING_WALL = "load_bearing_wall"


class RiskLevel(str, enum.Enum):
    PASS = "pass"
    CONDITIONAL = "conditional"
    FAIL = "fail"


class ComplianceDimension(str, enum.Enum):
    FIRE_REACTION = "fire_reaction"         # NEN-EN 13501-1
    FIRE_RESISTANCE = "fire_resistance"     # NEN 6068 / NEN-EN 13501-2
    THERMAL = "thermal"                     # NEN 1068 / Bbl Rc values
    STRUCTURAL = "structural"              # Eurocode
    ACOUSTIC = "acoustic"                  # Bbl acoustic reqs
    MOISTURE = "moisture"                  # condensation / vapour
    DURABILITY = "durability"              # service life
    CARBON = "carbon"                      # embodied carbon (EPD)
    COMPATIBILITY = "compatibility"        # material compatibility


# ---------------------------------------------------------------------------
# BUILDING CODE REQUIREMENTS
# ---------------------------------------------------------------------------

class CodeRequirement(Base):
    """
    A specific requirement from the Bbl or referenced NEN standard.

    Example row:
        building_function = RESIDENTIAL
        building_class = CLASS_2
        element = FACADE_CLADDING
        dimension = FIRE_REACTION
        metric = "euroclass"
        min_value = None
        required_class = "B-s2,d0"
        code_reference = "Bbl art. 3.72 lid 1"
        description = "Buitenzijde gevel, woongebouw klasse 2"
    """
    __tablename__ = "code_requirements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    building_function = Column(String, nullable=False, index=True)
    building_class = Column(String, nullable=False, index=True)
    element = Column(String, nullable=False, index=True)
    dimension = Column(String, nullable=False)

    # For numeric thresholds (e.g., Rc >= 4.7 m²K/W)
    metric = Column(String, nullable=True)           # e.g. "Rc", "Rw", "lambda"
    min_value = Column(Float, nullable=True)         # minimum required value
    max_value = Column(Float, nullable=True)         # maximum allowed value
    unit = Column(String, nullable=True)             # e.g. "m²K/W", "dB"

    # For classification-based requirements (e.g., fire class >= B-s2,d0)
    required_class = Column(String, nullable=True)   # e.g. "A2-s1,d0"

    # Traceability
    code_reference = Column(String, nullable=False)  # e.g. "Bbl art. 3.72 lid 1"
    code_document = Column(String, default="Bbl")    # "Bbl", "NEN 1068", etc.
    description = Column(Text, nullable=True)        # human-readable context

    # Jurisdiction — "DK", "NL", "SE", "NO", "DE"
    jurisdiction = Column(String, nullable=True, index=True, default="NL")

    def __repr__(self):
        return f"<CodeReq {self.element}/{self.dimension}: {self.required_class or self.min_value}>"


# ---------------------------------------------------------------------------
# MATERIAL / PRODUCT DATABASE
# ---------------------------------------------------------------------------

class Product(Base):
    """
    A construction product with its certified/declared properties.
    Data sourced from manufacturer TDS, DoP, and EPDs.
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    manufacturer = Column(String, nullable=False)
    product_type = Column(String, nullable=False)     # e.g. "mineral wool insulation"

    # Fire properties (NEN-EN 13501-1)
    fire_euroclass = Column(String, nullable=True)     # e.g. "A1", "A2-s1,d0", "B-s2,d0"
    fire_resistance_minutes = Column(Integer, nullable=True)  # e.g. 30, 60, 90, 120

    # Thermal properties
    lambda_value = Column(Float, nullable=True)        # W/(m·K), thermal conductivity
    r_value_per_unit = Column(Float, nullable=True)    # m²K/W per unit thickness

    # Structural properties
    compressive_strength = Column(Float, nullable=True)  # kPa
    tensile_strength = Column(Float, nullable=True)      # kPa
    density = Column(Float, nullable=True)               # kg/m³

    # Acoustic
    sound_reduction_rw = Column(Float, nullable=True)    # dB (Rw)

    # Durability / environmental
    service_life_years = Column(Integer, nullable=True)
    moisture_absorption = Column(Float, nullable=True)   # % by volume
    vapour_resistance_mu = Column(Float, nullable=True)  # μ (dimensionless)

    # Certifications
    ce_marking = Column(Boolean, default=False)
    komo_certified = Column(Boolean, default=False)      # Dutch quality cert
    epd_available = Column(Boolean, default=False)

    # Applicable building elements
    applicable_elements = Column(String, nullable=True)  # comma-separated

    # Source traceability
    datasheet_url = Column(String, nullable=True)
    dop_reference = Column(String, nullable=True)        # Declaration of Performance ref

    # EPD / embodied carbon
    epd_co2_per_m2 = Column(Float, nullable=True)        # kg CO₂e per declared unit (A1–A3)
    gwp_declared_unit = Column(String, nullable=True)    # declared unit: "m³", "m²", "kg", "piece"
    oekobaudat_uuid = Column(String, nullable=True, index=True)  # ÖKOBAUDAT process UUID
    epd_source = Column(String, nullable=True)           # "oekobaudat", "ec3", "manual"

    # Material class (for compatibility checks)
    material_class = Column(String, nullable=True)       # e.g. "mineral_wool", "pir_foam"

    # Climate degradation modifiers (multiplier on service_life_years)
    degradation_coastal = Column(Float, nullable=True)       # e.g. 0.85
    degradation_urban = Column(Float, nullable=True)         # e.g. 0.97
    degradation_continental = Column(Float, nullable=True)   # e.g. 1.0

    # ---------------------------------------------------------------------------
    # Phase 2: Wellbeing properties
    # ---------------------------------------------------------------------------

    # Biophilic quality (0–10)
    # Based on: Browning et al. 2014 "14 Patterns of Biophilic Design" (Terrapin);
    # Salingaros fractal complexity; material naturalness and texture research.
    # 8–10: natural materials with high texture complexity (timber, stone, copper)
    # 5–7: semi-natural or processed natural materials
    # 1–4: clearly synthetic/industrial materials
    biophilic_score = Column(Float, nullable=True)
    biophilic_notes = Column(Text, nullable=True)  # what drives the score

    # Thermal effusivity b = √(λ · ρ · cp) in W·s^0.5/(m²·K)
    # Determines perceived warmth/coldness on touch (EN ISO 10456 / ISO 7726).
    # Low b (< 300): feels warm — timber (~230), mineral wool (~15)
    # High b (> 800): feels cold — concrete (~830), steel (~12000)
    # Only meaningful for exposed/interior-facing surfaces.
    thermal_effusivity = Column(Float, nullable=True)

    # Acoustic absorption coefficient αw (weighted, EN ISO 11654)
    # Class A: αw > 0.90  Class B: 0.80–0.90  Class C: 0.60–0.79
    # Class D: 0.30–0.59  Class E: 0.15–0.29  Not classified: < 0.15
    acoustic_absorption_aw = Column(Float, nullable=True)

    # Visible light transmittance (VLT / τ_v) — 0 to 1
    # EN 410:2011. Fraction of visible light transmitted through glazing.
    # Standard clear double: ~0.70–0.75; solar control: ~0.30–0.45; triple: ~0.55–0.65
    # Only meaningful for window_glazing products.
    visible_light_transmittance = Column(Float, nullable=True)

    # Relationships
    properties = relationship("ProductProperty", back_populates="product")

    def __repr__(self):
        return f"<Product {self.manufacturer} {self.name}>"


class ProductProperty(Base):
    """
    Flexible key-value store for product properties not covered
    by the fixed columns. Allows adding dimensions without migrations.
    """
    __tablename__ = "product_properties"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    property_name = Column(String, nullable=False)   # e.g. "water_vapour_diffusion"
    property_value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    source = Column(String, nullable=True)           # "TDS", "DoP", "EPD"

    product = relationship("Product", back_populates="properties")


# ---------------------------------------------------------------------------
# FIRE CLASS HIERARCHY (for deterministic comparison)
# ---------------------------------------------------------------------------

class FireClassRank(Base):
    """
    Euroclass fire classification hierarchy for deterministic comparison.
    Lower rank = better fire performance.
    A1 (rank 1) > A2-s1,d0 (rank 2) > ... > F (rank N)
    """
    __tablename__ = "fire_class_ranks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    euroclass = Column(String, nullable=False, unique=True, index=True)
    rank = Column(Integer, nullable=False)  # 1 = best (A1), higher = worse
    description = Column(String, nullable=True)


# ---------------------------------------------------------------------------
# MATERIAL INCOMPATIBILITY TABLE
# ---------------------------------------------------------------------------

class MaterialIncompatibility(Base):
    """Known material incompatibility pairs."""
    __tablename__ = "material_incompatibilities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    material_class_a = Column(String, nullable=False, index=True)
    material_class_b = Column(String, nullable=False, index=True)
    risk_type = Column(String, nullable=False)        # e.g. "galvanic corrosion"
    severity = Column(String, nullable=False)         # "severe" or "moderate"
    description = Column(Text, nullable=False)
    code_reference = Column(String, nullable=True)


# ---------------------------------------------------------------------------
# FIRM
# ---------------------------------------------------------------------------

class Firm(Base):
    """
    An architecture firm using ræson.
    All users and projects belong to a firm.
    """
    __tablename__ = "firms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)       # uploaded firm logo for PDF
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="firm")
    projects = relationship("Project", back_populates="firm")


# ---------------------------------------------------------------------------
# USER
# ---------------------------------------------------------------------------

class User(Base):
    """
    A user account. Belongs to one firm.
    Auth is handled by Clerk — this table stores profile data only.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    clerk_user_id = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False)
    name = Column(String, nullable=True)
    role = Column(String, default="member")        # "admin" or "member"
    firm_id = Column(Integer, ForeignKey("firms.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    firm = relationship("Firm", back_populates="users")


# ---------------------------------------------------------------------------
# PROJECT
# ---------------------------------------------------------------------------

class Project(Base):
    """
    A construction project. All assessments belong to a project.
    Context set once here — building type, class, climate — never re-entered.
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)              # e.g. "Ørestad Housing Block 4B"
    project_number = Column(String, nullable=True)     # e.g. "2024-087"
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    building_type = Column(String, nullable=True)      # e.g. "etageboliger"
    building_class = Column(String, nullable=True)     # "klasse_1/2/3"
    climate_zone = Column(String, nullable=True)       # "coastal/urban/continental"
    jurisdiction = Column(String, nullable=True)       # "DK", "NL", "SE", "NO", "DE"
    architect_name = Column(String, nullable=True)
    firm_id = Column(Integer, ForeignKey("firms.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    firm = relationship("Firm", back_populates="projects")
    assessments = relationship("AssessmentLog", back_populates="project")


# ---------------------------------------------------------------------------
# ASSESSMENT LOG
# ---------------------------------------------------------------------------

class AssessmentLog(Base):
    """Record of every substitution assessment for audit trail."""
    __tablename__ = "assessment_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String, nullable=False)
    query_text = Column(Text, nullable=False)

    # Project context
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    firm_id = Column(Integer, ForeignKey("firms.id"), nullable=True)

    # Parsed fields
    specified_product = Column(String, nullable=True)
    proposed_product = Column(String, nullable=True)
    building_function = Column(String, nullable=True)
    building_class = Column(String, nullable=True)
    building_element = Column(String, nullable=True)

    # Result
    overall_risk = Column(String, nullable=True)  # pass / conditional / fail
    assessment_json = Column(Text, nullable=True)  # full structured result

    # Decision record — set after architect reviews the assessment
    decision = Column(String, nullable=True)           # "approved", "rejected", "info_requested"
    decision_timestamp = Column(DateTime, nullable=True)
    decision_by = Column(String, nullable=True)        # architect name
    decision_note = Column(Text, nullable=True)        # optional free text

    project = relationship("Project", back_populates="assessments")


# ---------------------------------------------------------------------------
# ENGINE SETUP
# ---------------------------------------------------------------------------

import os

# Production: set DATABASE_URL env var to Postgres connection string
# e.g. postgresql://user:pass@host:5432/raeson
# Local dev: falls back to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///raeson.db")

# SQLAlchemy requires psycopg2 dialect for Postgres
# Railway injects DATABASE_URL as postgres:// — fix for SQLAlchemy 1.4+
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine)


def init_db():
    Base.metadata.create_all(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
