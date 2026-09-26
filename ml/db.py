"""
Supabase PostgreSQL Database Client
Lightweight, zero-dependency client using Supabase PostgREST RESTful API.
Supports real-time syncing, preference persistence, cart storage, and connection diagnostics.
"""

import os
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional

# Load environment variables or parse from .env file
def _load_env_file():
    env_vars = {}
    for path in [".env", "../.env", "frontend/.env"]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            env_vars[k.strip()] = v.strip().strip("'\"")
            except Exception:
                pass
    return env_vars

_local_env = _load_env_file()

SUPABASE_URL = os.environ.get("SUPABASE_URL", _local_env.get("SUPABASE_URL", _local_env.get("VITE_SUPABASE_URL", ""))).strip().rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", _local_env.get("SUPABASE_ANON_KEY", _local_env.get("VITE_SUPABASE_ANON_KEY", _local_env.get("SUPABASE_SERVICE_ROLE_KEY", "")))).strip()



def is_db_configured() -> bool:
    """Checks if Supabase credentials are configured."""
    return bool(SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL.startswith("http"))


def set_db_credentials(url: str, key: str):
    """Dynamically updates credentials at runtime."""
    global SUPABASE_URL, SUPABASE_KEY
    SUPABASE_URL = (url or "").strip().rstrip("/")
    SUPABASE_KEY = (key or "").strip()


def execute_postgrest(
    table: str,
    method: str = "GET",
    params: Optional[Dict[str, str]] = None,
    payload: Optional[Any] = None,
    prefer: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes a direct request against the Supabase PostgREST endpoint.
    """
    if not is_db_configured():
        return {"success": False, "error": "Database not configured"}

    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if params:
        query_string = urllib.parse.urlencode(params)
        url = f"{url}?{query_string}"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if prefer:
        headers["Prefer"] = prefer

    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            raw = response.read().decode("utf-8")
            content = json.loads(raw) if raw else {}
            return {"success": True, "status": status, "data": content}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8") if e.fp else str(e)
        return {"success": False, "status": e.code, "error": err_msg}
    except Exception as e:
        return {"success": False, "error": str(e)}


def test_supabase_connection() -> Dict[str, Any]:
    """
    Validates Supabase connection and tests access to core tables.
    """
    if not is_db_configured():
        return {
            "connected": False,
            "configured": False,
            "message": "Supabase URL and API Key are not configured yet. Add them in settings or .env file."
        }

    # Ping profiles or product_interactions table
    res = execute_postgrest("product_interactions", method="GET", params={"limit": "1", "select": "id"})
    if res["success"]:
        return {
            "connected": True,
            "configured": True,
            "url": SUPABASE_URL,
            "status": "ready",
            "message": "Successfully connected to Supabase PostgreSQL database!"
        }
    else:
        # Check if URL works but table doesn't exist yet
        return {
            "connected": False,
            "configured": True,
            "url": SUPABASE_URL,
            "error": res.get("error", "Failed to query database table"),
            "message": "Connected to Supabase endpoint, but tables may need migration schema applied."
        }


def save_interaction_to_db(interaction: Dict[str, Any]) -> bool:
    """Inserts a product interaction event into public.product_interactions."""
    if not is_db_configured():
        return False
    row = {
        "interaction_type": interaction.get("interaction_type") or "product_view",
        "category": interaction.get("category"),
        "brand": interaction.get("brand"),
        "price_at_interaction": interaction.get("price_at_interaction"),
        "quantity": interaction.get("quantity", 1),
        "session_id": str(interaction.get("session_id") or ""),
        "metadata": interaction.get("metadata") or {}
    }
    res = execute_postgrest("product_interactions", method="POST", payload=row, prefer="return=minimal")
    return res["success"]


def save_user_preferences_to_db(visitor_id: str, preferences: Dict[str, Any]) -> bool:
    """Upserts aggregated preferences to public.user_preferences."""
    if not is_db_configured():
        return False
    row = {
        "preferred_min_price": preferences.get("preferredPriceMin", 0),
        "preferred_max_price": preferences.get("preferredPriceMax", 0),
        "preferred_price_average": preferences.get("averagePrice", 0),
        "top_category": preferences.get("topCategory"),
        "top_brand": preferences.get("topBrand"),
        "preferred_categories": preferences.get("topCategories", []),
        "preferred_brands": preferences.get("topBrands", []),
        "metadata": {
            "visitor_id": str(visitor_id),
            "interaction_count": preferences.get("interactionCount", 0),
            "top_price_range": preferences.get("topPriceRange")
        }
    }
    res = execute_postgrest("user_preferences", method="POST", payload=row, prefer="resolution=merge-duplicates")
    return res["success"]


def create_or_upsert_profile_in_db(user_id: str, email: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Creates or updates a user profile record in public.profiles or user store.
    Stores visitor ID, email, and metadata.
    """
    if not is_db_configured():
        return {"success": False, "message": "Database not configured"}
    
    # Store in user_preferences as primary profile anchor
    profile_payload = {
        "metadata": {
            "user_id": str(user_id),
            "email": email or f"{user_id}@retailrocket.ai",
            "active": True,
            "created_via": "user_identity_switch",
            **(metadata or {})
        }
    }
    res = execute_postgrest("user_preferences", method="POST", payload=profile_payload, prefer="resolution=merge-duplicates")
    return {"success": res["success"], "user_id": str(user_id), "status": "persisted"}

