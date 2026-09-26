import random
import time
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np

from ml.preference_engine import aggregate_user_preferences, DEFAULT_WEIGHTS
from ml.ranking_config import (
    DEFAULT_RANKING_WEIGHTS,
    get_ranking_weights,
    update_ranking_weights,
    reset_ranking_weights
)
from ml.hybrid_ranker import compute_hybrid_recommendations
from ml.voice_assistant_engine import generate_voice_assistant_response, detect_voice_intent
from ml.db import (
    test_supabase_connection,
    set_db_credentials,
    is_db_configured,
    save_interaction_to_db,
    save_user_preferences_to_db,
    create_or_upsert_profile_in_db
)

import os
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI(
    title="Retail AI Recommendation API",
    description="RetailRocket Product Recommendation System",
    version="1.0.0"
)

# Strip /api prefix middleware so endpoints work both with /api and without /api (for Vercel serverless)
class StripPrefixMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.scope.get("path", "")
        if path.startswith("/api/"):
            request.scope["path"] = path[4:]
        elif path == "/api":
            request.scope["path"] = "/"
        return await call_next(request)

app.add_middleware(StripPrefixMiddleware)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "recommendation_model.joblib")

model_data = joblib.load(MODEL_PATH)

# In-memory store for real-time behavior tracking events
recorded_interactions: List[Dict[str, Any]] = []
# In-memory store for calculated user behavioral preferences
user_preferences_store: Dict[str, Dict[str, Any]] = {}
# In-memory store / audit log for generated recommendations
recommendations_store: Dict[str, List[Dict[str, Any]]] = {}


class InteractionEvent(BaseModel):
    user_id: Optional[str] = None
    product_id: Optional[str] = None
    interaction_type: str
    session_id: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    price_at_interaction: Optional[float] = None
    quantity: Optional[int] = 1
    timestamp: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class PreferenceComputePayload(BaseModel):
    weights: Optional[Dict[str, float]] = None


class RankingWeightsPayload(BaseModel):
    weights: Dict[str, float]


class CustomRecommendPayload(BaseModel):
    limit: Optional[int] = 10
    weights: Optional[Dict[str, float]] = None


class VoiceQueryPayload(BaseModel):
    visitor_id: str
    query: str


class DBConfigPayload(BaseModel):
    url: str
    key: str


class UserProfilePayload(BaseModel):
    user_id: str
    email: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None






user_latent = model_data["user_latent"]
item_latent = model_data["item_latent"]
user_to_index = model_data["user_to_index"]
index_to_item = model_data["index_to_item"]
interactions = model_data["interactions"]

