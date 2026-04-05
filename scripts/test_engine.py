"""
Test the compliance engine against key demo scenarios.
Run: python scripts/test_engine.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.models.database import SessionLocal, Product
from api.services.compliance_engine import ComplianceEngine


def test_scenario(db, engine, label, spec_name, prop_name, function, cls, element):
    print(f"\n{'='*60}")
    print(f"SCENARIO: {label}")
    print(f"  {spec_name} → {prop_name}")
    print(f"  {function} / {cls} / {element}")
    print(f"{'='*60}")

    specified = db.query(Product).filter(Product.name.ilike(f"%{spec_name}%")).first()
    proposed = db.query(Product).filter(Product.name.ilike(f"%{prop_name}%")).first()

    if not specified:
        print(f"  ERROR: Could not find specified product '{spec_name}'")
        return
    if not proposed:
        print(f"  ERROR: Could not find proposed product '{prop_name}'")
        return

    print(f"  Specified: {specified.name} (fire: {specified.fire_euroclass}, λ: {specified.lambda_value})")
    print(f"  Proposed:  {proposed.name} (fire: {proposed.fire_euroclass}, λ: {proposed.lambda_value})")

    results = engine.assess(function, cls, element, specified, proposed)
    overall = ComplianceEngine.overall_verdict(results)

    print(f"\n  OVERALL: {overall.value.upper()}")
    for r in results:
        icon = {"pass": "✓", "conditional": "?", "fail": "✗"}[r.verdict.value]
        print(f"  {icon} {r.dimension}: {r.verdict.value}")
        print(f"    Req: {r.requirement}")
        print(f"    Specified: {r.specified_value} → Proposed: {r.proposed_value}")
        print(f"    {r.delta}")
        print(f"    Ref: {r.code_reference}")


def main():
    db = SessionLocal()
    engine = ComplianceEngine(db)

    # Scenario 1: Mineral wool → phenolic foam (fire downgrade)
    test_scenario(db, engine,
        "Facade insulation: mineral wool → phenolic foam",
        "Rockwool Duorock", "Kingspan Kooltherm K15",
        "woonfunctie", "klasse_2", "facade_insulation"
    )

    # Scenario 2: HPL → fiber cement cladding (fire upgrade)
    test_scenario(db, engine,
        "Facade cladding: HPL → fiber cement (upgrade)",
        "Trespa Meteon", "Equitone",
        "woonfunctie", "klasse_2", "facade_cladding"
    )

    # Scenario 3: HPL → timber cladding (fire downgrade, likely fail)
    test_scenario(db, engine,
        "Facade cladding: HPL → timber (downgrade)",
        "Trespa Meteon", "Prodema ProdEX",
        "woonfunctie", "klasse_2", "facade_cladding"
    )

    # Scenario 4: Triple → double glazing (thermal downgrade)
    test_scenario(db, engine,
        "Glazing: triple → double (thermal downgrade)",
        "AGC iplus Top", "Pilkington Suncool",
        "woonfunctie", "klasse_2", "window_glazing"
    )

    # Scenario 5: Aluminium fire door → timber fire door
    test_scenario(db, engine,
        "Fire door: aluminium → timber (same EI30)",
        "Schuco ADS 80 FR 30", "Swedoor JW Fire EI30",
        "woonfunctie", "klasse_2", "fire_door"
    )

    db.close()


if __name__ == "__main__":
    main()
