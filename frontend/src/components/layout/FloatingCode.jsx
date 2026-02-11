import { motion } from 'framer-motion'
import { useMemo } from 'react'

const keywords = [
  'Playwright', 'Selenium', 'GitHub Actions', 'Jenkins',
  'Azure DevOps', 'Maven', 'Python', 'SQL', 'Postman',
  'Playwright', 'Selenium', 'GitHub Actions', 'Jenkins',
  'Azure DevOps', 'Maven', 'Python', 'SQL', 'Postman',
]

export const FloatingCode = () => {
  const items = useMemo(() => {
    return keywords.map((text, i) => ({
      text,
      left: `${(i * 5.2 + Math.random() * 3) % 95}%`,
      top: `${(i * 5.5 + Math.random() * 3) % 95}%`,
      size: Math.random() * 0.5 + 0.75,
      duration: Math.random() * 25 + 20,
      delay: Math.random() * -15,
      dx: (Math.random() - 0.5) * 160,
      dy: (Math.random() - 0.5) * 160,
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {items.map((item, i) => (
        <motion.span
          key={i}
          className="absolute font-mono font-bold text-white/[0.15] select-none whitespace-nowrap"
          style={{
            left: item.left,
            top: item.top,
            fontSize: `${item.size}rem`,
          }}
          animate={{
            x: [0, item.dx, -item.dx * 0.6, item.dx * 0.3, 0],
            y: [0, -item.dy * 0.5, item.dy, -item.dy * 0.4, 0],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {item.text}
        </motion.span>
      ))}
    </div>
  )
}
