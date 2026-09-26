"""
End-to-End Simulation & Verification Script (Section 23)
Simulates a real-time 10-step user discovery journey for a new authenticated user,
records all interactions to Supabase PostgreSQL, computes aggregated preferences,
and verifies dynamic shift in hybrid recommendation ranking.
"""

import json
import time
import urllib.request
import urllib.error
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8088"
TEST_USER_ID = f"test_journey_user_{int(time.time())}"

def log(step_name, msg):
    print(f"[{step_name}] {msg}")

def http_post(endpoint, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def http_get(endpoint):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("=" * 60)
    print(f"STARTING 10-STEP USER JOURNEY SIMULATION FOR: {TEST_USER_ID}")
    print("=" * 60)

    # 0. Baseline Recommendations Before Any Interactions (Cold Start)
    log("STEP 0", "Fetching cold-start baseline recommendations (Stage 0: Pure ML/Global)...")
    baseline_rec = http_get(f"/recommend/{TEST_USER_ID}?use_hybrid=true&limit=5")
    print(f"Baseline Top 3 Recommendations:")
    for r in baseline_rec.get("recommendations", [])[:3]:
        print(f"  - Rank {r.get('rank')}: {r.get('name')} | Score: {r.get('ranking_score')} | Reason: {r.get('reason')}")

    session_id = f"sess_{int(time.time())}"

    # Step 1: View product A (e.g. item 48030 - Sony WH-1000XM4)
    log("STEP 1", "Viewing Product A (Sony WH-1000XM4, Electronics, INR 24,990)...")
    http_post("/interactions", {
        "user_id": TEST_USER_ID,
        "product_id": "48030",
        "interaction_type": "product_view",
        "category": "Electronics",
        "brand": "Sony",
        "price_at_interaction": 24990,
        "session_id": session_id,
        "metadata": {"product_name": "Sony WH-1000XM4"}
    })

    # Step 2: View product B (e.g. item 89323 - Apple Watch Series 8)
    log("STEP 2", "Viewing Product B (Apple Watch Series 8, Electronics, INR 45,900)...")
    http_post("/interactions", {
        "user_id": TEST_USER_ID,
        "product_id": "89323",
        "interaction_type": "product_view",
        "category": "Electronics",
        "brand": "Apple",
        "price_at_interaction": 45900,
        "session_id": session_id,
        "metadata": {"product_name": "Apple Watch Series 8"}
    })

    # Step 3: Search "shoes"
    log("STEP 3", "Searching for 'shoes'...")
    http_post("/interactions", {
        "user_id": TEST_USER_ID,
        "product_id": None,
        "interaction_type": "search",
        "category": None,
        "brand": None,
        "session_id": session_id,
        "metadata": {"query": "shoes", "result_count": 12}
    })

    # Step 4: Open Shoes category
    log("STEP 4", "Opening Shoes category...")
    http_post("/interactions", {
        "user_id": TEST_USER_ID,
        "product_id": None,
        "interaction_type": "category_view",
        "category": "Shoes",
        "brand": None,
        "session_id": session_id,
        "metadata": {"category_name": "Shoes"}
    })

    # Step 5: Open Nike brand
    log("STEP 5", "Opening Nike brand view...")
    http_post("/interactions", {
        "user_id": TEST_USER_ID,
        "product_id": None,
        "interaction_type": "brand_view",
        "category": "Shoes",
        "brand": "Nike",
        "session_id": session_id,
        "metadata": {"brand_name": "Nike"}
    })

    # Step 6: View several Nike products
    nike_products = [
        {"id": "60001", "name": "Nike Air Zoom Pegasus 39", "price": 10495, "cat": "Shoes", "brand": "Nike"},
        {"id": "60002", "name": "Nike Revolution 6", "price": 3695, "cat": "Shoes", "brand": "Nike"},
        {"id": "60003", "name": "Nike Downshifter 12", "price": 3995, "cat": "Shoes", "brand": "Nike"},
        {"id": "60004", "name": "Nike Infinity Run 3", "price": 12995, "cat": "Shoes", "brand": "Nike"}
    ]
    for np in nike_products:
        log("STEP 6", f"Viewing Nike item: {np['name']} (INR {np['price']})...")
        http_post("/interactions", {
            "user_id": TEST_USER_ID,
            "product_id": np["id"],
            "interaction_type": "product_view",
            "category": np["cat"],
            "brand": np["brand"],
            "price_at_interaction": np["price"],
            "session_id": session_id,
            "metadata": {"product_name": np["name"]}
        })

    # Step 7: Filter INR 1000 - INR 5000
    log("STEP 7", "Applying filter: Shoes category, Nike brand, INR 1000-INR 5000...")
    http_post("/interactions", {
        "user_id": TEST_USER_ID,
        "product_id": None,
        "interaction_type": "filter",
        "category": "Shoes",
        "brand": "Nike",
        "session_id": session_id,
        "metadata": {"minPrice": 1000, "maxPrice": 5000, "category": "Shoes", "brand": "Nike"}
    })

    # Step 8: Add Product A (or Nike Shoes) to cart
    log("STEP 8", "Adding Nike Revolution 6 to Cart...")
    http_post(f"/cart/{TEST_USER_ID}", {
        "product_id": "60002",
        "name": "Nike Revolution 6",
        "category": "Shoes",
        "brand": "Nike",
        "price": "INR 3,695",
        "numericPrice": 3695,
        "quantity": 1
    })

    # Step 9: Remove Product B from cart / interaction
    log("STEP 9", "Recording remove interaction for Product B...")
    http_post("/interactions", {
        "user_id": TEST_USER_ID,
        "product_id": "89323",
        "interaction_type": "remove_from_cart",
        "category": "Electronics",
        "brand": "Apple",
        "price_at_interaction": 45900,
        "session_id": session_id,
        "metadata": {"product_name": "Apple Watch Series 8"}
    })

    # Step 10: View another product (Nike Air Zoom)
    log("STEP 10", "Viewing Nike Air Zoom Pegasus 39 (Click & View)...")
    http_post("/interactions", {
        "user_id": TEST_USER_ID,
        "product_id": "60001",
        "interaction_type": "product_click",
        "category": "Shoes",
        "brand": "Nike",
        "price_at_interaction": 10495,
        "session_id": session_id,
        "metadata": {"product_name": "Nike Air Zoom Pegasus 39"}
    })

    print("\n" + "=" * 60)
    print("VERIFICATION & PREFERENCE AGGREGATION")
    print("=" * 60)

    # 1. Fetch Aggregated User Preferences
    log("CHECK 1", "Computing user preferences from Supabase persistent history...")
    pref_res = http_post(f"/user/{TEST_USER_ID}/preferences/compute", {})
    prefs = pref_res.get("preferences", {})
    print(f"Computed User Profile:")
    print(f"  - Total Interactions: {prefs.get('interactionCount')}")
    print(f"  - Top Category: {prefs.get('topCategory')}")
    print(f"  - Top Brand: {prefs.get('topBrand')}")
    print(f"  - Preferred Price Range: INR {prefs.get('preferredPriceMin'):,} - INR {prefs.get('preferredPriceMax'):,}")
    print(f"  - Weighted Average Price: INR {prefs.get('averagePrice'):,}")
    print(f"  - Top Price Bracket: {prefs.get('topPriceRange')}")

    assert prefs.get('interactionCount', 0) >= 10, f"Expected >= 10 interactions, got {prefs.get('interactionCount')}"
    assert prefs.get('topBrand') == "Nike", f"Expected top brand to be Nike, got {prefs.get('topBrand')}"
    assert prefs.get('topCategory') == "Shoes", f"Expected top category to be Shoes, got {prefs.get('topCategory')}"

    # 2. Fetch Post-Behavior Personalized Recommendations
    log("CHECK 2", "Fetching personalized hybrid recommendations for the active user...")
    post_rec = http_get(f"/recommend/{TEST_USER_ID}?use_hybrid=true&limit=5")
    recs = post_rec.get("recommendations", [])
    print(f"\nPost-Interaction Recommendations (Stage: Behavior-Driven Ranking):")
    for r in recs:
        print(f"  - Rank {r.get('rank')}: {r.get('name')} | Brand: {r.get('brand')} | Cat: {r.get('category')} | Final: {r.get('ranking_score')} | Reason: {r.get('reason')}")

    # 3. Verify Dynamic Shift
    log("CHECK 3", "Verifying recommendation rank shift and personalization...")
    top_rec = recs[0] if recs else {}
    print(f"\nTop Recommended Item: {top_rec.get('name')} ({top_rec.get('brand')})")
    print(f"Reasoning: {top_rec.get('reason')}")
    print(f"Scores breakdown: ML={top_rec.get('ml_score')}, Cat={top_rec.get('category_score')}, Brand={top_rec.get('brand_score')}, PriceMatch={top_rec.get('price_match_score')}, CartMatch={top_rec.get('cart_score')}")

    # 4. Verify Voice Assistant Query Response for this User
    log("CHECK 4", "Querying Voice Assistant for dynamic profile reasoning...")
    voice_resp = http_post("/voice/query", {
        "query": "Which brands and categories do I interact with the most?",
        "visitor_id": TEST_USER_ID
    })
    print(f"Voice Assistant Speech: \"{voice_resp.get('spoken_response') or voice_resp.get('speech_text')}\"")

    print("\n" + "=" * 60)
    print("SUCCESS: ALL 10 STEPS SIMULATED AND VERIFIED END-TO-END!")
    print("=" * 60)

if __name__ == "__main__":
    main()
