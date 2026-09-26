import { useState, useEffect, useCallback, useRef } from 'react';
import { getRecommendations, getUserStats, getUserHistory, getHealth, getSampleUser } from '../services/api';

export function useRecommendations(initialVisitorId = '1000294') {
  const [visitorId, setVisitorId] = useState(initialVisitorId);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [userHistory, setUserHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiConnected, setApiConnected] = useState(false);
  const [datasetHealth, setDatasetHealth] = useState(null);
  const debounceTimerRef = useRef(null);

  // Live health monitoring
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      try {
        const data = await getHealth();
        if (isMounted) {
          setApiConnected(true);
          setDatasetHealth(data);
        }
      } catch {
        if (isMounted) {
          setApiConnected(false);
        }
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleFetchRecommendations = useCallback(async (targetId, isSilent = false) => {
    const idToFetch = (targetId || visitorId).trim();
    if (!idToFetch) {
      setError("Please enter a visitor ID");
      return;
    }

    if (!isSilent) {
      setLoading(true);
      setError("");
      // CLEAR OLD VISITOR DATA COMPLETELY ON EXPLICIT SWITCH
      setRecommendations([]);
      setSelectedVisitor(null);
      setUserStats(null);
      setUserHistory(null);
    }

    try {
      const [recData, statsData, historyData] = await Promise.all([
        getRecommendations(idToFetch, 10),
        getUserStats(idToFetch).catch(() => null),
        getUserHistory(idToFetch).catch(() => null)
      ]);

      setSelectedVisitor(recData.visitor_id || idToFetch);
      setRecommendations(recData.recommendations || []);
      setUserStats(statsData);
      setUserHistory(historyData?.history || null);
      setApiConnected(true);
    } catch (err) {
      if (!isSilent) {
        setRecommendations([]);
        setSelectedVisitor(null);
        setUserStats(null);
        setUserHistory(null);

        if (err.status === 404) {
          setError("Visitor ID not found");
        } else {
          setError(err.message || "Unable to get recommendations");
        }
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [visitorId]);

  useEffect(() => {
    handleFetchRecommendations(initialVisitorId);
  }, [initialVisitorId, handleFetchRecommendations]);

  // Reactive listener for real-time user behavior events
  useEffect(() => {
    const handleInteraction = (event) => {
      const eventUserId = event?.detail?.user_id;
      const activeId = String(selectedVisitor || visitorId || '').trim();

      if (!eventUserId || String(eventUserId) === activeId) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          handleFetchRecommendations(activeId, true);
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
  }, [visitorId, selectedVisitor, handleFetchRecommendations]);

  const generateSampleVisitor = async () => {
    try {
      const data = await getSampleUser();
      if (data && data.visitor_id) {
        setVisitorId(data.visitor_id);
        handleFetchRecommendations(data.visitor_id);
      }
    } catch {
      handleFetchRecommendations('1000294');
    }
  };

  return {
    visitorId,
    setVisitorId,
    selectedVisitor,
    recommendations,
    userStats,
    userHistory,
    loading,
    error,
    apiConnected,
    datasetHealth,
    handleFetchRecommendations,
    generateSampleVisitor
  };
}