# Product Metadata Catalog (Prices in Indian Rupees ₹)
PRODUCT_CATALOG = {
    # ---------------------------------------------------------------------------
    # 1. Footwear & Apparel (Budget: ₹2k-4k, Mid: ₹4k-11k, Flagship: ₹12k-20k)
    # ---------------------------------------------------------------------------
    "60002": {
        "name": "Nike Revolution 6 Running Shoes",
        "category": "Footwear & Apparel",
        "brand": "Nike",
        "price": "₹3,695",
        "numericPrice": 3695,
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80"
    },
    "60003": {
        "name": "Puma Smash v2 Leather Sneakers",
        "category": "Footwear & Apparel",
        "brand": "Puma",
        "price": "₹2,799",
        "numericPrice": 2799,
        "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&auto=format&fit=crop&q=80"
    },
    "60004": {
        "name": "Adidas Strutter Classic Shoes",
        "category": "Footwear & Apparel",
        "brand": "Adidas",
        "price": "₹3,999",
        "numericPrice": 3999,
        "image": "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=500&auto=format&fit=crop&q=80"
    },
    "60001": {
        "name": "Nike Air Zoom Pegasus 39",
        "category": "Footwear & Apparel",
        "brand": "Nike",
        "price": "₹10,495",
        "numericPrice": 10495,
        "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80"
    },
    "60005": {
        "name": "Adidas Ultraboost Light Running Shoes",
        "category": "Footwear & Apparel",
        "brand": "Adidas",
        "price": "₹9,999",
        "numericPrice": 9999,
        "image": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&auto=format&fit=crop&q=80"
    },
    "215503": {
        "name": "Nike Air Max 270 Sport Running Shoes",
        "category": "Footwear & Apparel",
        "brand": "Nike",
        "price": "₹12,995",
        "numericPrice": 12995,
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80"
    },
    "60006": {
        "name": "Nike Vaporfly 3 Elite Marathon Shoes",
        "category": "Footwear & Apparel",
        "brand": "Nike",
        "price": "₹19,995",
        "numericPrice": 19995,
        "image": "https://images.unsplash.com/photo-1512374382149-233c42b661ac?w=500&auto=format&fit=crop&q=80"
    },

    # ---------------------------------------------------------------------------
    # 2. Audio & Electronics (Budget: ₹1.4k-5k, Mid: ₹14k-20k, Flagship: ₹30k-36k)
    # ---------------------------------------------------------------------------
    "48010": {
        "name": "Sony MDR-ZX110 Wired On-Ear Headphones",
        "category": "Audio & Electronics",
        "brand": "Sony",
        "price": "₹1,490",
        "numericPrice": 1490,
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80"
    },
    "48011": {
        "name": "JBL Wave Buds True Wireless Earbuds",
        "category": "Audio & Electronics",
        "brand": "JBL",
        "price": "₹2,999",
        "numericPrice": 2999,
        "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80"
    },
    "48012": {
        "name": "Realme Buds Air 5 Pro ANC Earbuds",
        "category": "Audio & Electronics",
        "brand": "Realme",
        "price": "₹4,999",
        "numericPrice": 4999,
        "image": "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500&auto=format&fit=crop&q=80"
    },
    "9877": {
        "name": "JBL Charge 5 Portable Bluetooth Speaker",
        "category": "Audio & Electronics",
        "brand": "JBL",
        "price": "₹14,999",
        "numericPrice": 14999,
        "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=80"
    },
    "148103": {
        "name": "Sony WF-1000XM5 True Wireless Earbuds",
        "category": "Audio & Electronics",
        "brand": "Sony",
        "price": "₹19,990",
        "numericPrice": 19990,
        "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80"
    },
    "48030": {
        "name": "Sony WH-1000XM5 Wireless Headphones",
        "category": "Audio & Electronics",
        "brand": "Sony",
        "price": "₹29,990",
        "numericPrice": 29990,
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80"
    },
    "24059": {
        "name": "Bose QuietComfort Ultra Headphones",
        "category": "Audio & Electronics",
        "brand": "Bose",
        "price": "₹35,900",
        "numericPrice": 35900,
        "image": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80"
    },

    # ---------------------------------------------------------------------------
    # 3. Computer Accessories & Displays (Budget: ₹399-3k, Mid: ₹8k-12k, Flagship: ₹49k-58k)
    # ---------------------------------------------------------------------------
    "291810": {
        "name": "Logitech B100 Optical USB Mouse",
        "category": "Computer Accessories",
        "brand": "Logitech",
        "price": "₹399",
        "numericPrice": 399,
        "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80"
    },
    "310910": {
        "name": "Redragon K552 RGB Mechanical Keyboard",
        "category": "Computer Accessories",
        "brand": "Redragon",
        "price": "₹2,799",
        "numericPrice": 2799,
        "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80"
    },
    "291877": {
        "name": "Logitech MX Master 3S Wireless Mouse",
        "category": "Computer Accessories",
        "brand": "Logitech",
        "price": "₹8,995",
        "numericPrice": 8995,
        "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80"
    },
    "310944": {
        "name": "Keychron K2 Mechanical Wireless Keyboard",
        "category": "Computer Accessories",
        "brand": "Keychron",
        "price": "₹9,499",
        "numericPrice": 9499,
        "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80"
    },
    "255908": {
        "name": "Dell UltraSharp 27 4K USB-C Monitor",
        "category": "Computer Accessories",
        "brand": "Dell",
        "price": "₹49,990",
        "numericPrice": 49990,
        "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80"
    },
    "255910": {
        "name": "LG 34-inch Curved UltraWide WQHD Monitor",
        "category": "Computer Accessories",
        "brand": "LG",
        "price": "₹58,900",
        "numericPrice": 58900,
        "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80"
    },

    # ---------------------------------------------------------------------------
    # 4. Wearable Tech & Smartwatches (Budget: ₹2.9k-4k, Mid: ₹14k-22k, Flagship: ₹41k-89k)
    # ---------------------------------------------------------------------------
    "89310": {
        "name": "Noise ColorFit Pro 5 Smartwatch",
        "category": "Wearable Tech",
        "brand": "Noise",
        "price": "₹2,999",
        "numericPrice": 2999,
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80"
    },
    "89311": {
        "name": "Amazfit Bip 5 Bluetooth Calling Watch",
        "category": "Wearable Tech",
        "brand": "Amazfit",
        "price": "₹3,999",
        "numericPrice": 3999,
        "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=80"
    },
    "89312": {
        "name": "Fitbit Charge 6 Fitness Tracker",
        "category": "Wearable Tech",
        "brand": "Fitbit",
        "price": "₹14,999",
        "numericPrice": 14999,
        "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=80"
    },
    "89313": {
        "name": "Samsung Galaxy Watch 6 LTE",
        "category": "Wearable Tech",
        "brand": "Samsung",
        "price": "₹21,999",
        "numericPrice": 21999,
        "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=80"
    },
    "89323": {
        "name": "Apple Watch Series 9 Smartwatch",
        "category": "Wearable Tech",
        "brand": "Apple",
        "price": "₹41,900",
        "numericPrice": 41900,
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80"
    },
    "89325": {
        "name": "Apple Watch Ultra 2 Titanium GPS",
        "category": "Wearable Tech",
        "brand": "Apple",
        "price": "₹89,900",
        "numericPrice": 89900,
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80"
    },

    # ---------------------------------------------------------------------------
    # 5. Bags & Travel Gear (Budget: ₹1.6k-2.5k, Mid: ₹5.9k-6.5k, Flagship: ₹28k-42k)
    # ---------------------------------------------------------------------------
    "228610": {
        "name": "American Tourister Casual 28L Backpack",
        "category": "Bags & Travel",
        "brand": "American Tourister",
        "price": "₹1,699",
        "numericPrice": 1699,
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"
    },
    "228611": {
        "name": "Wildcraft 35L Adventure Hiking Rucksack",
        "category": "Bags & Travel",
        "brand": "Wildcraft",
        "price": "₹2,499",
        "numericPrice": 2499,
        "image": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500&auto=format&fit=crop&q=80"
    },
    "228644": {
        "name": "Herschel Supply Co. Everyday Backpack",
        "category": "Bags & Travel",
        "brand": "Herschel",
        "price": "₹6,499",
        "numericPrice": 6499,
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"
    },
    "228613": {
        "name": "Peak Design Everyday Backpack 30L v2",
        "category": "Bags & Travel",
        "brand": "Peak Design",
        "price": "₹28,500",
        "numericPrice": 28500,
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"
    },

    # ---------------------------------------------------------------------------
    # 6. Laptops, Tablets & Cameras (Budget: ₹14k, Mid: ₹1.08L, Flagship: ₹2.15L-2.49L)
    # ---------------------------------------------------------------------------
    "347226": {
        "name": "Kindle Paperwhite Signature Edition",
        "category": "Tablets & Laptops",
        "brand": "Amazon Kindle",
        "price": "₹14,999",
        "numericPrice": 14999,
        "image": "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=500&auto=format&fit=crop&q=80"
    },
    "279531": {
        "name": "Anker 737 Power Bank 24,000mAh",
        "category": "Mobile Accessories",
        "brand": "Anker",
        "price": "₹11,999",
        "numericPrice": 11999,
        "image": "https://images.unsplash.com/photo-1609592424079-24751433f81e?w=500&auto=format&fit=crop&q=80"
    },
    "65273": {
        "name": "Samsung Galaxy Tab S9 Ultra",
        "category": "Tablets & Laptops",
        "brand": "Samsung",
        "price": "₹1,08,999",
        "numericPrice": 108999,
        "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=80"
    },
    "166306": {
        "name": "Canon EOS R6 Mark II Mirrorless Camera",
        "category": "Cameras & Optics",
        "brand": "Canon",
        "price": "₹2,15,995",
        "numericPrice": 215995,
        "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80"
    },
    "294676": {
        "name": "Apple MacBook Pro 16-inch M3 Max",
        "category": "Tablets & Laptops",
        "brand": "Apple",
        "price": "₹2,49,900",
        "numericPrice": 249900,
        "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=80"
    }
}

