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
 * Folders show as glass cards and files as preview tiles ({@link FolderView}).
 * Markdown notes are left out of that view; search still finds them.
 *
 * Helpers live in `./fileHelpers`; the preview dialog in `./PreviewModal`.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Home, Search } from 'lucide-react'
import { listDir, searchFiles } from '../../../services/filesService'
import { openShortcut } from './fileHelpers'
import { FilesTable } from './filesTable'
import { FolderView } from './FolderView'
import { PreviewModal } from './PreviewModal'

export const FilesSection = () => {
  const params = useParams()
  const navigate = useNavigate()
  const path = params['*'] || ''

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
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

  const openEntry = (entry) => {
    if (entry.type === 'dir') go(path ? `${path}/${entry.name}` : entry.name)
    else if (entry.ext === 'url') openShortcut(path ? `${path}/${entry.name}` : entry.name)
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
              <FolderView
                key={path}
                root={path === ''}
                entries={visibleEntries}
                getPath={(entry) => (path ? `${path}/${entry.name}` : entry.name)}
                onOpen={openEntry}
              />
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
