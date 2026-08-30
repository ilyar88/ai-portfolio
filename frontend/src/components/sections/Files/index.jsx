/**
 * FilesSection
 * ------------
 * A read-only file explorer for the backend's FILES_ROOT (defaults to
 * `frontend/public`). Reached from the "Knowledge and experience" nav item.
 *
 * The current folder lives in the URL (`/files/<path>`), so the browser back
 * button and deep links work. Clicking a folder row navigates into it; clicking
 * a file row opens a preview (image / PDF / text) with a download option.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import { ArrowLeft, ChevronRight, Download, File, FileText, Folder, Home, Image as ImageIcon, X } from 'lucide-react'
import { fileUrl, listDir } from '../../../services/filesService'

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']
const TEXT_EXT = ['md', 'txt', 'json', 'log', 'csv', 'yml', 'yaml', 'xml', 'js', 'jsx', 'css', 'html']

const formatSize = (bytes) => {
  if (bytes == null) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }
  return `${n.toFixed(i > 0 && n < 10 ? 1 : 0)} ${units[i]}`
}

const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const typeLabel = (entry) => {
  if (entry.type === 'dir') return 'Folder'
  if (!entry.ext) return 'File'
  if (IMAGE_EXT.includes(entry.ext)) return `${entry.ext.toUpperCase()} image`
  return `${entry.ext.toUpperCase()} file`
}

const iconFor = (entry) => {
  if (entry.type === 'dir') return Folder
  if (IMAGE_EXT.includes(entry.ext)) return ImageIcon
  if (entry.ext === 'pdf' || TEXT_EXT.includes(entry.ext)) return FileText
  return File
}

const PreviewModal = ({ item, onClose }) => {
  const [text, setText] = useState(null)
  const url = fileUrl(item.path)
  const isImage = IMAGE_EXT.includes(item.ext)
  const isPdf = item.ext === 'pdf'
  const isText = TEXT_EXT.includes(item.ext)

  useEffect(() => {
    if (!isText) return undefined
    let active = true
    fetch(url)
      .then((r) => r.text())
      .then((t) => { if (active) setText(t) })
      .catch(() => { if (active) setText('Failed to load file.') })
    return () => { active = false }
  }, [url, isText])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-blue-500/30 rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-blue-500/20">
          <span className="text-sm text-gray-200 font-mono truncate">{item.name}</span>
          <div className="flex items-center gap-3">
            <a
              href={fileUrl(item.path, true)}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
            >
              <Download className="w-4 h-4" /> Download
            </a>
            <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-auto p-4">
          {isImage && <img src={url} alt={item.name} className="max-w-full mx-auto rounded" />}
          {isPdf && <iframe src={url} title={item.name} className="w-full h-[70vh] rounded bg-white" />}
          {isText && (
            <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">{text ?? 'Loading…'}</pre>
          )}
          {!isImage && !isPdf && !isText && (
            <p className="text-gray-400 text-sm">No preview available. Use Download to view this file.</p>
          )}
        </div>
      </div>
    </div>
  )
}

PreviewModal.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    ext: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
}

export const FilesSection = () => {
  const params = useParams()
  const navigate = useNavigate()
  const path = params['*'] || ''

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    listDir(path)
      .then((res) => { if (active) setData(res) })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [path])

  const go = useCallback((p) => navigate(`/files${p ? `/${p}` : ''}`), [navigate])

  const openEntry = (entry) => {
    const childPath = path ? `${path}/${entry.name}` : entry.name
    if (entry.type === 'dir') go(childPath)
    else setPreview({ name: entry.name, ext: entry.ext, path: childPath })
  }

  return (
    <motion.div
      key="files"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto pb-12"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-sm mb-4 font-mono">
        <button onClick={() => go('')} className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
          <Home className="w-4 h-4" /> public
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
            {loading ? 'Loading…' : `${data?.entries?.length ?? 0} items`}
          </span>
          {path && (
            <button
              onClick={() => go(data?.parent || '')}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft className="w-4 h-4" /> Up
            </button>
          )}
        </div>

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
      </div>

      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}
    </motion.div>
  )
}