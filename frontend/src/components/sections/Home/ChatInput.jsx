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
        className={`flex-shrink-0 p-3 rounded-lg transition-colors duration-200 ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          voiceActive
            ? 'text-white bg-gradient-to-r from-red-500/80 to-orange-500/80 ring-red-400/40 shadow-lg shadow-red-500/20'
            : 'text-orange-300/90 bg-orange-400/10 ring-orange-400/30 hover:text-orange-200 hover:bg-orange-400/20'
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
            className="flex-shrink-0 bg-gradient-to-r from-red-500/80 to-orange-500/80 text-white p-3 rounded-lg transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:from-red-500/90 hover:to-orange-500/90"
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
            className="flex-shrink-0 bg-gradient-to-r from-orange-400 to-amber-300 text-white p-3 rounded-lg transition-all duration-200 shadow-lg shadow-orange-400/30 hover:shadow-orange-400/40 hover:from-orange-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.form>
  );
}; 