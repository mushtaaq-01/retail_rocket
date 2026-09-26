"""
Voice Assistant Natural Language & Intent Engine
Processes spoken user queries and synthesizes personalized responses from live behavioral metrics and hybrid recommendations.
"""

import re
from typing import Dict, Any, List, Optional


def detect_voice_intent(query: str) -> str:
    """
    Classifies user voice query into actionable intent categories.
    """
    q = (query or "").lower().strip()

    if any(k in q for k in ["cart", "bag", "items in cart", "products in my cart", "added to cart", "my cart"]):
        return "CART_INQUIRY"

    if any(k in q for k in ["under", "below", "cheaper", "affordable", "budget options", "under my usual", "lower price"]):
        return "UNDER_USUAL_PRICE"

    if any(k in q for k in ["preferred price", "price range", "my budget", "usual price", "average price", "how much do i spend"]):
        return "PRICE_PREFERENCE"

    if any(k in q for k in ["which category", "what category", "category do i", "categories", "favorite category", "top category"]):
        return "TOP_CATEGORY"

    if any(k in q for k in ["which brand", "what brand", "brand do i", "brands", "favorite brand", "top brand"]):
        return "TOP_BRAND"

    if any(k in q for k in ["why did you", "why recommend", "reason", "why this product", "how was this chosen"]):
        return "RECOMMEND_REASON"

    if any(k in q for k in ["what i viewed", "recently viewed", "viewed products", "history", "browsing history", "recent interaction"]):
        return "RECENT_HISTORY"

    if any(k in q for k in ["recommend", "what should i buy", "what to buy", "suggestions", "show me products", "top products"]):
        return "RECOMMEND_PRODUCTS"

    return "GENERAL_ASSISTANT"


def generate_voice_assistant_response(
    visitor_id: str,
    query: str,
    user_pref: Dict[str, Any],
    recommendations: List[Dict[str, Any]],
    cart_items: List[Dict[str, Any]],
    catalog: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generates a natural, data-grounded conversational response for the voice assistant.
    """
    intent = detect_voice_intent(query)
    spoken_text = ""
    highlight_data: Dict[str, Any] = {}

    pref_min = int(user_pref.get("preferredPriceMin", 5000))
    pref_max = int(user_pref.get("preferredPriceMax", 50000))
    pref_avg = int(user_pref.get("averagePrice", 25000))
    price_bracket = user_pref.get("topPriceRange", "Mid-Range")
    top_cat = user_pref.get("topCategory", "Consumer Retail")
    top_brand = user_pref.get("topBrand", "Popular Brands")
    top_categories = user_pref.get("topCategories", [])
    top_brands = user_pref.get("topBrands", [])
    recent_events = user_pref.get("recentInteractions", [])

    if intent == "CART_INQUIRY":
        if not cart_items:
            spoken_text = f"Your shopping cart is currently empty. You can browse the Product Discovery section to explore recommendations."
            highlight_data = { "cart_count": 0, "subtotal": 0 }
        else:
            total_qty = sum(item.get("quantity", 1) for item in cart_items)
            subtotal = sum((item.get("numeric_price") or item.get("numericPrice") or 0.0) * item.get("quantity", 1) for item in cart_items)
            item_summary = ", ".join([f"{item.get('name')} (qty {item.get('quantity', 1)})" for item in cart_items[:3]])
            spoken_text = f"You currently have {total_qty} items in your cart totaling ₹{int(subtotal):,}. Items include: {item_summary}."
            highlight_data = { "cart_count": total_qty, "subtotal": subtotal, "items": cart_items }

    elif intent == "PRICE_PREFERENCE":
        spoken_text = f"Your preferred shopping price bracket is {price_bracket}, typically ranging from ₹{pref_min:,} to ₹{pref_max:,}, with an average viewed price of ₹{pref_avg:,}."
        highlight_data = { "min": pref_min, "max": pref_max, "avg": pref_avg, "bracket": price_bracket }

    elif intent == "TOP_CATEGORY":
        if top_categories:
            cat1 = top_categories[0]
            cat2_text = f", followed by {top_categories[1]['category']}" if len(top_categories) > 1 else ""
            spoken_text = f"You explore {cat1['category']} the most, representing {cat1['percentage']}% of your category interactions{cat2_text}."
        else:
            spoken_text = f"Your top category focus is {top_cat}, based on your browsing history."
        highlight_data = { "top_category": top_cat, "categories": top_categories }

    elif intent == "TOP_BRAND":
        if top_brands:
            br1 = top_brands[0]
            br2_text = f", followed by {top_brands[1]['brand']}" if len(top_brands) > 1 else ""
            spoken_text = f"You interact most frequently with {br1['brand']}, accounting for {br1['percentage']}% of your brand engagement{br2_text}."
        else:
            spoken_text = f"You show high affinity for {top_brand} products."
        highlight_data = { "top_brand": top_brand, "brands": top_brands }

    elif intent == "RECOMMEND_REASON":
        if recommendations:
            top_rec = recommendations[0]
            reason = top_rec.get("reason", "it strongly aligns with your browsing activity and collaborative ML score")
            spoken_text = f"Our top recommendation is {top_rec.get('name')} priced at {top_rec.get('price')}. It was recommended because {reason}."
            highlight_data = { "recommended_product": top_rec }
        else:
            spoken_text = f"Recommendations are generated by blending collaborative filtering SVD latent factors with your price, category, and brand affinities."

    elif intent == "UNDER_USUAL_PRICE":
        # Filter products under user average price
        under_price_recs = [r for r in recommendations if (r.get("numeric_price") or 0) <= pref_avg]
        if not under_price_recs:
            # Fallback to catalog
            under_price_recs = [
                {"name": meta["name"], "price": meta["price"]}
                for pid, meta in catalog.items()
                if int(str(meta.get("price", "0")).replace("₹", "").replace(",", "").strip() or 0) <= pref_avg
            ][:3]

        if under_price_recs:
            items_str = ", ".join([f"{p.get('name')} at {p.get('price')}" for p in under_price_recs[:3]])
            spoken_text = f"Here are great options below your average viewed price of ₹{pref_avg:,}: {items_str}."
            highlight_data = { "under_price_products": under_price_recs }
        else:
            spoken_text = f"Your average price is ₹{pref_avg:,}. I can help you filter products in the discovery catalog."

    elif intent == "RECENT_HISTORY":
        if recent_events:
            events_summary = ", ".join([ev.get("product_name", "product") for ev in recent_events[:3]])
            spoken_text = f"Recently, you engaged with: {events_summary}. Your recent actions carry higher weight in real-time recommendations."
            highlight_data = { "recent_events": recent_events[:5] }
        else:
            spoken_text = f"You have {user_pref.get('interactionCount', 0)} logged interactions shaping your recommendation profile."

    else: # RECOMMEND_PRODUCTS or GENERAL_ASSISTANT
        if recommendations:
            top_3 = recommendations[:3]
            summary_list = []
            for r in top_3:
                summary_list.append(f"{r.get('name')} for {r.get('price')}")
            spoken_text = f"Based on your shopping behavior and AI ranking, I recommend: {', '.join(summary_list)}. These items match your preferred categories and price range."
            highlight_data = { "recommendations": top_3 }
        else:
            spoken_text = f"Hello! I am your AI Shopping Assistant for Shopper #{visitorId}. Ask me about your recommendations, preferred price range, top categories, or cart items."

    return {
        "visitor_id": str(visitor_id),
        "query": query,
        "intent": intent,
        "spoken_response": spoken_text,
        "speech_text": spoken_text,
        "data": highlight_data
    }