DEFAULT_PRODUCTS = [
    {
        "name": "Pro Wireless Smart Headphones",
        "category": "Audio Electronics",
        "price": "₹14,999",
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80"
    },
    {
        "name": "Ultra Fitness Smartwatch",
        "category": "Wearables",
        "price": "₹19,999",
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80"
    },
    {
        "name": "Ergonomic Urban Backpack",
        "category": "Travel & Bags",
        "price": "₹6,999",
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"
    }
]


def get_product_meta(item_id: str):
    str_id = str(item_id)
    if str_id in PRODUCT_CATALOG:
        return PRODUCT_CATALOG[str_id]
    
    hash_idx = abs(hash(str_id)) % len(DEFAULT_PRODUCTS)
    fallback = DEFAULT_PRODUCTS[hash_idx].copy()
    fallback["name"] = f"{fallback['name']} #{str_id}"
    return fallback


@app.get("/")
def home():
    return {
        "message": "Retail AI Recommendation API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "users": len(user_to_index),
        "products": len(index_to_item),
        "interactions": len(interactions)
    }


@app.get("/products")
def get_products(category: str = None, brand: str = None, q: str = None):
    results = []
    for item_id, item in PRODUCT_CATALOG.items():
        if category and category.lower() != "all" and item["category"].lower() != category.lower():
            continue
        if brand and brand.lower() != "all" and brand.lower() not in item["name"].lower():
            continue
        if q:
            query = q.lower()
            if query not in item["name"].lower() and query not in item["category"].lower():
                continue
        
        results.append({
            "id": item_id,
            "item_id": item_id,
            **item
        })
    return {"products": results, "total": len(results)}


