import { useState } from 'react'
import { motion } from 'framer-motion'

const imageModules = import.meta.glob('/public/AI pictures/*.png', { eager: true })
const images = Object.keys(imageModules).map(path => path.replace('/public', ''))

export const BlogSection = () => {
  const [index, setIndex] = useState(0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[50vh]"
    >
      <img src={images[index]} alt="Blog" className="max-w-2xl w-full rounded-xl mb-4" />
      <div className="flex gap-6">
        <button onClick={() => setIndex((index - 1 + images.length) % images.length)} className="text-4xl text-green-500">←</button>
        <button onClick={() => setIndex((index + 1) % images.length)} className="text-4xl text-green-500">→</button>
      </div>
    </motion.div>
  )
}