import { motion } from 'framer-motion'

export const BlogSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[50vh]"
    >
      <img src="/Building AI agents for testing.png" alt="Blog" className="max-w-2xl w-full rounded-xl mb-4" />
      <p className="text-gray-400">Coming Soon!</p>
    </motion.div>
  )
} 