import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserPreferences, recomputeUserPreferences } from '../services/preferenceService';

/**
 * Custom React hook for reactive User Behavioral Preferences
 * @param {string} visitorId 
 */
export function useUserPreferences(visitorId) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimerRef = useRef(null);

  const fetchPreferences = useCallback(async (id = visitorId, isSilent = false) => {
    if (!id) return;
    if (!isSilent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await getUserPreferences(id);
      setPreferences(data);
    } catch (err) {
      if (!isSilent) {
        console.error('Failed to load user preferences:', err);
        setError(err.message);
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [visitorId]);

  const recompute = useCallback(async (customWeights = null) => {
    if (!visitorId) return;
    setLoading(true);
    try {
      const data = await recomputeUserPreferences(visitorId, customWeights);
      if (data) {
        setPreferences(data);
      }
    } catch (err) {
      console.error('Failed to recompute user preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [visitorId]);

  useEffect(() => {
    if (visitorId) {
      fetchPreferences(visitorId);
    }
  }, [visitorId, fetchPreferences]);

  // Reactive listener for real-time user behavior events
  useEffect(() => {
    const handleInteraction = (event) => {
      const eventUserId = event?.detail?.user_id;
      const activeId = String(visitorId || '').trim();

      if (!eventUserId || String(eventUserId) === activeId) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          fetchPreferences(activeId, true);
        }, 350);
      }
    };

    window.addEventListener('retail_rocket_interaction', handleInteraction);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      window.removeEventListener('retail_rocket_interaction', handleInteraction);
    };
  }, [visitorId, fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    refreshPreferences: () => fetchPreferences(visitorId),
    recomputePreferences: recompute
  };
}