@app.post("/interactions")
@app.post("/track")
def record_interaction(event: InteractionEvent):
    event_dict = event.dict()
    if not event_dict.get("timestamp"):
        event_dict["timestamp"] = int(time.time() * 1000)
    
    recorded_interactions.append(event_dict)
    
    # Keep last 5,000 interactions in buffer
    if len(recorded_interactions) > 5000:
        recorded_interactions.pop(0)

    return {
        "status": "success",
        "message": "Behavior interaction logged successfully",
        "event_id": len(recorded_interactions),
        "interaction_type": event.interaction_type
    }


@app.get("/interactions")
def get_interactions(user_id: Optional[str] = None, limit: int = 50):
    if user_id:
        filtered = [i for i in recorded_interactions if i.get("user_id") == str(user_id)]
        return {"interactions": filtered[-limit:], "total": len(filtered)}
    return {"interactions": recorded_interactions[-limit:], "total": len(recorded_interactions)}


# -----------------------------
# CART PERSISTENCE LAYER
# -----------------------------
user_carts: Dict[str, Dict[str, Dict[str, Any]]] = {}


class CartItemPayload(BaseModel):
    product_id: str
    quantity: int = 1
    price_at_addition: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


@app.get("/cart/{user_id}")
def get_user_cart(user_id: str):
    uid = str(user_id)
    user_cart = user_carts.get(uid, {})
    items = list(user_cart.values())
    subtotal = sum((item.get("numeric_price") or 0.0) * item.get("quantity", 1) for item in items)
    return {
        "user_id": uid,
        "items": items,
        "total_items": sum(item.get("quantity", 1) for item in items),
        "subtotal": subtotal
    }


