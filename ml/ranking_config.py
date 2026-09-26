"""
Recommendation & Hybrid Ranking Configuration
Centralized configuration module for recommendation score blending weights.
"""

from typing import Dict, Any

# -----------------------------------------------------------------------------
# Default Recommendation Feature Weights
# All weights are positive floats and normalized during scoring.
# -----------------------------------------------------------------------------
DEFAULT_RANKING_WEIGHTS: Dict[str, float] = {
    "ml_score": 0.35,          # Collaborative filtering (SVD latent factor dot product)
    "price_match_score": 0.15, # Affiliation with user's preferred min/max/average price
    "category_score": 0.20,    # Affiliation with top interacted categories
    "brand_score": 0.15,       # Affinity with top interacted brands
    "interaction_score": 0.10, # Recency and frequency of direct interaction patterns
    "cart_score": 0.05         # Complementary / affinity match with active cart items
}

# Active runtime weights (can be updated dynamically via API without hardcoding)
_ACTIVE_RANKING_WEIGHTS: Dict[str, float] = DEFAULT_RANKING_WEIGHTS.copy()


def get_ranking_weights() -> Dict[str, float]:
    """Returns a copy of the current active ranking weights."""
    return _ACTIVE_RANKING_WEIGHTS.copy()


def update_ranking_weights(new_weights: Dict[str, float]) -> Dict[str, float]:
    """
    Updates active ranking weights with provided overrides.
    Maintains existing defaults for any unspecified weights.
    """
    global _ACTIVE_RANKING_WEIGHTS
    for key, val in new_weights.items():
        if key in DEFAULT_RANKING_WEIGHTS and isinstance(val, (int, float)) and val >= 0:
            _ACTIVE_RANKING_WEIGHTS[key] = float(val)
    return _ACTIVE_RANKING_WEIGHTS.copy()


def reset_ranking_weights() -> Dict[str, float]:
    """Resets active ranking weights back to defaults."""
    global _ACTIVE_RANKING_WEIGHTS
    _ACTIVE_RANKING_WEIGHTS = DEFAULT_RANKING_WEIGHTS.copy()
    return _ACTIVE_RANKING_WEIGHTS.copy()
