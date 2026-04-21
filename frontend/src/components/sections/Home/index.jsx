import { motion } from 'framer-motion'
import { Terminal } from 'lucide-react'
import { ChatBox } from './ChatBox'
import { IntroSection } from './IntroSection'
import { getPersonalInfo } from '../../../config/configLoader'

export const HomeSection = () => {
  const personalInfo = getPersonalInfo();
  
  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-center"
    >
      <motion.div 
        className="mb-4 relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
      >
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-blue-500 relative">
          <img
            src="/profile.jpg"
            alt={personalInfo.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-4xl md:text-5xl font-bold mb-2 text-white leading-relaxed px-4 py-1"
      >
        {personalInfo.name}
      </motion.h1>
      
      <IntroSection />

      <div className="inline-flex items-center gap-2 px-4 py-1.5 mt-1 mb-1 rounded-full border border-green-400/40 bg-green-400/10 backdrop-blur-sm shadow-[0_0_12px_rgba(74,222,128,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(74,222,128,0.45)] cursor-default group">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
        </span>
        <p className="text-base font-semibold text-green-400 tracking-widest uppercase">Open to work</p>
      </div>

      <ChatBox />

    </motion.div>
  )
} 