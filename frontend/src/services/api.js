import { supabase, isSupabaseConfigured } from './supabaseClient';

const PORTS = [8088, 8085, 8082, 8000, 8001];
let cachedWorkingPort = null;

async function getWorkingBaseUrl() {
  const customUrl = localStorage.getItem('rr_api_url') || import.meta.env?.VITE_API_URL;
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/+$/, '');
  }
  if (cachedWorkingPort) {
    return `http://127.0.0.1:${cachedWorkingPort}`;
  }

  for (const port of PORTS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        cachedWorkingPort = port;
        return `http://127.0.0.1:${port}`;
      }
    } catch {
      // try next port
    }
  }

  return "http://127.0.0.1:8088";
}

export async function getHealth() {
  const baseUrl = await getWorkingBaseUrl();
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) {
    throw new Error("API offline");
  }
  return await response.json();
}

export async function getRecommendations(visitorId, limit = 10) {
  const baseUrl = await getWorkingBaseUrl();
  console.log("Fetching recommendations for visitor:", visitorId);

  const response = await fetch(`${baseUrl}/recommend/${encodeURIComponent(visitorId)}?limit=${limit}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.detail || "Unable to get recommendations");
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  console.log("FastAPI response for visitor", visitorId, ":", data);

  // Asynchronously persist / sync recommendation results in Supabase recommendations table
  if (data?.recommendations?.length && isSupabaseConfigured()) {
    syncRecommendationsToSupabase(visitorId, data.recommendations).catch(err => {
      console.warn("Supabase recommendation sync note:", err.message);
    });
  }

  return data;
}

async function syncRecommendationsToSupabase(visitorId, recommendations) {
  if (!isSupabaseConfigured() || !recommendations?.length) return;
  try {
    const rows = recommendations.map(rec => ({
      user_id: String(visitorId),
      product_id: String(rec.item_id),
      ranking_score: rec.ranking_score || rec.score || 0.0,
      ml_score: rec.ml_score || 0.0,
      price_match_score: rec.price_match_score || 0.0,
      category_score: rec.category_score || 0.0,
      brand_score: rec.brand_score || 0.0,
      interaction_score: rec.interaction_score || 0.0,
      cart_score: rec.cart_score || 0.0,
      reason: rec.reason || null
    }));

    await supabase.from('recommendations').insert(rows);
  } catch {
    // Non-blocking
  }
}


export async function getUserStats(visitorId) {
  const baseUrl = await getWorkingBaseUrl();
  const response = await fetch(`${baseUrl}/user/${encodeURIComponent(visitorId)}/stats`);
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

export async function getUserHistory(visitorId) {
  const baseUrl = await getWorkingBaseUrl();
  const response = await fetch(`${baseUrl}/user/${encodeURIComponent(visitorId)}/history`);
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

export async function getSampleUser() {
  const baseUrl = await getWorkingBaseUrl();
  const response = await fetch(`${baseUrl}/users/sample`);
  if (!response.ok) {
    throw new Error("Failed to fetch sample user");
  }
  return await response.json();
}

export async function getProducts(params = {}) {
  const baseUrl = await getWorkingBaseUrl();
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.brand && params.brand !== 'all') query.append('brand', params.brand);
  if (params.q) query.append('q', params.q);

  const url = `${baseUrl}/products${query.toString() ? `?${query.toString()}` : ''}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch products");
    return await response.json();
  } catch (err) {
    console.warn("Falling back to local product catalog:", err);
    return null;
  }
}

export async function getUserPreferences(visitorId) {
  const baseUrl = await getWorkingBaseUrl();
  const response = await fetch(`${baseUrl}/user/${encodeURIComponent(visitorId)}/preferences`);
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

export async function recomputeUserPreferences(visitorId, weights = null) {
  const baseUrl = await getWorkingBaseUrl();
  const response = await fetch(`${baseUrl}/user/${encodeURIComponent(visitorId)}/preferences/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weights })
  });
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

export async function queryVoiceAssistant(visitorId, query) {
  const baseUrl = await getWorkingBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/voice/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id: String(visitorId), query: String(query) })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Voice assistant backend error, fallback local processing:", err);
  }
  return null;
}

export async function registerUserProfile(visitorId, email = null, metadata = {}) {
  const baseUrl = await getWorkingBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/user/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: String(visitorId),
        email: email || `${visitorId}@retailrocket.ai`,
        metadata
      })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("User profile registration backend warning:", err);
  }
  return { status: "local", user_id: String(visitorId) };
}



