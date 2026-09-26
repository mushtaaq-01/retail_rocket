import React from 'react';
import { MicOff, Volume2, User, Bot, Sparkles, Radio, HelpCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import assistantBotImg from '../assets/voice-assistant-bot.png';

export default function VoiceAssistant({ 
  voiceState, 
  transcript, 
  spokenResponse, 
  startListening, 
  stopListening, 
  playResponse,
  askQuestion,
  theme = 'light'
}) {
  const isLight = theme === 'light';
  const isListening = voiceState === 'LISTENING';
  const isProcessing = voiceState === 'PROCESSING';

  const samplePrompts = [
    "What products do you recommend for me?",
    "What's my preferred price range?",
    "Which category do I look at most?",
    "Which brands do I interact with the most?",
    "Why did you recommend this product?",
    "Show me products under my usual price range",
    "Which products are currently in my cart?",
    "Give me recommendations based on what I viewed"
  ];

  return (
    <div className={`border rounded-2xl p-5 shadow-md flex flex-col justify-between h-full min-h-[620px] relative overflow-hidden transition-all duration-300 ${
      isLight
        ? 'bg-white/95 backdrop-blur-md border-slate-200 shadow-slate-200/50'
        : 'bg-[#0a1630]/90 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-950/40'
    }`}>
      {/* Background ambient neon glow */}
      <div className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
        isListening ? 'opacity-60 bg-purple-600/40' : isProcessing ? 'opacity-50 bg-cyan-500/30' : 'opacity-25 bg-indigo-600/30'
      }`} />
      <div className={`absolute -bottom-24 -left-24 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
        isListening ? 'opacity-60 bg-cyan-500/40' : 'opacity-20 bg-purple-600/20'
      }`} />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-purple-500/20 border border-purple-400/40 flex items-center justify-center bg-slate-950">
              <img 
                src={assistantBotImg} 
                alt="AI Voice Avatar" 
                className="w-full h-full object-cover" 
              />
              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                isListening ? 'bg-emerald-400 animate-ping' : 'bg-purple-400'
              }`} />
            </div>
            <div>
              <h3 className={`text-sm font-bold font-['Outfit'] flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                AI Voice Assistant
                <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
              </h3>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Conversational Behavioral Intelligence
              </p>
            </div>
          </div>

          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 backdrop-blur-md transition-all ${
            isListening
              ? isLight ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm' : 'bg-purple-950/70 border-purple-500/50 text-purple-200 shadow-lg'
              : isProcessing
              ? isLight ? 'bg-cyan-50 border-cyan-300 text-cyan-700' : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200'
              : isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900/80 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isListening ? 'bg-purple-400 animate-ping' : isProcessing ? 'bg-cyan-400 animate-spin' : 'bg-slate-400'
            }`} />
            {isListening ? 'Listening...' : isProcessing ? 'Thinking...' : 'Ready'}
          </span>
        </div>

        {/* 3D Animated Robot Voice Visualizer */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center w-36 h-36">
            {/* Multi-layered Pulsing Sonic Rings (when listening) */}
            {isListening && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full border-2 border-purple-500/50 bg-gradient-to-r from-purple-600/10 via-cyan-500/10 to-indigo-600/10 pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [1, 1.75, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: 0.55, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full border border-cyan-400/40 bg-cyan-500/5 pointer-events-none"
                />
              </>
            )}

            {/* Glowing Orb Halo Backlight */}
            <div className={`absolute inset-2 rounded-full blur-xl transition-all duration-700 pointer-events-none ${
              isListening
                ? 'bg-gradient-to-tr from-purple-600 via-cyan-500 to-indigo-600 opacity-80 scale-110'
                : isProcessing
                ? 'bg-gradient-to-tr from-cyan-500 to-purple-600 opacity-60 animate-pulse'
                : 'bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 opacity-40'
            }`} />

            {/* Main Interactive Animated Robot Button */}
            <motion.button
              onClick={isListening ? stopListening : startListening}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isListening ? {
                y: [0, -4, 0],
                boxShadow: [
                  '0 0 25px rgba(168, 85, 247, 0.5)',
                  '0 0 40px rgba(6, 182, 212, 0.7)',
                  '0 0 25px rgba(168, 85, 247, 0.5)'
                ]
              } : {
                y: [0, -2, 0],
                boxShadow: '0 8px 20px -4px rgba(147, 51, 234, 0.3)'
              }}
              transition={{
                y: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                boxShadow: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
              }}
              className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 flex items-center justify-center cursor-pointer group z-10 transition-all focus:outline-none"
              title={isListening ? 'Click to stop listening' : 'Click to start voice query'}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#040816] relative flex items-center justify-center">
                <img
                  src={assistantBotImg}
                  alt="AI Voice Assistant"
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    isListening ? 'scale-105 contrast-110' : 'group-hover:scale-105'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/30 pointer-events-none rounded-full" />
                <AnimatePresence>
                  {isListening && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-1.5 inset-x-1.5 bg-rose-600/90 backdrop-blur-md py-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center gap-1 shadow-lg"
                    >
                      <MicOff className="w-2.5 h-2.5" /> Stop
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          </div>

          {/* Equalizer Soundwave */}
          <div className="flex items-center justify-center gap-1 h-6 my-2 px-4">
            {[30, 60, 20, 85, 40, 75, 95, 70, 35, 80, 25, 90, 45, 15].map((height, idx) => (
              <motion.span
                key={idx}
                animate={{
                  height: isListening 
                    ? [`${Math.max(15, height * 0.25)}%`, `${height}%`, `${Math.max(15, height * 0.25)}%`]
                    : isProcessing
                    ? [`${(idx % 3 + 1) * 20}%`, `${(idx % 4 + 1) * 25}%`, `${(idx % 3 + 1) * 20}%`]
                    : '18%'
                }}
                transition={{
                  repeat: Infinity,
                  duration: isListening ? 0.75 : 1.2,
                  delay: idx * 0.045,
                  ease: 'easeInOut'
                }}
                className={`w-1 rounded-full transition-colors duration-300 ${
                  isListening
                    ? idx % 2 === 0
                      ? 'bg-gradient-to-t from-purple-600 to-cyan-400'
                      : 'bg-gradient-to-t from-indigo-500 to-purple-400'
                    : isProcessing
                    ? 'bg-cyan-500'
                    : isLight
                    ? 'bg-slate-300'
                    : 'bg-purple-900/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-full py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-purple-400/30'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 animate-pulse" /> Stop Listening
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-cyan-300" /> Ask Voice Assistant
              </>
            )}
          </button>
        </div>

        {/* Suggested Voice Queries Chips */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-indigo-500" />
            Quick Voice Prompts
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => askQuestion && askQuestion(p)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border text-left transition-all ${
                  isLight
                    ? 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-700 hover:border-indigo-300'
                    : 'bg-slate-800/60 hover:bg-purple-950/40 border-slate-700/80 text-slate-300 hover:border-purple-500/40'
                }`}
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>

        {/* Chat Transcript Panel */}
        <div className={`space-y-2.5 pt-2 border-t text-xs ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
          {/* User Bubble */}
          <div className="flex items-start gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-600/30 text-blue-400'
            }`}>
              <User className="w-3 h-3" />
            </div>
            <div className={`border rounded-xl p-2 w-full text-xs ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#020817]/90 border-blue-500/20 text-slate-300'
            }`}>
              <div className="text-[9px] font-semibold text-indigo-500 mb-0.5">You asked:</div>
              <p className="italic">{transcript || "What products do you recommend for me?"}</p>
            </div>
          </div>

          {/* AI Response Bubble */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 mt-0.5 border border-purple-400/40 shadow-sm">
              <img src={assistantBotImg} alt="AI Bot" className="w-full h-full object-cover" />
            </div>
            <div className={`border rounded-xl p-2.5 w-full text-xs leading-relaxed ${
              isLight ? 'bg-purple-50/50 border-purple-200 text-slate-800' : 'bg-[#020817]/90 border-purple-500/20 text-slate-200'
            }`}>
              <div className="text-[9px] font-semibold text-purple-500 mb-0.5 flex items-center gap-1">
                <Bot className="w-3 h-3" /> AI Assistant Response:
              </div>
              <p>{spokenResponse || "Hello! Ask me about your product recommendations, preferred price range, top categories, or cart items."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Play Response Action Button */}
      {spokenResponse && (
        <button
          onClick={playResponse}
          className={`w-full mt-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
            isLight
              ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
              : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/30'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Repeat Voice Response</span>
        </button>
      )}
    </div>
  );
}
