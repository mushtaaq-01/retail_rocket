import joblib
import numpy as np


MODEL_FILE = "model/recommendation_model.joblib"

model = joblib.load(MODEL_FILE)

user_latent = model["user_latent"]
item_latent = model["item_latent"]
user_to_index = model["user_to_index"]
index_to_item = model["index_to_item"]
interactions = model["interactions"]


def recommend(visitor_id, limit=10):

    visitor_id = str(visitor_id)

    if visitor_id not in user_to_index:
        return []

    user_index = user_to_index[visitor_id]

    # Calculate recommendation scores
    scores = item_latent @ user_latent[user_index]

    # Highest scores first
    ranked_items = np.argsort(scores)[::-1]

    # Existing products
    existing = set(
        interactions[
            interactions["visitorid"] == visitor_id
        ]["itemid"]
    )

    recommendations = []

    for item_index in ranked_items:

        item_id = index_to_item[item_index]

        # Don't recommend something already interacted with
        if item_id in existing:
            continue

        recommendations.append({
            "item_id": str(item_id),
            "score": float(scores[item_index])
        })

        if len(recommendations) >= limit:
            break

    return recommendations


# --------------------------------
# TEST WITH A REAL USER
# --------------------------------

test_user = next(iter(user_to_index))

results = recommend(test_user, 10)

print("\nTEST USER:")
print(test_user)

print("\nRECOMMENDATIONS:")

for i, result in enumerate(results, 1):
    print(
        f"{i}. "
        f"Item={result['item_id']} "
        f"Score={result['score']:.4f}"
    )


# --------------------------------
# VALIDATION
# --------------------------------

assert test_user in user_to_index
assert len(results) > 0

item_ids = [
    x["item_id"]
    for x in results
]

assert len(item_ids) == len(set(item_ids))

existing_items = set(
    interactions[
        interactions["visitorid"] == test_user
    ]["itemid"]
)

assert not existing_items.intersection(item_ids)

print("\nMODEL TEST PASSED [OK]")
