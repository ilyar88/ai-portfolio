/**
 * FilesSection
 * ------------
 * A read-only file explorer for the backend's FILES_ROOT (defaults to
 * `backend/docs`). Reached from the "Knowledge and experience" nav item.
 *
 * The current folder lives in the URL (`/files/<path>`), so the browser back
 * button and deep links work. Clicking a folder row navigates into it; clicking
 * a file row opens a preview ({@link PreviewModal}).
 *
 * Folders at every level show as glass cards ({@link FolderCards}); the files of a
 * folder appear one after another as preview tiles ({@link FileTiles}).
 * Markdown notes are left out of that view; search still finds them.
 *
 * The mic button next to Search turns on a Gemini voice guide; while it is on,
 * opening a folder makes Gemini explain what is inside it once.
 *
 * Helpers live in `./fileHelpers`; the preview dialog in `./PreviewModal`.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Home, Mic, Search } from 'lucide-react'
import { useVoiceChat } from '../../../hooks/useVoiceChat'
import { listDir, searchFiles } from '../../../services/filesService'
import { openShortcut } from './fileHelpers'
import { FileTiles } from './FileTiles'
import { FilesTable } from './filesTable'
import { FolderCards } from './FolderCards'
import { PreviewModal } from './PreviewModal'

export const FilesSection = () => {
  const params = useParams()
  const navigate = useNavigate()
  const path = params['*'] || ''

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const { status: voiceStatus, toggle: toggleVoice, send: sendVoice } = useVoiceChat({ guide: true })
  const [preview, setPreview] = useState(null)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchPreview, setSearchPreview] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setPreview(null)
    listDir(path)
      .then((res) => { if (active) setData(res) })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [path])

  const go = useCallback((p) => navigate(`/files${p ? `/${p}` : ''}`), [navigate])

  // Files in the current folder - the preview modal pages back/forward through these.
  const fileEntries = (data?.entries ?? []).filter((e) => e.type === 'file')
  const visibleEntries = (data?.entries ?? []).filter((e) => e.ext !== 'md')
  const folderCards = visibleEntries.filter((e) => e.type === 'dir')
  const tileEntries = visibleEntries.filter((e) => e.type !== 'dir')
  const entryPath = (entry) => (path ? `${path}/${entry.name}` : entry.name)

  const openEntry = (entry) => {
    if (entry.type === 'dir') {
      const folder = path ? `${path}/${entry.name}` : entry.name
      sendVoice({ type: 'explain', path: folder })
      go(folder)
    } else if (entry.ext === 'url') openShortcut(path ? `${path}/${entry.name}` : entry.name)
    else setPreview(entry.name)
  }

  const clearSearch = () => {
    setQuery('')
    setSearchResults(null)
    setSearchError(null)
  }

  const runSearch = () => {
    const q = query.trim()
    if (!q) { setSearchResults(null); setSearchError(null); return }
    setSearchLoading(true)
    setSearchError(null)
    searchFiles(q)
      .then((res) => setSearchResults(res.entries))
      .catch((e) => setSearchError(e.message))
      .finally(() => setSearchLoading(false))
  }

  const openSearchEntry = (entry) => {
    if (entry.type === 'dir') { clearSearch(); go(entry.path) }
    else if (entry.ext === 'url') openShortcut(entry.path)
    else setSearchPreview(entry)
  }

  return (
    <motion.div
      key="files"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto pb-12"
    >
      {/* Search */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runSearch() }}
          placeholder="Search files and folders…"
          className="flex-1 rounded-md bg-gray-900/80 border border-blue-500/30 px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={runSearch}
          className="flex items-center gap-1 rounded-md border border-blue-500/30 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:border-blue-400"
        >
          <Search className="w-4 h-4" /> Search
        </button>
        <button
          onClick={toggleVoice}
          aria-label={voiceStatus === 'idle' || voiceStatus === 'error' ? 'Start folder voice guide' : 'Stop folder voice guide'}
          aria-pressed={voiceStatus === 'live' || voiceStatus === 'connecting'}
          className={`rounded-md border px-2 py-1.5 ${voiceStatus === 'live' ? 'border-red-400 text-red-400 animate-pulse' : voiceStatus === 'connecting' ? 'border-yellow-400 text-yellow-400' : 'border-blue-500/30 text-blue-400 hover:text-blue-300 hover:border-blue-400'}`}
        >
          <Mic className="w-4 h-4" />
        </button>
        {searchResults != null && (
          <button onClick={clearSearch} className="text-sm text-gray-400 hover:text-gray-200">
            Clear
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-sm mb-4 font-mono">
        <button onClick={() => go('')} className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
          <Home className="w-4 h-4" /> {data?.root ?? 'Files'}
        </button>
        {data?.breadcrumb?.map((c) => (
          <span key={c.path} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <button onClick={() => go(c.path)} className="text-blue-400 hover:text-blue-300">{c.name}</button>
          </span>
        ))}
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-gray-900/80 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-blue-500/20">
          <span className="text-xs uppercase tracking-wider text-gray-400">
            {searchResults != null
              ? (searchLoading ? 'Searching…' : `${searchResults.length} match${searchResults.length === 1 ? '' : 'es'}`)
              : (loading ? 'Loading…' : `${visibleEntries.length} items`)}
          </span>
          {searchResults == null && path && (
            <button
              onClick={() => go(data?.parent || '')}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft className="w-4 h-4" /> Up
            </button>
          )}
        </div>

        {searchResults != null ? (
          <>
            {searchError && <div className="p-6 text-red-400 text-sm">{searchError}</div>}
            {!searchError && (
              <FilesTable
                search
                entries={searchResults}
                getPath={(entry) => entry.path}
                onOpen={openSearchEntry}
                showEmpty={!searchLoading}
                emptyText="No matches"
              />
            )}
          </>
        ) : (
          <>
            {error && <div className="p-6 text-red-400 text-sm">{error}</div>}

            {!error && !loading && (
              <div className="space-y-4 p-4">
                {folderCards.length > 0 && <FolderCards entries={folderCards} onOpen={openEntry} />}
                {tileEntries.length > 0 && (
                  <FileTiles key={path} entries={tileEntries} getPath={entryPath} onOpen={openEntry} />
                )}
                {visibleEntries.length === 0 && (
                  <div className="py-6 text-center text-gray-500">Empty folder</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {preview != null && fileEntries.length > 0 && (
        <PreviewModal
          files={fileEntries.filter((e) => e.ext !== 'url')}
          dirPath={path}
          startName={preview}
          onClose={() => setPreview(null)}
        />
      )}

      {searchPreview != null && (
        <PreviewModal
          files={[searchPreview]}
          dirPath={searchPreview.dir}
          startName={searchPreview.name}
          onClose={() => setSearchPreview(null)}
        />
      )}
    </motion.div>
  )
}
