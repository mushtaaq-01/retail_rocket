import { createClient } from '@supabase/supabase-js';

// Read from Vite environment variables or localStorage runtime overrides
const getStoredUrl = () => {
  try {
    return localStorage.getItem('rr_supabase_url') || import.meta.env?.VITE_SUPABASE_URL || '';
  } catch {
    return import.meta.env?.VITE_SUPABASE_URL || '';
  }
};

const getStoredKey = () => {
  try {
    return localStorage.getItem('rr_supabase_key') || import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
  } catch {
    return import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
  }
};

let currentUrl = getStoredUrl();
let currentKey = getStoredKey();

export const isSupabaseConfigured = () => {
  return Boolean(currentUrl && currentKey && currentUrl.startsWith('http') && !currentUrl.includes('your-project-ref'));
};

export let supabase = isSupabaseConfigured()
  ? createClient(currentUrl, currentKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

export const updateSupabaseCredentials = (url, key) => {
  currentUrl = (url || '').trim();
  currentKey = (key || '').trim();

  try {
    if (currentUrl) localStorage.setItem('rr_supabase_url', currentUrl);
    else localStorage.removeItem('rr_supabase_url');

    if (currentKey) localStorage.setItem('rr_supabase_key', currentKey);
    else localStorage.removeItem('rr_supabase_key');
  } catch {
    // ignore
  }

  if (isSupabaseConfigured()) {
    supabase = createClient(currentUrl, currentKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } else {
    supabase = null;
  }

  return isSupabaseConfigured();
};

export const getSupabaseConfig = () => {
  return {
    url: currentUrl,
    key: currentKey ? `${currentKey.substring(0, 10)}...` : '',
    configured: isSupabaseConfigured()
  };
};

export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      configured: false,
      message: 'Supabase credentials are not configured yet.'
    };
  }

  try {
    // Test simple select on products or interactions
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      return {
        connected: false,
        configured: true,
        error: error.message,
        message: `Connected to Supabase, but encountered error: ${error.message}. You may need to run the SQL migration schema.`
      };
    }

    return {
      connected: true,
      configured: true,
      message: 'Successfully connected to Supabase PostgreSQL database!'
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      error: err.message,
      message: `Failed to connect to Supabase: ${err.message}`
    };
  }
};