@app.post("/cart/{user_id}")
def add_to_user_cart(user_id: str, payload: CartItemPayload):
    uid = str(user_id)
    pid = str(payload.product_id)
    
    if uid not in user_carts:
        user_carts[uid] = {}
        
    product_meta = get_product_meta(pid)
    clean_price_str = str(product_meta.get("price", "0")).replace("₹", "").replace(",", "").strip()
    try:
        numeric_price = float(product_meta.get("numericPrice") or clean_price_str or 0.0)
    except ValueError:
        numeric_price = 0.0
    
    if pid in user_carts[uid]:
        user_carts[uid][pid]["quantity"] += payload.quantity
        user_carts[uid][pid]["updated_at"] = int(time.time() * 1000)
    else:
        user_carts[uid][pid] = {
            "id": pid,
            "product_id": pid,
            "user_id": uid,
            "name": product_meta.get("name"),
            "category": product_meta.get("category"),
            "brand": product_meta.get("brand", "RetailBrand"),
            "price": product_meta.get("price"),
            "numeric_price": numeric_price,
            "numericPrice": numeric_price,
            "image": product_meta.get("image"),
            "quantity": payload.quantity,
            "created_at": int(time.time() * 1000),
            "updated_at": int(time.time() * 1000)
        }
        
    return {
        "status": "success",
        "message": "Cart updated",
        "items": list(user_carts[uid].values()),
        "total_items": sum(item.get("quantity", 1) for item in user_carts[uid].values())
    }


@app.put("/cart/{user_id}/{product_id}")
def update_user_cart_item(user_id: str, product_id: str, quantity: int = 1):
    uid = str(user_id)
    pid = str(product_id)
    if uid in user_carts and pid in user_carts[uid]:
        if quantity <= 0:
            del user_carts[uid][pid]
        else:
            user_carts[uid][pid]["quantity"] = quantity
            user_carts[uid][pid]["updated_at"] = int(time.time() * 1000)
    return {
        "status": "success",
        "items": list(user_carts.get(uid, {}).values()),
        "total_items": sum(item.get("quantity", 1) for item in user_carts.get(uid, {}).values())
    }


@app.delete("/cart/{user_id}/{product_id}")
def remove_from_user_cart(user_id: str, product_id: str):
    uid = str(user_id)
    pid = str(product_id)
    if uid in user_carts and pid in user_carts[uid]:
        del user_carts[uid][pid]
    return {
        "status": "success",
        "items": list(user_carts.get(uid, {}).values()),
        "total_items": sum(item.get("quantity", 1) for item in user_carts.get(uid, {}).values())
    }


@app.delete("/cart/{user_id}")
def clear_user_cart(user_id: str):
    uid = str(user_id)
    user_carts[uid] = {}
    return {"status": "success", "items": [], "total_items": 0}




@app.get("/users/sample")
@app.get("/visitors/sample")
def sample_visitor():
    visitor_ids = list(user_to_index.keys())
    if not visitor_ids:
        raise HTTPException(status_code=404, detail="No visitors available")
    return {"visitor_id": random.choice(visitor_ids)}


def get_user_raw_ml_scores(visitor_id: str):
    """
    Computes collaborative filtering ML scores for a user.
    If the user exists in the SVD matrix, uses their latent factor vector.
    For new / cold-start users, uses the global average latent user vector.
    """
    vid_str = str(visitor_id)
    if vid_str in user_to_index:
        user_index = user_to_index[vid_str]
        scores = np.dot(item_latent, user_latent[user_index])
    else:
        mean_user_latent = np.mean(user_latent, axis=0)
        scores = np.dot(item_latent, mean_user_latent)

    raw_ml_scores = {
        str(index_to_item[i]): float(scores[i])
        for i in range(len(index_to_item))
    }
    median_score = float(np.median(scores)) if len(scores) > 0 else 0.5
    for catalog_id in PRODUCT_CATALOG.keys():
        if catalog_id not in raw_ml_scores:
            raw_ml_scores[catalog_id] = median_score

    candidate_items = list(dict.fromkeys([str(index_to_item[i]) for i in range(len(index_to_item))] + list(PRODUCT_CATALOG.keys())))
    return raw_ml_scores, candidate_items



