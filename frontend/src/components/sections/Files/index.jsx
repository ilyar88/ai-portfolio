/**
 * FilesSection
 * ------------
 * A read-only file explorer for the backend's FILES_ROOT (defaults to
 * `frontend/public`). Reached from the "Knowledge and experience" nav item.
 *
 * The current folder lives in the URL (`/files/<path>`), so the browser back
 * button and deep links work. Clicking a folder row navigates into it; clicking
 * a file row opens a preview ({@link PreviewModal}).
 *
 * Helpers live in `./fileHelpers`; the preview dialog in `./PreviewModal`.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Download, Home, Search } from 'lucide-react'
import { fileUrl, listDir, searchFiles } from '../../../services/filesService'
import { formatDate, formatSize, iconFor, typeLabel } from './fileHelpers'
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

  const openEntry = (entry) => {
    if (entry.type === 'dir') go(path ? `${path}/${entry.name}` : entry.name)
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
              : (loading ? 'Loading…' : `${data?.entries?.length ?? 0} items`)}
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-blue-500/20">
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Location</th>
                      <th className="px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                      <th className="px-4 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((entry) => {
                      const Icon = iconFor(entry)
                      return (
                        <tr
                          key={entry.path}
                          className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                          onClick={() => openSearchEntry(entry)}
                        >
                          <td className="px-4 py-2">
                            <span className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${entry.type === 'dir' ? 'text-blue-400' : 'text-gray-400'}`} />
                              <span className="text-gray-200">{entry.name}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-400 font-mono">/{entry.dir}</td>
                          <td className="px-4 py-2 text-gray-400 hidden sm:table-cell">{typeLabel(entry)}</td>
                          <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => openSearchEntry(entry)} className="text-blue-400 hover:text-blue-300">
                                Open
                              </button>
                              {entry.type === 'file' && (
                                <a
                                  href={fileUrl(entry.path, true)}
                                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {!searchLoading && searchResults.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No matches</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {error && <div className="p-6 text-red-400 text-sm">{error}</div>}

            {!error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-blue-500/20">
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                      <th className="px-4 py-2 font-medium hidden sm:table-cell">Size</th>
                      <th className="px-4 py-2 font-medium hidden md:table-cell">Modified</th>
                      <th className="px-4 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.entries?.map((entry) => {
                      const Icon = iconFor(entry)
                      const childPath = path ? `${path}/${entry.name}` : entry.name
                      return (
                        <tr
                          key={entry.name}
                          className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                          onClick={() => openEntry(entry)}
                        >
                          <td className="px-4 py-2">
                            <span className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${entry.type === 'dir' ? 'text-blue-400' : 'text-gray-400'}`} />
                              <span className="text-gray-200">{entry.name}</span>
                              {entry.type === 'dir' && entry.itemCount != null && (
                                <span className="text-xs text-gray-500">({entry.itemCount})</span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-400 hidden sm:table-cell">{typeLabel(entry)}</td>
                          <td className="px-4 py-2 text-gray-400 hidden sm:table-cell">
                            {entry.type === 'dir' ? '—' : formatSize(entry.size)}
                          </td>
                          <td className="px-4 py-2 text-gray-400 hidden md:table-cell">{formatDate(entry.modified)}</td>
                          <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => openEntry(entry)} className="text-blue-400 hover:text-blue-300">
                                Open
                              </button>
                              {entry.type === 'file' && (
                                <a
                                  href={fileUrl(childPath, true)}
                                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {!loading && !error && data?.entries?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Empty folder</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {preview != null && fileEntries.length > 0 && (
        <PreviewModal
          files={fileEntries}
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
