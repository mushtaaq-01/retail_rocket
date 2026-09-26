import os
import joblib
import numpy as np
import pandas as pd

from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD


# -----------------------------
# CONFIG
# -----------------------------
EVENTS_FILE = "data/events.csv"
MODEL_FILE = "model/recommendation_model.joblib"

TOP_USERS = 10000
TOP_ITEMS = 5000
N_COMPONENTS = 50


# -----------------------------
# 1. LOAD DATA
# -----------------------------
print("Loading events...")

events = pd.read_csv(EVENTS_FILE)

required = ["visitorid", "itemid", "event"]

missing = [c for c in required if c not in events.columns]

if missing:
    raise ValueError(f"Missing columns: {missing}")

print(f"Raw events: {len(events):,}")


# -----------------------------
# 2. CLEAN DATA
# -----------------------------
events = events.dropna(subset=required)
events = events.drop_duplicates()

events["visitorid"] = events["visitorid"].astype(str)
events["itemid"] = events["itemid"].astype(str)

# Keep only recommendation-relevant events
events = events[
    events["event"].isin([
        "view",
        "addtocart",
        "transaction"
    ])
].copy()


# -----------------------------
# 3. INTERACTION WEIGHTS
# -----------------------------
weights = {
    "view": 1.0,
    "addtocart": 3.0,
    "transaction": 5.0
}

events["interaction_score"] = (
    events["event"].map(weights)
)


# -----------------------------
# 4. AGGREGATE USER-ITEM
# -----------------------------
df = (
    events
    .groupby(["visitorid", "itemid"], as_index=False)
    .agg(
        interaction_score=("interaction_score", "sum"),
        interaction_count=("event", "count")
    )
)

print(f"Unique user-item interactions: {len(df):,}")


# -----------------------------
# 5. KEEP IMPORTANT USERS
# -----------------------------
top_users = (
    df.groupby("visitorid")["interaction_score"]
    .sum()
    .nlargest(TOP_USERS)
    .index
)


# -----------------------------
# 6. KEEP IMPORTANT ITEMS
# -----------------------------
top_items = (
    df.groupby("itemid")["interaction_score"]
    .sum()
    .nlargest(TOP_ITEMS)
    .index
)


df = df[
    df["visitorid"].isin(top_users) &
    df["itemid"].isin(top_items)
].copy()

print(f"Filtered interactions: {len(df):,}")
print(f"Users: {df.visitorid.nunique():,}")
print(f"Items: {df.itemid.nunique():,}")


# -----------------------------
# 7. CREATE INDEXES
# -----------------------------
user_ids = df["visitorid"].unique()
item_ids = df["itemid"].unique()

user_to_index = {
    user_id: i
    for i, user_id in enumerate(user_ids)
}

item_to_index = {
    item_id: i
    for i, item_id in enumerate(item_ids)
}

index_to_item = {
    i: item_id
    for item_id, i in item_to_index.items()
}


df["user_index"] = df["visitorid"].map(user_to_index)
df["item_index"] = df["itemid"].map(item_to_index)


# -----------------------------
# 8. USER-ITEM MATRIX
# -----------------------------
matrix = csr_matrix(
    (
        df["interaction_score"],
        (
            df["user_index"],
            df["item_index"]
        )
    ),
    shape=(
        len(user_ids),
        len(item_ids)
    )
)

print("Matrix shape:", matrix.shape)


# -----------------------------
# 9. TRAIN SVD
# -----------------------------
components = min(
    N_COMPONENTS,
    matrix.shape[0] - 1,
    matrix.shape[1] - 1
)

if components < 2:
    raise ValueError(
        "Not enough users/items to train the model."
    )

print(f"Training SVD with {components} components...")

svd = TruncatedSVD(
    n_components=components,
    random_state=42
)

user_latent = svd.fit_transform(matrix)

item_latent = svd.components_.T


# -----------------------------
# 10. MODEL VALIDATION
# -----------------------------
if np.isnan(user_latent).any():
    raise ValueError("NaN detected in user latent vectors.")

if np.isnan(item_latent).any():
    raise ValueError("NaN detected in item latent vectors.")

if not np.isfinite(user_latent).all():
    raise ValueError("Invalid user latent values.")

if not np.isfinite(item_latent).all():
    raise ValueError("Invalid item latent values.")


# -----------------------------
# 11. SAVE MODEL
# -----------------------------
os.makedirs(
    os.path.dirname(MODEL_FILE),
    exist_ok=True
)

model = {
    "model_type": "TruncatedSVD",
    "version": "1.0",

    "user_latent": user_latent,
    "item_latent": item_latent,

    "user_to_index": user_to_index,
    "index_to_item": index_to_item,

    # Used by FastAPI to remove already-seen products
    "interactions": df[
        ["visitorid", "itemid"]
    ].copy(),

    "n_components": components,

    "metrics": {
        "users": len(user_ids),
        "items": len(item_ids),
        "interactions": len(df)
    }
}


joblib.dump(
    model,
    MODEL_FILE,
    compress=3
)

print("\nMODEL CREATED SUCCESSFULLY")
print("--------------------------------")
print("File:", MODEL_FILE)
print("Users:", len(user_ids))
print("Items:", len(item_ids))
print("Interactions:", len(df))
print("Components:", components)