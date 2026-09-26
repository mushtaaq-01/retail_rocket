import { supabase, isSupabaseConfigured } from './supabaseClient';
import { enrichProduct } from '../utils/productCatalog';
import { trackAddToCart, trackRemoveFromCart } from './tracker';

const PORTS = [8088, 8085, 8082, 8000, 8001];
let cachedPort = null;

async function getBaseApiUrl() {
  const customUrl = localStorage.getItem('rr_api_url') || import.meta.env?.VITE_API_URL;
  if (customUrl && customUrl.trim()) return customUrl.trim().replace(/\/+$/, '');
  if (cachedPort) return `http://127.0.0.1:${cachedPort}`;
  for (const port of PORTS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(800) });
      if (res.ok) {
        cachedPort = port;
        return `http://127.0.0.1:${port}`;
      }
    } catch {
      // ignore
    }
  }
  return 'http://127.0.0.1:8088';
}

function getLocalCartKey(userId) {
  return `rr_cart_${userId || 'guest'}`;
}

/**
 * Load cart items for given user ID across Supabase / Backend API / LocalStorage
 */
export async function getCartItems(userId) {
  const uid = String(userId || '1000294');

  // 1. Try Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const enriched = data.map((row) => {
          const prod = row.products || {};
          return enrichProduct({
            id: row.product_id,
            item_id: row.product_id,
            quantity: row.quantity,
            price_at_addition: row.price_at_addition,
            ...prod
          });
        });
        saveLocalCart(uid, enriched);
        return enriched;
      }
    } catch (err) {
      console.warn('Supabase cart fetch fallback:', err);
    }
  }

  // 2. Try Backend API
  try {
    const baseUrl = await getBaseApiUrl();
    const res = await fetch(`${baseUrl}/cart/${encodeURIComponent(uid)}`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const enriched = data.items.map(enrichProduct);
        saveLocalCart(uid, enriched);
        return enriched;
      }
    }
  } catch (err) {
    // ignore
  }

  // 3. Fallback to LocalStorage
  return readLocalCart(uid);
}

/**
 * Add a product to the user's cart (or increment quantity if already present)
 */
export async function addProductToCart(userId, rawProduct, quantityToAdd = 1, metadata = {}) {
  const uid = String(userId || '1000294');
  const product = enrichProduct(rawProduct);
  const productId = String(product.id || product.item_id);

  // Trigger tracking interaction asynchronously
  trackAddToCart(product, quantityToAdd, { source: 'cart_service', ...metadata }, uid);

  // 1. Supabase Persistence
  if (isSupabaseConfigured() && supabase) {
    try {
      // Check existing
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', uid)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const newQty = (existing.quantity || 1) + quantityToAdd;
        await supabase
          .from('cart_items')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({
          user_id: uid,
          product_id: productId,
          quantity: quantityToAdd,
          price_at_addition: product.numericPrice || 0
        });
      }
    } catch (err) {
      console.warn('Supabase cart addition error:', err);
    }
  }

  // 2. Backend API sync
  try {
    const baseUrl = await getBaseApiUrl();
    fetch(`${baseUrl}/cart/${encodeURIComponent(uid)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        quantity: quantityToAdd,
        price_at_addition: product.numericPrice || 0
      }),
      keepalive: true
    }).catch(() => {});
  } catch {
    // background
  }

  // 3. LocalStorage immediate update
  const current = readLocalCart(uid);
  const existingIdx = current.findIndex((i) => String(i.id) === productId);
  let updated;
  if (existingIdx >= 0) {
    updated = current.map((item, idx) =>
      idx === existingIdx
        ? { ...item, quantity: (item.quantity || 1) + quantityToAdd }
        : item
    );
  } else {
    updated = [...current, { ...product, quantity: quantityToAdd }];
  }
  saveLocalCart(uid, updated);
  return updated;
}

/**
 * Update quantity for a cart product
 */
export async function updateProductQuantity(userId, rawProduct, newQuantity) {
  const uid = String(userId || '1000294');
  const product = enrichProduct(rawProduct);
  const productId = String(product.id || product.item_id);

  if (newQuantity <= 0) {
    return removeProductFromCart(userId, rawProduct);
  }

  // 1. Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('user_id', uid)
        .eq('product_id', productId);
    } catch (err) {
      console.warn('Supabase quantity update error:', err);
    }
  }

  // 2. Backend API
  try {
    const baseUrl = await getBaseApiUrl();
    fetch(`${baseUrl}/cart/${encodeURIComponent(uid)}/${encodeURIComponent(productId)}?quantity=${newQuantity}`, {
      method: 'PUT',
      keepalive: true
    }).catch(() => {});
  } catch {
    // ignore
  }

  // 3. LocalStorage
  const current = readLocalCart(uid);
  const updated = current.map((i) =>
    String(i.id) === productId ? { ...i, quantity: newQuantity } : i
  );
  saveLocalCart(uid, updated);
  return updated;
}

/**
 * Remove product from cart
 */
export async function removeProductFromCart(userId, rawProduct, metadata = {}) {
  const uid = String(userId || '1000294');
  const product = enrichProduct(rawProduct);
  const productId = String(product.id || product.item_id);

  // Trigger tracking interaction asynchronously
  trackRemoveFromCart(product, { source: 'cart_service', ...metadata }, uid);

  // 1. Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', uid)
        .eq('product_id', productId);
    } catch (err) {
      console.warn('Supabase cart delete error:', err);
    }
  }

  // 2. Backend API
  try {
    const baseUrl = await getBaseApiUrl();
    fetch(`${baseUrl}/cart/${encodeURIComponent(uid)}/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      keepalive: true
    }).catch(() => {});
  } catch {
    // ignore
  }

  // 3. LocalStorage
  const current = readLocalCart(uid);
  const updated = current.filter((i) => String(i.id) !== productId);
  saveLocalCart(uid, updated);
  return updated;
}

/**
 * Clear all items in user's cart
 */
export async function clearUserCart(userId) {
  const uid = String(userId || '1000294');

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('cart_items').delete().eq('user_id', uid);
    } catch (err) {
      console.warn('Supabase clear cart error:', err);
    }
  }

  try {
    const baseUrl = await getBaseApiUrl();
    fetch(`${baseUrl}/cart/${encodeURIComponent(uid)}`, { method: 'DELETE', keepalive: true }).catch(() => {});
  } catch {
    // ignore
  }

  saveLocalCart(uid, []);
  return [];
}

// -----------------------------------------------------------------------------
// Calculation & LocalStorage Helpers
// -----------------------------------------------------------------------------

export function calculateSubtotal(items = []) {
  return items.reduce((sum, item) => {
    const price = item.numericPrice || parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) || 0;
    const qty = item.quantity || 1;
    return sum + price * qty;
  }, 0);
}

export function calculateCartCount(items = []) {
  return items.reduce((count, item) => count + (item.quantity || 1), 0);
}

function readLocalCart(userId) {
  try {
    const raw = localStorage.getItem(getLocalCartKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(enrichProduct) : [];
  } catch {
    return [];
  }
}

function saveLocalCart(userId, items) {
  try {
    localStorage.setItem(getLocalCartKey(userId), JSON.stringify(items));
  } catch {
    // ignore
  }
}
