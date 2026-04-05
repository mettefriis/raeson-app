"""
LLM Service — handles the two places where we use Claude:
1. Parsing a free-text substitution query into structured fields
2. Generating the human-readable risk narrative from structured results

The LLM NEVER makes compliance decisions. It translates
between human language and structured data.
"""

import json
import os
from anthropic import Anthropic
from api.models.schemas import SubstitutionRequest


# In production, use env var. For demo, can be set in .env
client = None


def get_client():
    global client
    if client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY not set. Add it to .env or environment."
            )
        client = Anthropic(api_key=api_key)
    return client


PARSE_SYSTEM_PROMPT = """You are a construction specification parser for the Danish and Dutch building markets.

Given a free-text description of a material substitution request, extract the following fields as JSON:

1. specified_product: the originally specified product name (string)
2. proposed_product: the proposed substitute product name (string)
3. building_function: the building use type. Use Dutch Bbl terms for NL projects, or Danish BR25 terms for DK projects.
   Dutch (Bbl): woonfunctie, kantoorfunctie, onderwijsfunctie, gezondheidszorgfunctie, bijeenkomstfunctie, winkelfunctie, industriefunctie, logiesfunctie
   Danish (BR25): etageboliger, enfamiliehuse, rækkehuse, erhverv, institutioner, sommerhuse_under_150, sommerhuse_150_plus
4. building_class: fire safety class. One of: klasse_1, klasse_2, klasse_3. Infer from floors/height if not stated (1-3 floors → klasse_1, 4+ → klasse_2, >70m → klasse_3)
5. building_element: where in the building the material is used. One of: facade_cladding, facade_insulation, roof_insulation, floor_insulation, internal_wall, external_wall, structural_frame, fire_door, window_glazing, load_bearing_wall
6. climate_zone: one of: coastal, urban, continental. Infer from city/location if possible. Coastal: any city within ~20km of the sea. For Denmark: Copenhagen = urban, Aarhus = urban, Esbjerg = coastal, Skagen = coastal. For Netherlands: Amsterdam = urban, Rotterdam = urban, Vlissingen = coastal.
7. br25_typology: if the project is Danish (mentions Denmark, Danish cities, BR25, or Danish building types), set this to the BR25 typology: etageboliger, enfamiliehuse, rækkehuse, erhverv, institutioner, sommerhuse_under_150, sommerhuse_150_plus. Otherwise null.
8. adjacent_materials: list of material classes present in the assembly that could cause compatibility issues. Use: copper, galvanised_steel, zinc, pvc, bitumen, concrete, aluminium, stainless_steel, carbon_steel, eps_insulation, polystyrene. Empty list if none mentioned.

Respond ONLY with a valid JSON object. Set fields to null if they cannot be determined.

Examples:

Input: "Contractor proposes Kingspan Kooltherm K15 instead of Rockwool Frontrock MAX E for facade insulation on a Danish residential apartment building (etageboliger), coastal location, Copenhagen"
Output:
{
  "specified_product": "Rockwool Frontrock MAX E",
  "proposed_product": "Kingspan Kooltherm K15",
  "building_function": "etageboliger",
  "building_class": "klasse_2",
  "building_element": "facade_insulation",
  "climate_zone": "urban",
  "br25_typology": "etageboliger",
  "adjacent_materials": []
}

Input: "Replace Rockwool Duorock with PIR foam insulation on a 3-storey residential block in Rotterdam, zinc cladding on facade"
Output:
{
  "specified_product": "Rockwool Duorock",
  "proposed_product": "PIR foam insulation",
  "building_function": "woonfunctie",
  "building_class": "klasse_1",
  "building_element": "facade_insulation",
  "climate_zone": "urban",
  "br25_typology": null,
  "adjacent_materials": ["zinc"]
}
"""


async def parse_query(query: str) -> dict:
    """
    Parse a free-text substitution query into structured fields.
    Returns a dict with the parsed fields.
    """
    c = get_client()

    message = c.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        system=PARSE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": query}],
    )

    # Extract JSON from response
    response_text = message.content[0].text.strip()

    # Handle potential markdown code blocks
    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
        response_text = response_text.strip()

    return json.loads(response_text)


NARRATIVE_SYSTEM_PROMPT = """You are a construction compliance and design intelligence expert writing substitution assessments for architects in Denmark and the Netherlands.

Given a structured assessment (JSON) covering compliance AND wellbeing dimensions, write a clear, professional narrative.

Dimension types you may encounter:
- fire_reaction, thermal, fire_resistance: code compliance (cite exact §§)
- carbon: embodied carbon — cite EPD source, BR25 § 297 limit if present
- durability: service life in specific climate zone
- biophilic_quality: occupant wellbeing impact (cite Browning et al. 2014)
- acoustic_quality: acoustic absorption change (cite EN ISO 11654)
- thermal_comfort: surface effusivity / perceived warmth (cite ISO 7726)

Rules:
- State the overall verdict and the single most important reason in the first sentence
- For FAIL/CONDITIONAL dimensions: explain consequence in one sentence with numbers and source
- Wellbeing dimensions: frame as consequences for occupants, not abstract metrics
- For carbon: connect to BR25 building limit if present — "this substitution consumes X% of your annual carbon budget per m² of facade"
- Be specific: use the actual values from the assessment data
- Tone: direct, evidence-based, peer-to-peer — these are professionals
- Do NOT summarise passing dimensions unless they're worth noting
- Summary length: 100-150 words maximum
- Recommendations: exactly 3, each a single sentence of max 15 words. Start with a verb. No preamble.

The narrative succeeds if the architect says: "I can see something I couldn't see before."
"""


async def generate_narrative(assessment_data: dict) -> tuple[str, list[str]]:
    """
    Generate a human-readable risk summary and recommendations
    from the structured assessment data.

    Returns (summary_text, list_of_recommendations).
    """
    c = get_client()

    message = c.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=800,
        system=NARRATIVE_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": (
                "Generate a risk narrative and recommendations for this "
                "substitution assessment:\n\n"
                f"{json.dumps(assessment_data, indent=2)}\n\n"
                "Respond with JSON: {\"summary\": \"...\", \"recommendations\": [\"...\"]}"
            )
        }],
    )

    response_text = message.content[0].text.strip()
    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
        response_text = response_text.strip()

    result = json.loads(response_text)
    return result.get("summary", ""), result.get("recommendations", [])
