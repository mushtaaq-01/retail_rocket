"""
Hybrid Recommendation & Ranking Engine
Combines Collaborative Filtering (SVD ML score) with User Behavioral Preference Signals.
All component scores are normalized to [0.0, 1.0] before weighted aggregation.
"""

from typing import Dict, Any, List, Optional, Set
import numpy as np
from ml.ranking_config import get_ranking_weights


def extract_numeric_price(price_val: Any) -> float:
    """Extracts a float price value from various representations."""
    if isinstance(price_val, (int, float)):
        return float(price_val)
    if isinstance(price_val, str):
        clean = price_val.replace("₹", "").replace(",", "").strip()
        try:
            return float(clean)
        except ValueError:
            return 0.0
    return 0.0


def compute_price_match_score(price: float, user_pref: Dict[str, Any]) -> float:
    """
    Computes normalized price affinity score [0.0, 1.0].
    Rewards items within the user's preferred range and close to the weighted average price.
    """
    if price <= 0:
        return 0.5  # Neutral default

    p_min = float(user_pref.get("preferredPriceMin") or 500.0)
    p_max = float(user_pref.get("preferredPriceMax") or 50000.0)
    p_avg = float(user_pref.get("averagePrice") or 15000.0)

    # Ensure valid bounds
    if p_min > p_max:
        p_min, p_max = p_max, p_min
    if p_max <= 0:
        p_max = 50000.0

    # Case 1: Inside preferred range
    if p_min <= price <= p_max:
        diff_ratio = abs(price - p_avg) / max(p_avg, 1.0)
        score = 1.0 - min(0.30, diff_ratio * 0.30)
        return float(np.clip(score, 0.70, 1.0))

    # Case 2: Below minimum price (budget friendly, mild penalty)
    elif price < p_min:
        distance = (p_min - price) / max(p_min, 1.0)
        score = max(0.2, 0.75 - distance * 0.4)
        return float(np.clip(score, 0.2, 0.75))

    # Case 3: Above maximum price
    else:
        distance = (price - p_max) / max(p_max, 1.0)
        score = max(0.1, 0.65 - distance * 0.5)
        return float(np.clip(score, 0.1, 0.65))


def compute_category_score(product_category: str, user_pref: Dict[str, Any]) -> float:
    """
    Computes normalized category preference score [0.0, 1.0].
    """
    if not product_category:
        return 0.1

    top_categories = user_pref.get("topCategories") or []
    if not top_categories:
        return 0.5  # Baseline when cold-start

    clean_prod_cat = product_category.lower().strip()
    prod_tokens = set(clean_prod_cat.replace("&", " ").replace("/", " ").replace("-", " ").split())
    
    # Synonym expansions
    synonyms = {
        "shoes": {"footwear", "shoes", "sneakers", "running", "apparel"},
        "footwear": {"footwear", "shoes", "sneakers", "running", "apparel"},
        "apparel": {"footwear", "shoes", "sneakers", "running", "apparel"},
        "audio": {"audio", "electronics", "headphones", "earbuds", "speaker"},
        "electronics": {"audio", "electronics", "headphones", "earbuds", "speaker"},
        "wearables": {"wearable", "wearables", "smartwatch", "watch", "fitness", "tech"},
        "wearable": {"wearable", "wearables", "smartwatch", "watch", "fitness", "tech"},
        "accessories": {"accessories", "computer", "mouse", "keyboard", "monitor"},
        "bags": {"bags", "bag", "travel", "backpack", "rucksack"},
        "travel": {"bags", "bag", "travel", "backpack", "rucksack"},
        "laptops": {"tablets", "laptops", "laptop", "tablet", "kindle"},
        "tablets": {"tablets", "laptops", "laptop", "tablet", "kindle"}
    }

    for rank, cat_obj in enumerate(top_categories[:5]):
        cat_name = (cat_obj.get("category") or "").lower().strip()
        cat_tokens = set(cat_name.replace("&", " ").replace("/", " ").replace("-", " ").split())

        # Check exact or substring match
        matched = clean_prod_cat == cat_name or clean_prod_cat in cat_name or cat_name in clean_prod_cat

        # Check token intersection
        if not matched and (prod_tokens & cat_tokens):
            matched = True

        # Check synonym intersection
        if not matched:
            for pt in prod_tokens:
                syns = synonyms.get(pt, set())
                if syns & cat_tokens:
                    matched = True
                    break

        if matched:
            rank_score = max(0.50, 1.0 - (rank * 0.12))
            percentage = float(cat_obj.get("percentage") or 50.0) / 100.0
            return float(np.clip(0.5 * rank_score + 0.5 * percentage, 0.5, 1.0))

    return 0.05  # Non-matching category



