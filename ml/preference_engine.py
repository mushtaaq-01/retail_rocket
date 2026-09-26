"""
User Behavioral Preference Aggregation Layer
Calculates dynamic user shopping preferences using weighted interactions and time-decay.
"""

import math
import time
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

# -----------------------------------------------------------------------------
# Configurable Interaction Weights & Decay Parameters
# -----------------------------------------------------------------------------
DEFAULT_WEIGHTS = {
    "product_view": 1.0,
    "view": 1.0,
    "product_click": 2.0,
    "category_view": 2.0,
    "brand_view": 2.0,
    "search": 3.0,
    "filter": 3.0,
    "share": 4.0,
    "wishlist": 5.0,
    "add_to_cart": 7.0,
    "addtocart": 7.0,
    "purchase": 10.0,
    "transaction": 10.0
}

# Half-life decay constant in days (lambda)
DEFAULT_HALF_LIFE_DAYS = 7.0
LAMBDA_DECAY = math.log(2) / DEFAULT_HALF_LIFE_DAYS


def compute_time_decay(timestamp_ms: float, reference_time_ms: float) -> float:
    """
    Computes exponential time decay factor: e^(-lambda * delta_days).
    Recent events have decay close to 1.0; older events decay smoothly.
    """
    if not timestamp_ms or not reference_time_ms:
        return 1.0
    
    diff_ms = max(0.0, reference_time_ms - timestamp_ms)
    diff_days = diff_ms / (1000.0 * 60.0 * 60.0 * 24.0)
    
    # Bound decay between 0.15 and 1.0 so older events still retain baseline signal
    decay = math.exp(-LAMBDA_DECAY * diff_days)
    return max(0.15, min(1.0, decay))


