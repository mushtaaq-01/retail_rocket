import { useState, useRef, useEffect, useCallback } from 'react';
import { queryVoiceAssistant } from '../services/api';
import { enrichProduct } from '../utils/productCatalog';

export function useVoiceAssistant(visitorId, preferences, rawRecommendations, cartItems = []) {
  const [voiceState, setVoiceState] = useState('IDLE'); // 'IDLE' | 'LISTENING' | 'PROCESSING' | 'RESPONSE'
  const [transcript, setTranscript] = useState('');
  const [spokenResponse, setSpokenResponse] = useState('');
  const [responseMeta, setResponseMeta] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef('');

  const processQuery = useCallback(async (textQuery) => {
    const query = textQuery || latestTranscriptRef.current || transcript || "What products do you recommend for me?";
    setVoiceState('PROCESSING');

    try {
      // 1. Query the Unified Voice Assistant API Layer
      const res = await queryVoiceAssistant(visitorId, query);

      if (res && res.spoken_response) {
        setSpokenResponse(res.spoken_response);
        setResponseMeta(res.data || null);
        setVoiceState('RESPONSE');
        speakText(res.spoken_response);
        return;
      }
    } catch (err) {
      console.warn("API voice assistant error, using local fallback:", err);
    }

    // 2. Data-grounded Fallback (using real user preferences and hybrid recommendations)
    let fallbackText = "";
    const qLower = query.toLowerCase();
    const pref = preferences || {};
    const recs = (rawRecommendations || []).map(enrichProduct);

    if (qLower.includes("price") || qLower.includes("budget")) {
      fallbackText = `Your preferred price range is ₹${Number(pref.preferredPriceMin || 5000).toLocaleString('en-IN')} to ₹${Number(pref.preferredPriceMax || 50000).toLocaleString('en-IN')}, with an average price of ₹${Number(pref.averagePrice || 25000).toLocaleString('en-IN')}.`;
    } else if (qLower.includes("category")) {
      fallbackText = `You explore ${pref.topCategory || 'Audio & Electronics'} most frequently based on your interaction history.`;
    } else if (qLower.includes("brand")) {
      fallbackText = `Your top brand affinity is ${pref.topBrand || 'Sony'}.`;
    } else if (qLower.includes("cart") || qLower.includes("bag")) {
      if (cartItems.length === 0) {
        fallbackText = "Your shopping cart is currently empty.";
      } else {
        const itemNames = cartItems.map(i => i.name).slice(0, 3).join(', ');
        fallbackText = `You have ${cartItems.length} items in your cart: ${itemNames}.`;
      }
    } else if (qLower.includes("why")) {
      const topRec = recs[0];
      fallbackText = topRec?.reason
        ? `We recommended ${topRec.name} because ${topRec.reason}.`
        : "Recommendations combine collaborative filtering ML latent factors with your price, category, and brand affinities.";
    } else {
      if (recs.length > 0) {
        const top3Names = recs.slice(0, 3).map(r => `${r.name} (${r.price})`).join(', ');
        fallbackText = `Based on your shopping behavior, I recommend: ${top3Names}.`;
      } else {
        fallbackText = `I have personalized insights ready for Shopper #${visitorId}. Ask about recommendations, your budget, or cart.`;
      }
    }

    setSpokenResponse(fallbackText);
    setVoiceState('RESPONSE');
    speakText(fallbackText);
  }, [visitorId, preferences, rawRecommendations, cartItems, transcript]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceState('LISTENING');
      setTranscript('');
      latestTranscriptRef.current = '';
      setSpokenResponse('');
      setResponseMeta(null);
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
      latestTranscriptRef.current = text;
    };

    recognition.onerror = () => {
      setVoiceState('IDLE');
    };

    recognition.onend = () => {
      setVoiceState('PROCESSING');
      setTimeout(() => {
        processQuery(latestTranscriptRef.current);
      }, 600);
    };

    recognitionRef.current = recognition;
  }, [processQuery]);

  const startListening = () => {
    if (recognitionRef.current && voiceState === 'IDLE') {
      try {
        recognitionRef.current.start();
      } catch {
        setVoiceState('IDLE');
      }
    } else if (!isSupported) {
      // Fallback for browsers without speech recognition
      setVoiceState('LISTENING');
      setTranscript('What products do you recommend for me?');
      setTimeout(() => {
        processQuery('What products do you recommend for me?');
      }, 1500);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('IDLE');
  };

  const askQuestion = (questionText) => {
    setTranscript(questionText);
    latestTranscriptRef.current = questionText;
    processQuery(questionText);
  };

  const playResponse = () => {
    if (spokenResponse) {
      speakText(spokenResponse);
    }
  };

  return {
    voiceState,
    transcript,
    spokenResponse,
    responseMeta,
    isSupported,
    startListening,
    stopListening,
    playResponse,
    askQuestion
  };
}
