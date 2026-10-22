/**
 * FolderView
 * ----------
 * The current folder as glass tiles that fade in one after another. At the top
 * level folders are tall cards; each file tile previews its content (image
 * thumbnail, first PDF page, or an icon). Clicking a folder card fades the cards
 * out before `onOpen` runs.
 */
import { useState } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { fileUrl } from '../../../services/filesService'
import { IMAGE_EXT, displayName, iconFor } from './fileHelpers'

const GLASS = 'rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-blue-900/10 backdrop-blur-md hover:border-blue-300/80'

const Preview = ({ entry, path }) => {
  const Icon = iconFor(entry)
  if (IMAGE_EXT.includes(entry.ext)) return <img src={fileUrl(path)} alt={entry.name} className="h-full w-full object-cover" />
  if (entry.ext === 'pdf') {
    return <iframe title={entry.name} src={`${fileUrl(path)}#toolbar=0&navpanes=0`} className="pointer-events-none h-full w-full bg-white" tabIndex={-1} />
  }
  return <Icon className="h-14 w-14 text-blue-300" />
}

Preview.propTypes = { entry: PropTypes.object.isRequired, path: PropTypes.string.isRequired }

export const FolderView = ({ entries, root, getPath, onOpen }) => {
  const [leaving, setLeaving] = useState(false)

  const open = (entry) => {
    if (entry.type !== 'dir') return onOpen(entry)
    setLeaving(true)
    return setTimeout(() => onOpen(entry), 300)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
      {entries.map((entry, i) => {
        const card = root && entry.type === 'dir'
        const Icon = iconFor(entry)
        return (
          <motion.button
            key={entry.name}
            type="button"
            onClick={() => open(entry)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: leaving ? 0 : 1, y: 0 }}
            transition={{ delay: leaving ? 0 : i * 0.2 }}
            className={`${GLASS} p-3 text-center ${card ? 'h-40 flex flex-col items-center justify-center gap-3' : ''}`}
          >
            {card ? <Icon className="h-12 w-12 text-blue-300" /> : (
              <div className="mb-2 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-gray-950/70">
                <Preview entry={entry} path={getPath(entry)} />
              </div>
            )}
            <span className="block break-words text-xs text-blue-50">{displayName(entry)}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

FolderView.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
  root: PropTypes.bool,
  getPath: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
}
