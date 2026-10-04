import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Mic } from 'lucide-react';
import { getChatConfig } from '../../../config/configLoader';

export const ChatInput = ({ input, setInput, isLoading, onSubmit, onStop, voiceStatus = 'idle', onVoiceToggle }) => {
  const chatConfig = getChatConfig();
  const placeholder = chatConfig?.inputPlaceholder || 'Ask me anything...';

  const voiceActive = voiceStatus === 'live' || voiceStatus === 'connecting';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim());
    setInput('');
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-xl border border-blue-500/20"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent text-white rounded-lg px-4 py-2 focus:outline-none placeholder-gray-400 overflow-hidden text-ellipsis whitespace-nowrap"
        disabled={isLoading}
      />
      
      <motion.button
        type="button"
        onClick={onVoiceToggle}
        aria-label={voiceActive ? 'Stop voice chat' : 'Start voice chat'}
        aria-pressed={voiceActive}
        disabled={isLoading}
        whileTap={{ scale: 0.9 }}
        animate={voiceActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={voiceActive ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        className={`flex-shrink-0 p-3 rounded-full transition-colors duration-200 ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          voiceStatus === 'live'
            ? 'text-white bg-red-500 ring-red-300 shadow-lg shadow-red-500/40'
            : voiceStatus === 'connecting'
              ? 'text-white bg-amber-500 ring-amber-300 shadow-lg shadow-amber-500/30'
              : 'text-black bg-white ring-gray-300 hover:bg-gray-200'
        }`}
      >
        <Mic className="w-5 h-5" />
      </motion.button>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.button
            key="stop"
            type="button"
            aria-label="Stop generating"
            onClick={onStop}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex-shrink-0 text-black bg-white ring-1 ring-gray-300 hover:bg-gray-200 p-3 rounded-full transition-all duration-200"
          >
            <Square className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.button
            key="send"
            type="submit"
            aria-label="Send message"
            disabled={!input.trim()}
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex-shrink-0 text-black bg-white ring-1 ring-gray-300 hover:bg-gray-200 p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.form>
  );
}; 