/**
 * BlogSection
 * -----------
 * Renders the "Blog" area of the portfolio as a simple image gallery.
 *
 * Images are loaded at build time from `frontend/public/AI pictures/*.png`
 * (Vite `import.meta.glob`). The `/public` prefix is stripped so each image is
 * served from `/AI pictures/<name>.png` at runtime. Add or remove pictures by
 * dropping/deleting PNG files in that folder - no code change required.
 *
 * The two buttons below the image step through the gallery, wrapping around at
 * both ends. Their arrow glyphs use `text-6xl` so the controls are large and
 * easy to hit; only the arrow size/design was tuned here, navigation logic is
 * unchanged.
 */
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
      {/* Gallery navigation: prev/next step through `images`, wrapping at both ends.
          Arrows sized with `text-6xl` (was `text-4xl`) for a larger, easier tap target. */}
      <div className="flex gap-6">
        {/* Previous image */}
        <button onClick={() => setIndex((index - 1 + images.length) % images.length)} className="text-6xl text-green-500">←</button>
        {/* Next image */}
        <button onClick={() => setIndex((index + 1) % images.length)} className="text-6xl text-green-500">→</button>
      </div>
    </motion.div>
  )
}