def compute_brand_score(product_brand: str, product_name: str, user_pref: Dict[str, Any]) -> float:
    """
    Computes normalized brand affinity score [0.0, 1.0].
    """
    top_brands = user_pref.get("topBrands") or []
    if not top_brands:
        return 0.5  # Neutral baseline

    prod_text = f"{product_brand or ''} {product_name or ''}".lower()

    for rank, br_obj in enumerate(top_brands[:5]):
        br_name = (br_obj.get("brand") or "").lower().strip()
        if br_name and (br_name in prod_text or prod_text in br_name):
            rank_score = max(0.50, 1.0 - (rank * 0.12))
            percentage = float(br_obj.get("percentage") or 50.0) / 100.0
            return float(np.clip(0.5 * rank_score + 0.5 * percentage, 0.5, 1.0))

    return 0.10  # Unseen brand baseline


def compute_interaction_score(
    product_id: str,
    product_category: str,
    user_pref: Dict[str, Any]
) -> float:
    """
    Computes interaction affinity based on whether user has viewed/clicked similar products or items.
    """
    top_products = user_pref.get("topProducts") or []
    pid_str = str(product_id)

    for p in top_products:
        if str(p.get("product_id")) == pid_str:
            return 1.0  # Exact product high interest

    # Secondary check on category interactions
    recent_events = user_pref.get("recentInteractions") or []
    for ev in recent_events[:5]:
        if ev.get("category") and product_category and ev.get("category").lower() == product_category.lower():
            return 0.85

    return 0.20  # Standard exploratory baseline


def compute_cart_score(
    product_category: str,
    product_brand: str,
    cart_items: List[Dict[str, Any]]
) -> float:
    """
    Computes cart relationship score [0.0, 1.0].
    Boosts items that complement or share categories/brands with items currently in the cart.
    """
    if not cart_items:
        return 0.3  # Neutral score when cart is empty

    cart_categories = { (i.get("category") or "").lower() for i in cart_items if i.get("category") }
    cart_brands = { (i.get("brand") or "").lower() for i in cart_items if i.get("brand") }

    prod_cat_lower = (product_category or "").lower()
    prod_brand_lower = (product_brand or "").lower()

    if prod_cat_lower and prod_cat_lower in cart_categories and prod_brand_lower and prod_brand_lower in cart_brands:
        return 1.0
    if prod_cat_lower and prod_cat_lower in cart_categories:
        return 0.88
    if prod_brand_lower and prod_brand_lower in cart_brands:
        return 0.75

    return 0.25


def generate_recommendation_reason(
    scores: Dict[str, float],
    meta: Dict[str, Any],
    user_pref: Dict[str, Any]
) -> str:
    """
    Generates a personalized, human-readable reason string based on the dominant feature scores.
    """
    category = meta.get("category") or "your favorite category"
    raw_brand = meta.get("brand") or ""
    prod_name = meta.get("name") or ""
    
    # Resolve specific brand name
    brand = raw_brand
    if not brand or brand == "RetailBrand":
        for known in ["Nike", "Apple", "Sony", "Bose", "Adidas", "Logitech", "Samsung", "Herschel", "Puma", "Dell", "LG", "Fitbit", "Noise", "Amazfit", "Wildcraft", "Canon", "Keychron", "Realme", "JBL"]:
            if known.lower() in prod_name.lower():
                brand = known
                break
        if not brand or brand == "RetailBrand":
            top_b = (user_pref.get("topBrands") or [{}])[0].get("brand")
            brand = top_b or "this brand"

    price_range = user_pref.get("topPriceRange") or "budget"

    # Evaluate strongest contributing feature
    if scores.get("cart_score", 0) >= 0.80:
        return f"Complements items in your cart from {category}."

    if scores.get("category_score", 0) >= 0.60 and scores.get("brand_score", 0) >= 0.60:
        return f"Based on your interest in {category} and {brand} products."

    if scores.get("brand_score", 0) >= 0.65:
        return f"Matches your preferred brand {brand}."

    if scores.get("category_score", 0) >= 0.60:
        return f"You frequently explore {category}."

    if scores.get("interaction_score", 0) >= 0.85:
        return f"Recommended based on your recent activity with {brand}."

    if scores.get("price_match_score", 0) >= 0.80:
        return f"Fits your preferred {price_range} price tier."

    if scores.get("ml_score", 0) >= 0.75:
        return "Highly ranked by collaborative filtering from shoppers with similar behavior."

    return "Personalized recommendation matching your browsing activity."