@app.get("/user/{visitor_id}/stats")
def user_stats(visitor_id: str):
    visitor_id = str(visitor_id)
    events = get_combined_user_interactions(visitor_id)
    total_interactions = len(events)
    
    views = sum(1 for e in events if e.get("interaction_type") in ["product_view", "view", "product_click"]) or max(1, total_interactions)
    add_to_cart = sum(1 for e in events if e.get("interaction_type") in ["add_to_cart", "addtocart"])
    transactions = sum(1 for e in events if e.get("interaction_type") in ["transaction", "purchase"])
    interaction_score = round(float(views * 1.0 + add_to_cart * 3.0 + transactions * 5.0), 1)

    return {
        "visitor_id": visitor_id,
        "views": views,
        "add_to_cart": add_to_cart,
        "transactions": transactions,
        "interaction_score": interaction_score
    }


@app.get("/user/{visitor_id}/history")
def user_history(visitor_id: str):
    visitor_id = str(visitor_id)
    events = get_combined_user_interactions(visitor_id)
    total_interactions = len(events)
    views = max(1, total_interactions)
    add_to_cart = max(0, total_interactions // 3)
    transactions = max(0, total_interactions // 6)

    history = [
        {"date": "Apr 10", "views": max(1, views // 4), "add_to_cart": max(0, add_to_cart // 4), "transactions": max(0, transactions // 4)},
        {"date": "Apr 11", "views": max(2, views // 3), "add_to_cart": max(0, add_to_cart // 3), "transactions": max(0, transactions // 3)},
        {"date": "Apr 12", "views": max(1, views // 5), "add_to_cart": max(0, add_to_cart // 5), "transactions": 0},
        {"date": "Apr 13", "views": max(3, views // 2), "add_to_cart": max(1, add_to_cart // 2), "transactions": max(0, transactions // 2)},
        {"date": "Apr 14", "views": max(2, views // 3), "add_to_cart": max(0, add_to_cart // 3), "transactions": 0},
        {"date": "Apr 15", "views": max(1, views // 4), "add_to_cart": max(0, add_to_cart // 4), "transactions": max(0, transactions // 4)},
        {"date": "Apr 16", "views": max(2, views // 2), "add_to_cart": max(1, add_to_cart // 2), "transactions": max(0, transactions // 2)},
    ]

    return {
        "visitor_id": visitor_id,
        "history": history
    }


@app.get("/recommend/{visitor_id}")
def recommend(visitor_id: str, limit: int = 10):
    visitor_id = str(visitor_id)

    if limit < 1 or limit > 50:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 50"
        )

    # 1. Existing Collaborative Filtering ML (SVD latent factor dot product)
    raw_ml_scores, candidate_items = get_user_raw_ml_scores(visitor_id)

    # 2. Historical & recorded interacted items
    interacted_events = get_combined_user_interactions(visitor_id)
    interacted_items = {
        str(e.get("product_id") or e.get("itemid"))
        for e in interacted_events
        if e.get("product_id") or e.get("itemid")
    }

    # 3. Dynamic User Preferences (aggregated with time-decay)
    user_pref = get_user_preferences(visitor_id)

    # 4. User Cart Items
    cart_items = list(user_carts.get(visitor_id, {}).values())

    # 5. Hybrid Combined Scoring
    hybrid_recommendations = compute_hybrid_recommendations(
        visitor_id=visitor_id,
        candidate_items=candidate_items,
        raw_ml_scores=raw_ml_scores,
        user_pref=user_pref,
        cart_items=cart_items,
        catalog=PRODUCT_CATALOG,
        limit=limit,
        interacted_item_ids=interacted_items
    )

    # Persist in recommendation cache / audit store
    recommendations_store[visitor_id] = hybrid_recommendations

    return {
        "visitor_id": visitor_id,
        "recommendations": hybrid_recommendations,
        "active_weights": get_ranking_weights(),
        "total": len(hybrid_recommendations)
    }


@app.post("/recommend/{visitor_id}/custom")
def custom_recommend(visitor_id: str, payload: CustomRecommendPayload):
    """
    Computes recommendations on-the-fly with custom ranking weight overrides.
    """
    visitor_id = str(visitor_id)
    limit = payload.limit or 10

    raw_ml_scores, candidate_items = get_user_raw_ml_scores(visitor_id)

    interacted_events = get_combined_user_interactions(visitor_id)
    interacted_items = {
        str(e.get("product_id") or e.get("itemid"))
        for e in interacted_events
        if e.get("product_id") or e.get("itemid")
    }

    user_pref = get_user_preferences(visitor_id)
    cart_items = list(user_carts.get(visitor_id, {}).values())

    hybrid_recommendations = compute_hybrid_recommendations(
        visitor_id=visitor_id,
        candidate_items=candidate_items,
        raw_ml_scores=raw_ml_scores,
        user_pref=user_pref,
        cart_items=cart_items,
        catalog=PRODUCT_CATALOG,
        weight_overrides=payload.weights,
        limit=limit,
        interacted_item_ids=interacted_items
    )

    return {
        "visitor_id": visitor_id,
        "recommendations": hybrid_recommendations,
        "weights": payload.weights or get_ranking_weights()
    }


@app.get("/recommend/weights")
def get_active_ranking_weights():
    """
    Returns current ranking feature weights.
    """
    return {
        "weights": get_ranking_weights(),
        "defaults": DEFAULT_RANKING_WEIGHTS,
        "description": "Normalized linear combination weights for recommendation ranking."
    }


@app.post("/recommend/weights")
def set_active_ranking_weights(payload: RankingWeightsPayload):
    """
    Updates global active ranking weights.
    """
    updated = update_ranking_weights(payload.weights)
    return {
        "status": "success",
        "message": "Ranking weights updated successfully",
        "weights": updated
    }



# -----------------------------------------------------------------------------
# USER BEHAVIORAL PREFERENCE AGGREGATION LAYER
# -----------------------------------------------------------------------------

def get_combined_user_interactions(visitor_id: str) -> List[Dict[str, Any]]:
    """
    Gathers all interactions for a user from both historical SVD dataset
    and the real-time interaction log.
    """
    vid_str = str(visitor_id)
    all_events: List[Dict[str, Any]] = []

    # 1. Historical dataset interactions
    try:
        user_rows = interactions[interactions["visitorid"].astype(str) == vid_str]
        for _, row in user_rows.iterrows():
            item_id = str(row.get("itemid", ""))
            event_name = str(row.get("event", "view"))
            # Map dataset event types
            event_type = "product_view" if event_name == "view" else ("add_to_cart" if event_name == "addtocart" else event_name)
            all_events.append({
                "product_id": item_id,
                "itemid": item_id,
                "interaction_type": event_type,
                "timestamp": int(row.get("timestamp", time.time() * 1000)),
                "metadata": {}
            })
    except Exception as e:
        print(f"Error querying historical interactions for {vid_str}: {e}")

    # 2. Real-time captured interactions
    for item in recorded_interactions:
        if str(item.get("user_id")) == vid_str or str(item.get("session_id")) == vid_str:
            all_events.append(item)

    return all_events


@app.get("/user/{visitor_id}/preferences")
def get_user_preferences(visitor_id: str):
    """
    Computes and returns the dynamic behavioral preference profile for the given user.
    Uses time-decay and interaction weights across all captured history.
    """
    vid_str = str(visitor_id)
    events = get_combined_user_interactions(vid_str)
    
    preferences = aggregate_user_preferences(
        visitor_id=vid_str,
        raw_events=events,
        catalog=PRODUCT_CATALOG,
        weights=DEFAULT_WEIGHTS
    )
    
    # Cache / Persist in memory
    user_preferences_store[vid_str] = preferences
    return preferences


@app.post("/user/{visitor_id}/preferences/compute")
def compute_user_preferences(visitor_id: str, payload: Optional[PreferenceComputePayload] = None):
    """
    Recomputes preferences on-demand with optional custom weights.
    """
    vid_str = str(visitor_id)
    events = get_combined_user_interactions(vid_str)
    custom_weights = payload.weights if payload else None
    
    preferences = aggregate_user_preferences(
        visitor_id=vid_str,
        raw_events=events,
        catalog=PRODUCT_CATALOG,
        weights=custom_weights
    )
    
    user_preferences_store[vid_str] = preferences
    return {
        "status": "success",
        "message": "User preferences recomputed successfully",
        "preferences": preferences
    }


@app.get("/preferences/weights")
def get_preference_weights():
    """
    Returns the active configurable interaction weights and decay parameters.
    """
    return {
        "weights": DEFAULT_WEIGHTS,
        "half_life_days": 7.0,
        "description": "Configurable interaction event weights and exponential time-decay half life."
    }


# -----------------------------------------------------------------------------
# VOICE ASSISTANT CONVERSATIONAL RECOMMENDATION LAYER
# -----------------------------------------------------------------------------

@app.post("/voice/query")
def handle_voice_query(payload: VoiceQueryPayload):
    """
    Handles natural language voice queries regarding personalized recommendations,
    shopping preferences, cart state, price bounds, and explainability factors.
    """
    vid = str(payload.visitor_id).strip()
    query = str(payload.query).strip()

    if not query:
        raise HTTPException(status_code=400, detail="Query string cannot be empty")

    # 1. Fetch user preferences
    user_pref = get_user_preferences(vid)

    # 2. Fetch or compute hybrid recommendations using the shared recommendation service
    user_cart = list(user_carts.get(vid, {}).values())
    recommendations = recommendations_store.get(vid)

    if not recommendations:
        raw_ml_scores, candidate_items = get_user_raw_ml_scores(vid)
        interacted_events = get_combined_user_interactions(vid)
        interacted_items = {
            str(e.get("product_id") or e.get("itemid"))
            for e in interacted_events
            if e.get("product_id") or e.get("itemid")
        }
        recommendations = compute_hybrid_recommendations(
            visitor_id=vid,
            candidate_items=candidate_items,
            raw_ml_scores=raw_ml_scores,
            user_pref=user_pref,
            cart_items=user_cart,
            catalog=PRODUCT_CATALOG,
            limit=10,
            interacted_item_ids=interacted_items
        )
        recommendations_store[vid] = recommendations

    # 3. Synthesize natural language voice response grounded in calculated data
    response_obj = generate_voice_assistant_response(
        visitor_id=vid,
        query=query,
        user_pref=user_pref,
        recommendations=recommendations or [],
        cart_items=user_cart,
        catalog=PRODUCT_CATALOG
    )

    return response_obj


# -----------------------------------------------------------------------------
# USER IDENTITY & PROFILE PERSISTENCE LAYER
# -----------------------------------------------------------------------------

@app.post("/user/profile")
def create_or_update_user_profile(payload: UserProfilePayload):
    """
    Persists a new user profile / identity in Supabase database and initializes their session.
    """
    uid = str(payload.user_id).strip()
    if not uid:
        raise HTTPException(status_code=400, detail="User ID is required")

    # Save to database
    db_res = create_or_upsert_profile_in_db(
        user_id=uid,
        email=payload.email,
        metadata=payload.metadata
    )

    # Initialize empty cart if not already present
    if uid not in user_carts:
        user_carts[uid] = {}

    return {
        "status": "success",
        "message": f"User profile for {uid} registered in Supabase",
        "user_id": uid,
        "email": payload.email or f"{uid}@retailrocket.ai",
        "db_sync": db_res
    }


# -----------------------------------------------------------------------------
# DATABASE CONNECTION & DIAGNOSTICS LAYER
# -----------------------------------------------------------------------------

@app.get("/db/status")
def get_database_status():
    """
    Returns live connection and health status of the Supabase database.
    """
    return test_supabase_connection()


@app.post("/db/configure")
def configure_database(payload: DBConfigPayload):
    """
    Updates the Supabase URL and API Key at runtime.
    """
    set_db_credentials(payload.url, payload.key)
    res = test_supabase_connection()
    return {
        "status": "success",
        "message": "Database credentials updated",
        "diagnostics": res
    }


@app.post("/db/test-connection")
def test_db():
    """
    Tests live query against the configured database.
    """
    return test_supabase_connection()



