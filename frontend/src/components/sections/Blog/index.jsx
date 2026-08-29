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
      <img src={images[index]} alt="Blog" className="rounded-xl mb-4" />
      <div className="flex gap-4">
        <button
          onClick={() => setIndex((index - 1 + images.length) % images.length)}
          aria-label="Previous"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-green-500/40 text-2xl text-green-500 transition-all duration-200 hover:bg-green-500/10 hover:border-green-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 active:scale-95"
        >
          ←
        </button>
        <button
          onClick={() => setIndex((index + 1) % images.length)}
          aria-label="Next"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-green-500/40 text-2xl text-green-500 transition-all duration-200 hover:bg-green-500/10 hover:border-green-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 active:scale-95"
        >
          →
        </button>
      </div>
    </motion.div>
  )
}