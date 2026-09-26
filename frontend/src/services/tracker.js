/**
 * Centralized Behavior Interaction Tracking Service
 * Captures all user events asynchronously without blocking UI interactions.
 */

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

// Generate or retrieve persistent session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('rr_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    try {
      sessionStorage.setItem('rr_session_id', sessionId);
    } catch {
      // ignore
    }
  }
  return sessionId;
}

// Local in-memory log buffer for instantaneous local analytics
const localInteractionBuffer = [];

/**
 * Core asynchronous, non-blocking interaction tracker
 * @param {Object} params
 * @param {string} [params.productId]
 * @param {string} params.interactionType - 'product_view' | 'product_click' | 'category_view' | 'brand_view' | 'search' | 'add_to_cart' | 'remove_from_cart' | 'wishlist'
 * @param {string} [params.category]
 * @param {string} [params.brand]
 * @param {number} [params.price]
 * @param {number} [params.quantity=1]
 * @param {string} [params.userId]
 * @param {Object} [params.metadata]
 */
export function trackInteraction({
  productId = null,
  interactionType,
  category = null,
  brand = null,
  price = null,
  quantity = 1,
  userId = null,
  metadata = {}
}) {
  const currentUserId = userId || localStorage.getItem('rr_active_visitor_id') || '1000294';
  const sessionId = getSessionId();
  const timestamp = Date.now();

  const eventPayload = {
    user_id: String(currentUserId),
    product_id: productId ? String(productId) : null,
    interaction_type: interactionType,
    category,
    brand,
    price_at_interaction: typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '')) || null,
    quantity: quantity || 1,
    session_id: sessionId,
    timestamp,
    metadata: {
      url: window.location.pathname,
      screen: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      ...metadata
    }
  };

  // 1. Instantaneous local in-memory log (0ms delay)
  localInteractionBuffer.unshift(eventPayload);
  if (localInteractionBuffer.length > 200) {
    localInteractionBuffer.pop();
  }

  // 2. Dispatch custom event for real-time UI components/analytics
  try {
    window.dispatchEvent(new CustomEvent('retail_rocket_interaction', { detail: eventPayload }));
  } catch {
    // ignore
  }

  // 3. Fire-and-forget asynchronous backend dispatch
  // Wrapped in queueMicrotask/Promise to guarantee UI thread never stalls
  Promise.resolve().then(async () => {
    try {
      const baseUrl = await getWorkingBaseUrl();
      fetch(`${baseUrl}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload),
        keepalive: true,
        signal: AbortSignal.timeout(3000)
      }).catch(() => {
        // Fail silently in background
      });
    } catch {
      // Background non-blocking error absorption
    }
  });

  return eventPayload;
}

// -----------------------------------------------------------------------------
// High-Level Helper Functions
// -----------------------------------------------------------------------------

export function trackProductView(product, metadata = {}, userId = null) {
  return trackInteraction({
    productId: product?.id || product?.item_id,
    interactionType: 'product_view',
    category: product?.category,
    brand: product?.brand,
    price: product?.numericPrice,
    userId,
    metadata: {
      product_name: product?.name,
      ...metadata
    }
  });
}

export function trackProductClick(product, metadata = {}, userId = null) {
  return trackInteraction({
    productId: product?.id || product?.item_id,
    interactionType: 'product_click',
    category: product?.category,
    brand: product?.brand,
    price: product?.numericPrice,
    userId,
    metadata: {
      product_name: product?.name,
      ...metadata
    }
  });
}

export function trackCategoryView(category, metadata = {}, userId = null) {
  return trackInteraction({
    interactionType: 'category_view',
    category,
    userId,
    metadata: {
      action: 'filter_category',
      ...metadata
    }
  });
}

export function trackBrandView(brand, metadata = {}, userId = null) {
  return trackInteraction({
    interactionType: 'brand_view',
    brand,
    userId,
    metadata: {
      action: 'filter_brand',
      ...metadata
    }
  });
}

export function trackSearch(query, resultCount = 0, metadata = {}, userId = null) {
  if (!query || !query.trim()) return null;
  return trackInteraction({
    interactionType: 'search',
    userId,
    metadata: {
      query: query.trim(),
      result_count: resultCount,
      ...metadata
    }
  });
}

export function trackAddToCart(product, quantity = 1, metadata = {}, userId = null) {
  return trackInteraction({
    productId: product?.id || product?.item_id,
    interactionType: 'add_to_cart',
    category: product?.category,
    brand: product?.brand,
    price: product?.numericPrice,
    quantity,
    userId,
    metadata: {
      product_name: product?.name,
      ...metadata
    }
  });
}

export function trackRemoveFromCart(product, metadata = {}, userId = null) {
  return trackInteraction({
    productId: product?.id || product?.item_id,
    interactionType: 'remove_from_cart',
    category: product?.category,
    brand: product?.brand,
    price: product?.numericPrice,
    userId,
    metadata: {
      product_name: product?.name,
      ...metadata
    }
  });
}

export function trackWishlist(product, isAdded = true, metadata = {}, userId = null) {
  return trackInteraction({
    productId: product?.id || product?.item_id,
    interactionType: 'wishlist',
    category: product?.category,
    brand: product?.brand,
    price: product?.numericPrice,
    userId,
    metadata: {
      product_name: product?.name,
      status: isAdded ? 'added' : 'removed',
      ...metadata
    }
  });
}

export function trackFilter(filterParams = {}, metadata = {}, userId = null) {
  return trackInteraction({
    interactionType: 'filter',
    category: filterParams.category || null,
    brand: filterParams.brand || null,
    userId,
    metadata: {
      minPrice: filterParams.minPrice,
      maxPrice: filterParams.maxPrice,
      category: filterParams.category,
      brand: filterParams.brand,
      rating: filterParams.rating,
      ...metadata
    }
  });
}

export function trackShare(product, channel = 'direct', metadata = {}, userId = null) {
  return trackInteraction({
    productId: product?.id || product?.item_id,
    interactionType: 'share',
    category: product?.category,
    brand: product?.brand,
    price: product?.numericPrice,
    userId,
    metadata: {
      product_name: product?.name,
      channel,
      ...metadata
    }
  });
}

export function trackPurchase(product, orderDetails = {}, metadata = {}, userId = null) {
  return trackInteraction({
    productId: product?.id || product?.item_id,
    interactionType: 'purchase',
    category: product?.category,
    brand: product?.brand,
    price: product?.numericPrice || orderDetails.totalAmount,
    userId,
    metadata: {
      product_name: product?.name,
      order_id: orderDetails.orderId,
      ...metadata
    }
  });
}

export function getLocalInteractions() {
  return [...localInteractionBuffer];
}
