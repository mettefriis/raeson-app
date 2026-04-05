"""
Bbl article texts for the code provision drill-down.

These are simplified/translated excerpts from the
Besluit bouwwerken leefomgeving. In production, you'd
source these from wetten.overheid.nl and keep them
in sync with legislative updates.
"""

CODE_PROVISIONS = {
    "Bbl art. 3.72 lid 1": {
        "article": "Artikel 3.72 lid 1",
        "document": "Besluit bouwwerken leefomgeving (Bbl)",
        "chapter": "Hoofdstuk 3 - Bestaande bouw en nieuwbouw",
        "section": "Afdeling 3.6 - Brandveiligheid",
        "title_nl": "Brandklasse buitenzijde van het bouwwerk",
        "title_en": "Fire class of the exterior side of the building",
        "text_nl": (
            "Een zijde van een constructieonderdeel die grenst aan de "
            "buitenlucht voldoet aan brandklasse D. Dit geldt voor de "
            "buitenste laag en de lagen daaronder tot een diepte van "
            "ten minste 0,013 m."
        ),
        "text_en": (
            "A side of a structural component that borders outdoor air "
            "shall meet fire class D. This applies to the outermost layer "
            "and the layers below it to a depth of at least 0.013 m. "
            "Applicable to low-rise buildings (building class 1)."
        ),
        "applicable_to": "Building class 1 (low-rise)",
        "minimum_fire_class": "D-s2,d2",
        "url": "https://wetten.overheid.nl/BWBR0045212",
    },
    "Bbl art. 3.72 lid 2": {
        "article": "Artikel 3.72 lid 2",
        "document": "Besluit bouwwerken leefomgeving (Bbl)",
        "chapter": "Hoofdstuk 3 - Bestaande bouw en nieuwbouw",
        "section": "Afdeling 3.6 - Brandveiligheid",
        "title_nl": "Brandklasse buitenzijde - hogere gebouwen",
        "title_en": "Fire class of exterior — taller buildings",
        "text_nl": (
            "Voor een woongebouw met een vloer van een verblijfsgebied "
            "hoger dan 7 meter boven het meetniveau geldt voor de "
            "buitenzijde van de gevel brandklasse B. Voor isolatiemateriaal "
            "in de gevelconstructie geldt brandklasse A2."
        ),
        "text_en": (
            "For a residential building with a floor level of a habitable "
            "area higher than 7 metres above the reference level, the "
            "exterior side of the facade shall meet fire class B. "
            "For insulation material within the facade construction, "
            "fire class A2 applies. This is the stricter requirement "
            "for mid-rise and high-rise residential buildings."
        ),
        "applicable_to": "Building class 2 and 3 (mid-rise and high-rise)",
        "minimum_fire_class": "B-s2,d0 (cladding), A2-s1,d0 (insulation)",
        "url": "https://wetten.overheid.nl/BWBR0045212",
    },
    "Bbl art. 3.72 lid 3": {
        "article": "Artikel 3.72 lid 3",
        "document": "Besluit bouwwerken leefomgeving (Bbl)",
        "chapter": "Hoofdstuk 3 - Bestaande bouw en nieuwbouw",
        "section": "Afdeling 3.6 - Brandveiligheid",
        "title_nl": "Brandklasse wanden in beschermde vluchtroutes",
        "title_en": "Fire class of walls in protected escape routes",
        "text_nl": (
            "De binnenoppervlakken van wanden en plafonds in een "
            "besloten gang of trappenhuis die deel uitmaakt van een "
            "extra beschermde vluchtroute voldoen aan brandklasse B-s1,d0."
        ),
        "text_en": (
            "The interior surfaces of walls and ceilings in an enclosed "
            "corridor or stairwell that forms part of an additionally "
            "protected escape route shall meet fire class B-s1,d0."
        ),
        "applicable_to": "All building classes — protected escape routes",
        "minimum_fire_class": "B-s1,d0",
        "url": "https://wetten.overheid.nl/BWBR0045212",
    },
    "Bbl art. 3.41, tabel 3.20": {
        "article": "Artikel 3.41, Tabel 3.20",
        "document": "Besluit bouwwerken leefomgeving (Bbl)",
        "chapter": "Hoofdstuk 3 - Bestaande bouw en nieuwbouw",
        "section": "Afdeling 3.5 - Energiezuinigheid en milieu",
        "title_nl": "Thermische isolatie - nieuwbouw",
        "title_en": "Thermal insulation — new construction",
        "text_nl": (
            "De warmteweerstand (Rc) van een uitwendige "
            "scheidingsconstructie van een verblijfsgebied is ten minste "
            "de waarde uit tabel 3.20. Voor gevels: Rc >= 4,7 m2K/W. "
            "Voor daken: Rc >= 6,3 m2K/W. "
            "Voor vloeren: Rc >= 3,7 m2K/W."
        ),
        "text_en": (
            "The thermal resistance (Rc) of an external separation "
            "construction of a habitable area shall be at least the value "
            "from table 3.20. For facades/walls: Rc >= 4.7 m2K/W. "
            "For roofs: Rc >= 6.3 m2K/W. For floors: Rc >= 3.7 m2K/W. "
            "These values apply to new construction (nieuwbouw)."
        ),
        "applicable_to": "All new construction",
        "values": {
            "facade/wall": "Rc >= 4.7 m2K/W",
            "roof": "Rc >= 6.3 m2K/W",
            "floor": "Rc >= 3.7 m2K/W",
        },
        "url": "https://wetten.overheid.nl/BWBR0045212",
    },
    "Bbl art. 3.41": {
        "article": "Artikel 3.41",
        "document": "Besluit bouwwerken leefomgeving (Bbl)",
        "chapter": "Hoofdstuk 3 - Bestaande bouw en nieuwbouw",
        "section": "Afdeling 3.5 - Energiezuinigheid en milieu",
        "title_nl": "Thermische isolatie - algemeen",
        "title_en": "Thermal insulation — general provisions",
        "text_nl": (
            "Een uitwendige scheidingsconstructie van een verblijfsgebied "
            "heeft een warmteweerstand die ten minste voldoet aan de "
            "in tabel 3.20 gegeven waarden. De warmtedoorgangscoefficient "
            "(U-waarde) van ramen en deuren is ten hoogste 1,65 W/(m2K)."
        ),
        "text_en": (
            "An external separation construction of a habitable area "
            "shall have a thermal resistance that meets at least the "
            "values given in table 3.20. The thermal transmittance "
            "(U-value) of windows and doors shall not exceed "
            "1.65 W/(m2K)."
        ),
        "applicable_to": "All new construction — windows and doors",
        "url": "https://wetten.overheid.nl/BWBR0045212",
    },
    "Bbl art. 3.58 lid 1": {
        "article": "Artikel 3.58 lid 1",
        "document": "Besluit bouwwerken leefomgeving (Bbl)",
        "chapter": "Hoofdstuk 3 - Bestaande bouw en nieuwbouw",
        "section": "Afdeling 3.6 - Brandveiligheid",
        "title_nl": "Brandwerendheid scheidingsconstructies",
        "title_en": "Fire resistance of separation constructions",
        "text_nl": (
            "Een inwendige scheidingsconstructie van een "
            "brandcompartiment heeft een brandwerendheid van ten minste "
            "30 minuten (EI 30). Dit geldt voor wanden, deuren en "
            "andere openingen in de scheiding."
        ),
        "text_en": (
            "An internal separation construction of a fire compartment "
            "shall have a fire resistance of at least 30 minutes (EI 30). "
            "This applies to walls, doors, and other openings in the "
            "separation. Fire doors in residential buildings (class 2) "
            "must achieve at minimum EI1 30."
        ),
        "applicable_to": "All fire compartment boundaries",
        "minimum_fire_resistance": "EI 30 (30 minutes)",
        "url": "https://wetten.overheid.nl/BWBR0045212",
    },
    "NEN 1068, bijlage A": {
        "article": "NEN 1068, Bijlage A",
        "document": "NEN 1068 - Thermische isolatie van gebouwen",
        "chapter": "Bijlage A - Rekenwaarden",
        "section": "A.1 - Warmtegeleidingscoefficienten",
        "title_nl": "Rekenwaarden warmtegeleiding",
        "title_en": "Design values for thermal conductivity",
        "text_nl": (
            "De rekenwaarde van de warmtegeleidingscoefficient (lambda) "
            "wordt bepaald volgens de in deze bijlage opgenomen methoden. "
            "De opgegeven lambda-waarde mag niet hoger zijn dan de "
            "gedeclareerde waarde uit de productcertificering."
        ),
        "text_en": (
            "The design value of the thermal conductivity coefficient "
            "(lambda) shall be determined according to the methods "
            "specified in this annex. The declared lambda value from "
            "product certification is used as the basis for thermal "
            "calculations."
        ),
        "applicable_to": "All thermal insulation calculations",
        "url": "https://www.nen.nl/nen-1068-2023-nl-308706",
    },
}


def get_provision(code_reference: str) -> dict | None:
    """Look up a code provision by its reference string."""
    return CODE_PROVISIONS.get(code_reference)


def get_all_provisions() -> dict:
    """Return all code provisions."""
    return CODE_PROVISIONS
