/**
 * FileTiles
 * ---------
 * The entries of a folder as large glass tiles that fade in one after another.
 * Each tile previews its content: a thumbnail for images, the first page for
 * PDFs, the target site for .url shortcuts, an icon for anything else.
 *
 * `getPath` maps an entry to its path relative to the files root; `onOpen` is the
 * tile's click handler.
 */
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { fileUrl } from '../../../services/filesService'
import { IMAGE_EXT, displayName, iconFor, typeLabel } from './fileHelpers'

const STAGGER_S = 0.2

// Host of the link inside a .url shortcut, or null while loading / when unreadable.
const useShortcutHost = (path, enabled) => {
  const [host, setHost] = useState(null)
  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    fetch(fileUrl(path))
      .then((r) => r.text())
      .then((t) => {
        const link = t.match(/^URL=(.+)$/m)?.[1].trim()
        if (active && link) setHost(new URL(link).hostname.replace(/^www\./, ''))
      })
      .catch(() => {})
    return () => { active = false }
  }, [path, enabled])
  return host
}

const Preview = ({ entry, path }) => {
  const isUrl = entry.ext === 'url'
  const host = useShortcutHost(path, isUrl)
  const Icon = iconFor(entry)

  if (IMAGE_EXT.includes(entry.ext)) {
    return <img src={fileUrl(path)} alt={entry.name} loading="lazy" className="h-full w-full object-cover" />
  }
  if (entry.ext === 'pdf') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-white">
        <iframe
          title={entry.name}
          src={`${fileUrl(path)}#toolbar=0&navpanes=0&view=FitH`}
          className="pointer-events-none h-full w-full"
          tabIndex={-1}
        />
        <span className="absolute bottom-1.5 left-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">PDF</span>
      </div>
    )
  }
  if (isUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3">
        <ExternalLink className="h-10 w-10 text-blue-300" />
        <span className="max-w-full truncate text-xs text-blue-300/80">{host ?? 'Link'}</span>
      </div>
    )
  }
  return <Icon className={`h-16 w-16 ${entry.type === 'dir' ? 'text-blue-300' : 'text-gray-400'}`} />
}

Preview.propTypes = {
  entry: PropTypes.object.isRequired,
  path: PropTypes.string.isRequired,
}

export const FileTiles = ({ entries, getPath, onOpen }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    {entries.map((entry, i) => {
      const path = getPath(entry)
      return (
        <motion.div
          key={path}
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * STAGGER_S, duration: 0.45 }}
          className="relative"
        >
          <button
            type="button"
            onClick={() => onOpen(entry)}
            className="w-full rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-blue-900/10 p-3 text-center backdrop-blur-md transition hover:border-blue-300/80"
          >
            <div className="mb-2 flex h-32 items-center justify-center overflow-hidden rounded-xl border border-blue-400/20 bg-gray-950/70">
              <Preview entry={entry} path={path} />
            </div>
            <span className="block break-words text-xs leading-snug text-blue-50">{displayName(entry)}</span>
            <span className="mt-1.5 inline-block rounded-full border border-blue-300/40 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-blue-300/80">
              {typeLabel(entry)}
            </span>
          </button>
        </motion.div>
      )
    })}
  </div>
)

FileTiles.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
  getPath: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
}
