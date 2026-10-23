/**
 * FolderCards
 * -----------
 * The folders of the current directory as large frosted-glass cards. Clicking a
 * card fades all the cards out, then calls `onOpen` so the folder's files can
 * take their place (see {@link FileTiles}).
 */
import { useState } from 'react'
import PropTypes from 'prop-types'
import { Brain, Folder, FolderKanban, Package, Terminal } from 'lucide-react'

const OPEN_DELAY_MS = 300

// Known top-level folders get their own icon; any other folder falls back to Folder.
const FOLDER_ICONS = {
  'ai knowledge': Brain,
  'hands on': Terminal,
  products: Package,
  projects: FolderKanban,
}

export const FolderCards = ({ entries, onOpen }) => {
  const [leaving, setLeaving] = useState(false)

  const open = (entry) => {
    setLeaving(true)
    setTimeout(() => onOpen(entry), OPEN_DELAY_MS)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {entries.map((entry) => {
        const Icon = FOLDER_ICONS[entry.name.toLowerCase()] ?? Folder
        return (
          <button
            key={entry.name}
            type="button"
            onClick={() => open(entry)}
            className={`group relative h-44 overflow-hidden rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-blue-900/10 backdrop-blur-md text-left transition duration-300 hover:-translate-y-1 hover:border-blue-300/80 ${leaving ? 'opacity-0 scale-95 pointer-events-none' : ''}`}
          >
            <div className="absolute inset-3 rounded-xl border border-blue-400/20 bg-gray-950/60 p-3">
              <p className="mb-2 text-xs font-medium text-blue-50">{entry.name}</p>
              <div className="mb-1.5 h-1.5 w-3/4 rounded bg-blue-300/30" />
              <div className="mb-1.5 h-1.5 w-1/2 rounded bg-blue-300/30" />
              <div className="h-1.5 w-2/3 rounded bg-blue-300/30" />
            </div>
            <Icon className="absolute right-6 top-6 h-10 w-10 text-blue-300/50" />
            <span className="absolute bottom-4 right-4 rounded-full border border-blue-300/40 bg-blue-950/85 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-100">
              {entry.name}
              {entry.itemCount != null && <span className="ml-2 text-blue-300/70">{entry.itemCount}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

FolderCards.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
  onOpen: PropTypes.func.isRequired,
}
