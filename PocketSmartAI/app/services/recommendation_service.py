from urllib.parse import quote_plus

from app.services.gemini_service import gemini_service, parse_json_response


PLATFORMS = {
    "Amazon": "https://www.amazon.in/s?k={query}",
    "Flipkart": "https://www.flipkart.com/search?q={query}",
    "IKEA": "https://www.ikea.com/in/en/search/?q={query}",
    "Swiggy": "https://www.swiggy.com/search?query={query}",
    "Zomato": "https://www.zomato.com/search?query={query}",
    "OYO": "https://www.oyorooms.com/search?location={query}",
}


def platform_link(platform: str, query: str) -> str:
    template = PLATFORMS.get(platform, PLATFORMS["Amazon"])
    return template.format(query=quote_plus(query))


def home_fallback(data: dict) -> dict:
    budget = data["budget"]
    items = data.get("items") or [{"category": "decor", "quantity": 1, "notes": ""}]
    allocation = round(budget / max(len(items), 1), 2)
    recs = []
    for item in items:
        category = item["category"]
        query = f"{data['room_type']} {category} {data['style']}"
        recs.append({
            "category": category,
            "quantity": item["quantity"],
            "suggestion": f"Budget-friendly {data['style']} {category}",
            "estimated_price": allocation,
            "platform": "Amazon",
            "link": platform_link("Amazon", query),
        })
    return {
        "allocations": {"items": budget},
        "recommendations": recs,
    }


def party_fallback(data: dict) -> dict:
    budget = data["budget"]
    allocations = {
        "food": round(budget * 0.45, 2),
        "decoration": round(budget * 0.20, 2),
        "entertainment": round(budget * 0.15, 2),
        "venue_or_stay": round(budget * 0.20, 2),
    }
    recs = [
        {"category": "food", "suggestion": f"{data['event_type']} catering for {data['guest_count']} guests",
         "estimated_price": allocations["food"], "platform": "Swiggy",
         "link": platform_link("Swiggy", f"{data['event_type']} catering")},
        {"category": "food", "suggestion": f"{data['event_type']} restaurants",
         "estimated_price": allocations["food"], "platform": "Zomato",
         "link": platform_link("Zomato", f"{data['event_type']} restaurant")},
        {"category": "decoration", "suggestion": f"{data['event_type']} decoration package",
         "estimated_price": allocations["decoration"], "platform": "Amazon",
         "link": platform_link("Amazon", f"{data['event_type']} party decoration")},
        {"category": "venue_or_stay", "suggestion": f"Accommodation/venue search near {data.get('city') or 'your city'}",
         "estimated_price": allocations["venue_or_stay"], "platform": "OYO",
         "link": platform_link("OYO", data.get("city") or "India")},
    ]
    return {"allocations": allocations, "recommendations": recs}


def jewelry_fallback(data: dict) -> dict:
    budget = data["budget"]
    query = f"{data['occasion']} {data['style']} jewelry {data.get('outfit_color','')}".strip()
    recs = [
        {"category": "earrings", "suggestion": f"{data['style']} earrings for {data['occasion']}",
         "estimated_price": round(budget * .30, 2), "platform": "Amazon",
         "link": platform_link("Amazon", query + " earrings")},
        {"category": "necklace", "suggestion": f"{data['style']} necklace for {data['occasion']}",
         "estimated_price": round(budget * .45, 2), "platform": "Flipkart",
         "link": platform_link("Flipkart", query + " necklace")},
        {"category": "bracelet", "suggestion": f"Matching bracelet for {data['occasion']}",
         "estimated_price": round(budget * .25, 2), "platform": "Amazon",
         "link": platform_link("Amazon", query + " bracelet")},
    ]
    return {"allocations": {"earrings": .30, "necklace": .45, "bracelet": .25}, "recommendations": recs}


def ai_recommend(planner_type: str, data: dict, image_bytes: bytes | None = None, mime_type: str | None = None):
    fallback = {
        "home": home_fallback,
        "party": party_fallback,
        "jewelry": jewelry_fallback,
    }[planner_type](data)

    prompt = f"""
You are PocketSmart AI, a budget-aware recommendation assistant.
Planner: {planner_type}
User input:
{data}

Return ONLY valid JSON with exactly these keys:
allocations: object
recommendations: array

Each recommendation must contain:
category, suggestion, estimated_price, platform, search_query

Use only these platform names when relevant: Amazon, Flipkart, IKEA, Swiggy, Zomato, OYO.
Do not claim live inventory or exact current product availability.
Keep the total estimated prices within the user's budget.
"""

    raw = gemini_service.generate(prompt, image_bytes=image_bytes, mime_type=mime_type)
    parsed = parse_json_response(raw)
    if not parsed or not isinstance(parsed.get("recommendations"), list):
        return fallback, False

    for rec in parsed["recommendations"]:
        platform = rec.get("platform", "Amazon")
        rec["link"] = platform_link(platform, rec.get("search_query", rec.get("suggestion", "")))
        rec.pop("search_query", None)
    return parsed, True
