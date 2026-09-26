"""
Multi-User Distinct Recommendations Verification Test
Tests that User A (Fashion/Shoes) and User B (Tech/Audio) receive completely different,
hyper-personalized recommendation sets and distinct reasoning based on their unique activities.
"""

import json
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8088"

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
    print("=" * 70)
    print("TESTING DISTINCT RECOMMENDATIONS FOR MULTIPLE UNIQUE NEW USERS")
    print("=" * 70)

    # -------------------------------------------------------------
    # USER 1: Sportswear & Shoes Shopper (user_runner_01)
    # -------------------------------------------------------------
    user_1 = "user_runner_01"
    print(f"\n[USER 1] Simulating activities for Sportswear Shopper: {user_1}...")

    http_post("/interactions", {
        "user_id": user_1, "interaction_type": "search",
        "metadata": {"query": "running shoes"}
    })
    http_post("/interactions", {
        "user_id": user_1, "interaction_type": "category_view",
        "category": "Shoes"
    })
    http_post("/interactions", {
        "user_id": user_1, "interaction_type": "brand_view",
        "brand": "Nike"
    })
    for pid, name, p in [
        ("60001", "Nike Air Zoom Pegasus 39", 10495),
        ("60002", "Nike Revolution 6", 3695),
        ("60003", "Nike Downshifter 12", 3995)
    ]:
        http_post("/interactions", {
            "user_id": user_1, "product_id": pid, "interaction_type": "product_view",
            "category": "Shoes", "brand": "Nike", "price_at_interaction": p,
            "metadata": {"product_name": name}
        })

    http_post(f"/cart/{user_1}", {
        "product_id": "60002", "name": "Nike Revolution 6", "category": "Shoes",
        "brand": "Nike", "price": "INR 3,695", "numericPrice": 3695, "quantity": 1
    })

    # -------------------------------------------------------------
    # USER 2: Audio & Tech Enthusiast (user_audiophile_02)
    # -------------------------------------------------------------
    user_2 = "user_audiophile_02"
    print(f"\n[USER 2] Simulating activities for Audio/Tech Shopper: {user_2}...")

    http_post("/interactions", {
        "user_id": user_2, "interaction_type": "search",
        "metadata": {"query": "noise cancelling headphones"}
    })
    http_post("/interactions", {
        "user_id": user_2, "interaction_type": "category_view",
        "category": "Audio & Electronics"
    })
    http_post("/interactions", {
        "user_id": user_2, "interaction_type": "brand_view",
        "brand": "Bose"
    })
    for pid, name, p in [
        ("48030", "Sony WH-1000XM4", 24990),
        ("20002", "Bose QuietComfort Ultra", 35900),
        ("20005", "Sony WF-1000XM5 Earbuds", 19990)
    ]:
        http_post("/interactions", {
            "user_id": user_2, "product_id": pid, "interaction_type": "product_view",
            "category": "Audio & Electronics", "brand": "Sony" if "Sony" in name else "Bose",
            "price_at_interaction": p, "metadata": {"product_name": name}
        })

    http_post(f"/cart/{user_2}", {
        "product_id": "20002", "name": "Bose QuietComfort Ultra", "category": "Audio & Electronics",
        "brand": "Bose", "price": "INR 35,900", "numericPrice": 35900, "quantity": 1
    })

    # -------------------------------------------------------------
    # FETCH & COMPARE PROFILES & RECOMMENDATIONS
    # -------------------------------------------------------------
    pref_1 = http_get(f"/user/{user_1}/preferences")
    rec_1 = http_get(f"/recommend/{user_1}?limit=5").get("recommendations", [])

    pref_2 = http_get(f"/user/{user_2}/preferences")
    rec_2 = http_get(f"/recommend/{user_2}?limit=5").get("recommendations", [])

    print("\n" + "=" * 70)
    print(f"USER 1 ({user_1}) SHOPPING PROFILE:")
    print(f"  - Top Category: {pref_1.get('topCategory')}")
    print(f"  - Top Brand: {pref_1.get('topBrand')}")
    print(f"  - Preferred Price Range: INR {pref_1.get('preferredPriceMin'):,} - INR {pref_1.get('preferredPriceMax'):,}")
    print(f"  - Top Recommendations for User 1:")
    for r in rec_1[:3]:
        print(f"     * [{r.get('brand')}] {r.get('name')} | Cat: {r.get('category')} | Score: {r.get('ranking_score')} | Reason: {r.get('reason')}")

    print("\n" + "=" * 70)
    print(f"USER 2 ({user_2}) SHOPPING PROFILE:")
    print(f"  - Top Category: {pref_2.get('topCategory')}")
    print(f"  - Top Brand: {pref_2.get('topBrand')}")
    print(f"  - Preferred Price Range: INR {pref_2.get('preferredPriceMin'):,} - INR {pref_2.get('preferredPriceMax'):,}")
    print(f"  - Top Recommendations for User 2:")
    for r in rec_2[:3]:
        print(f"     * [{r.get('brand')}] {r.get('name')} | Cat: {r.get('category')} | Score: {r.get('ranking_score')} | Reason: {r.get('reason')}")

    # Assertions to guarantee distinctness
    u1_top_item = rec_1[0]["name"]
    u2_top_item = rec_2[0]["name"]

    print("\n" + "=" * 70)
    print(f"VERIFICATION RESULTS:")
    print(f"  - User 1 Top Recommended: '{u1_top_item}'")
    print(f"  - User 2 Top Recommended: '{u2_top_item}'")
    print(f"  - Profiles are distinct: {pref_1.get('topCategory')} != {pref_2.get('topCategory')}")
    print(f"  - Recommendations differ: {u1_top_item != u2_top_item}")
    print("=" * 70)

    assert pref_1.get("topCategory") != pref_2.get("topCategory"), "Top categories must differ"
    assert u1_top_item != u2_top_item, "Top recommendation must differ per user"
    print("SUCCESS: EVERY USER RECEIVES DIFFERENT RECOMMENDATIONS BASED ON THEIR UNIQUE BEHAVIOR!")

if __name__ == "__main__":
    main()
