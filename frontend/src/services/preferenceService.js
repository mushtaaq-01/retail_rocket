/**
 * User Behavioral Preference Service
 * Interacts with FastAPI Behavioral Aggregation Layer and Supabase user_preferences table.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

const PORTS = [8088, 8085, 8082, 8000, 8001];
let cachedWorkingPort = null;

const PRODUCTION_BACKEND_URL = 'https://retail-rocket.onrender.com';

async function getWorkingBaseUrl() {
  const customUrl = localStorage.getItem('rr_api_url') || import.meta.env?.VITE_API_URL;
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return PRODUCTION_BACKEND_URL;
  }

  if (typeof window !== 'undefined') {
    return '/api';
  }

  return "http://127.0.0.1:8088";
}

/**
 * Fetch aggregated behavioral preferences for a user
 * @param {string} visitorId 
 * @returns {Promise<Object>} Aggregated preference profile
 */
export async function getUserPreferences(visitorId) {
  if (!visitorId) return null;
  const vid = String(visitorId);

  try {
    const baseUrl = await getWorkingBaseUrl();
    const res = await fetch(`${baseUrl}/user/${encodeURIComponent(vid)}/preferences`);
    if (res.ok) {
      const data = await res.json();
      
      // Optionally sync with Supabase user_preferences table asynchronously
      syncToSupabase(vid, data).catch(err => {
        console.warn('Supabase preference sync warning:', err.message);
      });

      return data;
    }
  } catch (err) {
    console.warn('FastAPI preference fetch error, attempting fallback:', err);
  }

  // Fallback to Supabase if backend is offline
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', vid)
        .single();
      
      if (data && !error) {
        return {
          visitor_id: vid,
          preferredPriceMin: data.preferred_price_min,
          preferredPriceMax: data.preferred_price_max,
          averagePrice: data.preferred_price_max ? (data.preferred_price_min + data.preferred_price_max) / 2 : 25000,
          topPriceRange: data.dominant_price_bracket || 'Mid-Range',
          topCategory: data.top_categories?.[0]?.category || 'General',
          topBrand: data.top_brands?.[0]?.brand || 'RetailBrand',
          topCategories: data.top_categories || [],
          topBrands: data.top_brands || [],
          topProducts: [],
          cartProducts: [],
          interactionCount: data.interaction_count || 0,
          recentInteractions: [],
          updated_at: data.updated_at
        };
      }
    } catch (err) {
      console.warn('Supabase preference fallback error:', err);
    }
  }

  // Safe client-side default profile
  return {
    visitor_id: vid,
    preferredPriceMin: 5000,
    preferredPriceMax: 50000,
    averagePrice: 27500,
    topPriceRange: "Mid-Range (₹15,000 - ₹40,000)",
    topCategory: "Audio & Electronics",
    topBrand: "Sony",
    topCategories: [{ category: "Audio & Electronics", score: 8.5, percentage: 65.0 }],
    topBrands: [{ brand: "Sony", score: 8.0, percentage: 60.0 }],
    topProducts: [],
    cartProducts: [],
    interactionCount: 0,
    recentInteractions: [],
    updated_at: Date.now()
  };
}

/**
 * Recompute preferences on demand with optional custom weights
 * @param {string} visitorId 
 * @param {Object} customWeights 
 * @returns {Promise<Object>}
 */
export async function recomputeUserPreferences(visitorId, customWeights = null) {
  if (!visitorId) return null;
  const vid = String(visitorId);
  try {
    const baseUrl = await getWorkingBaseUrl();
    const res = await fetch(`${baseUrl}/user/${encodeURIComponent(vid)}/preferences/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights: customWeights })
    });
    if (res.ok) {
      const data = await res.json();
      return data.preferences || data;
    }
  } catch (err) {
    console.warn('Error recomputing preferences:', err);
  }
  return getUserPreferences(vid);
}

/**
 * Persists aggregated preference object to Supabase user_preferences
 */
async function syncToSupabase(visitorId, preferences) {
  if (!isSupabaseConfigured() || !preferences) return;

  try {
    const row = {
      user_id: String(visitorId),
      preferred_price_min: preferences.preferredPriceMin || 0,
      preferred_price_max: preferences.preferredPriceMax || 0,
      dominant_price_bracket: preferences.topPriceRange || 'Mid-Range',
      top_categories: preferences.topCategories || [],
      top_brands: preferences.topBrands || [],
      interaction_count: preferences.interactionCount || 0,
      metadata: {
        average_price: preferences.averagePrice,
        top_products: preferences.topProducts?.map(p => p.product_id) || [],
        recent_count: preferences.recentInteractions?.length || 0
      },
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert(row, { onConflict: 'user_id' });

    if (error) {
      // Non-critical warning
      // console.warn('Supabase upsert warning:', error.message);
    }
  } catch {
    // Non-blocking
  }
}