def aggregate_user_preferences(
    visitor_id: str,
    raw_events: List[Dict[str, Any]],
    catalog: Dict[str, Dict[str, Any]],
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Aggregates user interactions into an expressive behavioral preference profile.
    """
    active_weights = weights or DEFAULT_WEIGHTS
    
    if not raw_events:
        # Default baseline profile when no interaction history is available
        return {
            "visitor_id": str(visitor_id),
            "preferredPriceMin": 5000.0,
            "preferredPriceMax": 50000.0,
            "averagePrice": 25000.0,
            "topPriceRange": "₹10,000 - ₹30,000",
            "topCategory": "Consumer Retail",
            "topBrand": "Popular Brands",
            "topCategories": [],
            "topBrands": [],
            "topProducts": [],
            "cartProducts": [],
            "interactionCount": 0,
            "recentInteractions": [],
            "updated_at": int(time.time() * 1000)
        }

    # Reference time is the latest timestamp in the user's interaction stream or current time
    timestamps = [e.get("timestamp", 0) for e in raw_events if e.get("timestamp")]
    ref_time = max(timestamps) if timestamps else (time.time() * 1000)

    category_scores: Dict[str, float] = {}
    brand_scores: Dict[str, float] = {}
    product_scores: Dict[str, float] = {}
    product_counts: Dict[str, int] = {}
    cart_product_ids = set()
    interacted_prices: List[float] = []
    price_weights: List[float] = []
    
    recent_events_list = []

    for event in raw_events:
        event_type = event.get("event") or event.get("interaction_type") or "product_view"
        base_weight = active_weights.get(event_type, 1.0)
        
        event_time = event.get("timestamp") or ref_time
        decay = compute_time_decay(event_time, ref_time)
        effective_weight = base_weight * decay

        item_id = str(event.get("itemid") or event.get("product_id") or "")
        product_meta = catalog.get(item_id) if item_id else None

        # Resolve category & brand
        category = event.get("category") or (product_meta.get("category") if product_meta else None)
        brand = event.get("brand") or (product_meta.get("brand") if product_meta else None)
        
        # Price resolution
        price_val = event.get("price_at_interaction")
        if price_val is None and product_meta:
            clean_p = str(product_meta.get("price", "0")).replace("₹", "").replace(",", "").strip()
            try:
                price_val = float(product_meta.get("numericPrice") or clean_p or 0.0)
            except ValueError:
                price_val = 0.0

        if price_val and price_val > 0:
            interacted_prices.append(price_val)
            price_weights.append(effective_weight)

        # Accumulate Category Scores
        if category:
            category_scores[category] = category_scores.get(category, 0.0) + effective_weight

        # Accumulate Brand Scores
        if brand:
            brand_scores[brand] = brand_scores.get(brand, 0.0) + effective_weight

        # Accumulate Product Scores
        if item_id:
            product_scores[item_id] = product_scores.get(item_id, 0.0) + effective_weight
            product_counts[item_id] = product_counts.get(item_id, 0) + 1
            if event_type in ["add_to_cart", "addtocart"]:
                cart_product_ids.add(item_id)

        # Record recent timeline entry
        event_meta = event.get("metadata") or {}
        prod_name_fallback = event_meta.get("product_name", f"Item #{item_id}") if isinstance(event_meta, dict) else f"Item #{item_id}"
        recent_events_list.append({
            "product_id": item_id,
            "product_name": product_meta.get("name", f"Product #{item_id}") if product_meta else prod_name_fallback,
            "interaction_type": event_type,
            "category": category,
            "brand": brand,
            "timestamp": event_time,
            "effective_weight": round(effective_weight, 2)
        })

    # Sort recent events descending by time
    recent_events_list.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_interactions = recent_events_list[:10]

    # Compute Price Statistics
    if interacted_prices:
        min_price = float(np.min(interacted_prices))
        max_price = float(np.max(interacted_prices))
        # Weighted average price
        if sum(price_weights) > 0:
            avg_price = float(np.average(interacted_prices, weights=price_weights))
        else:
            avg_price = float(np.mean(interacted_prices))
    else:
        min_price, max_price, avg_price = 5000.0, 50000.0, 25000.0

    # Categorize into Dominant Price Bracket
    if avg_price < 15000:
        top_price_range = "Budget (Under ₹15,000)"
    elif avg_price <= 40000:
        top_price_range = "Mid-Range (₹15,000 - ₹40,000)"
    elif avg_price <= 100000:
        top_price_range = "Premium (₹40,000 - ₹1,00,000)"
    else:
        top_price_range = "Flagship (Above ₹1,00,000)"

    # Format Top Categories with percentage shares
    total_cat_weight = sum(category_scores.values()) or 1.0
    sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    top_categories = [
        {
            "category": cat,
            "score": round(score, 2),
            "percentage": round((score / total_cat_weight) * 100, 1)
        }
        for cat, score in sorted_categories[:5]
    ]

    # Format Top Brands with percentage shares
    total_brand_weight = sum(brand_scores.values()) or 1.0
    sorted_brands = sorted(brand_scores.items(), key=lambda x: x[1], reverse=True)
    top_brands = [
        {
            "brand": br,
            "score": round(score, 2),
            "percentage": round((score / total_brand_weight) * 100, 1)
        }
        for br, score in sorted_brands[:5]
    ]

    # Format Top Interacted Products
    sorted_products = sorted(product_scores.items(), key=lambda x: x[1], reverse=True)
    top_products = []
    for pid, score in sorted_products[:5]:
        p_meta = catalog.get(pid, {})
        top_products.append({
            "product_id": pid,
            "name": p_meta.get("name", f"Product #{pid}"),
            "category": p_meta.get("category", "General"),
            "brand": p_meta.get("brand", "RetailBrand"),
            "price": p_meta.get("price", "₹9,999"),
            "image": p_meta.get("image", ""),
            "views_count": product_counts.get(pid, 1),
            "score": round(score, 2)
        })

    # Format Cart Products
    cart_products = []
    for pid in cart_product_ids:
        p_meta = catalog.get(pid, {})
        cart_products.append({
            "product_id": pid,
            "name": p_meta.get("name", f"Product #{pid}"),
            "category": p_meta.get("category", "General"),
            "brand": p_meta.get("brand", "RetailBrand"),
            "price": p_meta.get("price", "₹9,999"),
            "image": p_meta.get("image", "")
        })

    top_category_name = top_categories[0]["category"] if top_categories else "Consumer Retail"
    top_brand_name = top_brands[0]["brand"] if top_brands else "Popular Brands"

    return {
        "visitor_id": str(visitor_id),
        "preferredPriceMin": round(min_price, 2),
        "preferredPriceMax": round(max_price, 2),
        "averagePrice": round(avg_price, 2),
        "topPriceRange": top_price_range,
        "topCategory": top_category_name,
        "topBrand": top_brand_name,
        "topCategories": top_categories,
        "topBrands": top_brands,
        "topProducts": top_products,
        "cartProducts": cart_products,
        "interactionCount": len(raw_events),
        "recentInteractions": recent_interactions,
        "updated_at": int(time.time() * 1000)
    }