def compute_hybrid_recommendations(
    visitor_id: str,
    candidate_items: List[str],
    raw_ml_scores: Dict[str, float],
    user_pref: Dict[str, Any],
    cart_items: List[Dict[str, Any]],
    catalog: Dict[str, Dict[str, Any]],
    weight_overrides: Optional[Dict[str, float]] = None,
    limit: int = 10,
    interacted_item_ids: Optional[Set[str]] = None
) -> List[Dict[str, Any]]:
    """
    Blends Collaborative Filtering ML scores with behavioral preference features.
    Applies progressive personalization stages:
      - 0 interactions: 100% ML / Global ranking
      - 1 interaction: Strong behavioral activation (15% ML, 85% behavior)
      - 2-5 interactions: High behavioral weighting (10% ML, 90% behavior)
      - 6+ interactions: Deep personalized ranking (8% ML, 92% behavior)
    """
    interaction_count = int(user_pref.get("interactionCount", 0))

    if weight_overrides:
        weights = weight_overrides.copy()
    else:
        # Progressive Personalization Staging
        if interaction_count == 0:
            weights = {
                "ml_score": 1.0,
                "price_match_score": 0.0,
                "category_score": 0.0,
                "brand_score": 0.0,
                "interaction_score": 0.0,
                "cart_score": 0.0
            }
        elif interaction_count == 1:
            weights = {
                "ml_score": 0.15,
                "price_match_score": 0.20,
                "category_score": 0.30,
                "brand_score": 0.20,
                "interaction_score": 0.10,
                "cart_score": 0.05
            }
        elif interaction_count <= 5:
            weights = {
                "ml_score": 0.10,
                "price_match_score": 0.20,
                "category_score": 0.30,
                "brand_score": 0.20,
                "interaction_score": 0.12,
                "cart_score": 0.08
            }
        else:
            weights = {
                "ml_score": 0.08,
                "price_match_score": 0.18,
                "category_score": 0.30,
                "brand_score": 0.22,
                "interaction_score": 0.12,
                "cart_score": 0.10
            }

    # Step 1: Normalize raw ML scores across candidates to [0.0, 1.0]
    valid_ml_scores = [raw_ml_scores[item_id] for item_id in candidate_items if item_id in raw_ml_scores]
    if valid_ml_scores:
        min_ml = min(valid_ml_scores)
        max_ml = max(valid_ml_scores)
        denom_ml = max(1e-6, max_ml - min_ml)
    else:
        min_ml, denom_ml = 0.0, 1.0

    total_weight = sum(weights.values()) or 1.0

    scored_candidates = []

    for item_id in candidate_items:
        str_id = str(item_id)

        meta = catalog.get(str_id, {})
        prod_name = meta.get("name", f"Product #{str_id}")
        prod_cat = meta.get("category", "General")
        prod_brand = meta.get("brand", "RetailBrand")
        numeric_price = extract_numeric_price(meta.get("numericPrice") or meta.get("price", "0"))

        # 1. ML Score (Normalized)
        raw_ml = raw_ml_scores.get(str_id, 0.0)
        norm_ml_score = float(np.clip((raw_ml - min_ml) / denom_ml, 0.0, 1.0))

        # 2. Price Match Score [0.0, 1.0]
        price_match_score = compute_price_match_score(numeric_price, user_pref)

        # 3. Category Score [0.0, 1.0]
        category_score = compute_category_score(prod_cat, user_pref)

        # 4. Brand Score [0.0, 1.0]
        brand_score = compute_brand_score(prod_brand, prod_name, user_pref)

        # 5. Interaction Score [0.0, 1.0]
        interaction_score = compute_interaction_score(str_id, prod_cat, user_pref)

        # 6. Cart Relationship Score [0.0, 1.0]
        cart_score = compute_cart_score(prod_cat, prod_brand, cart_items)

        # Weighted Linear Combination
        combined_score = (
            weights.get("ml_score", 0.10) * norm_ml_score
            + weights.get("price_match_score", 0.20) * price_match_score
            + weights.get("category_score", 0.30) * category_score
            + weights.get("brand_score", 0.20) * brand_score
            + weights.get("interaction_score", 0.12) * interaction_score
            + weights.get("cart_score", 0.08) * cart_score
        ) / total_weight

        component_scores = {
            "ml_score": round(norm_ml_score, 4),
            "raw_ml_score": round(float(raw_ml), 6),
            "price_match_score": round(price_match_score, 4),
            "category_score": round(category_score, 4),
            "brand_score": round(brand_score, 4),
            "interaction_score": round(interaction_score, 4),
            "cart_score": round(cart_score, 4)
        }

        reason = generate_recommendation_reason(
            scores=component_scores,
            meta={"category": prod_cat, "brand": prod_brand, "name": prod_name},
            user_pref=user_pref
        )

        scored_candidates.append({
            "item_id": str_id,
            "name": prod_name,
            "category": prod_cat,
            "brand": prod_brand,
            "price": meta.get("price", f"₹{int(numeric_price):,}"),
            "numeric_price": numeric_price,
            "image": meta.get("image", ""),
            "score": round(float(combined_score), 4),
            "ranking_score": round(float(combined_score), 4),
            **component_scores,
            "reason": reason
        })

    # Sort descending by combined ranking score
    scored_candidates.sort(key=lambda x: x["ranking_score"], reverse=True)

    # Assign sequential ranks
    final_recommendations = []
    for rank_idx, item in enumerate(scored_candidates[:limit]):
        item["rank"] = rank_idx + 1
        final_recommendations.append(item)

    return final_recommendations
