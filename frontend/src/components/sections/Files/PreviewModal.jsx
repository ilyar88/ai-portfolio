/**
 * PreviewModal
 * ------------
 * Full-screen preview for one file. `‹` / `›` (and the ← / → arrow keys) page
 * through `files` - the other files in the same folder - wrapping at both ends.
 * Escape closes. Images sit in a resizable box (drag the bottom-right corner).
 */
import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import { fileUrl } from '../../../services/filesService'
import { IMAGE_EXT, TEXT_EXT } from './fileHelpers'

export const PreviewModal = ({ files, dirPath, startName, onClose }) => {
  const [idx, setIdx] = useState(() => {
    const i = files.findIndex((f) => f.name === startName)
    return i < 0 ? 0 : i
  })
  const [text, setText] = useState(null)

  const entry = files[idx]
  const item = {
    name: entry.name,
    ext: entry.ext,
    path: dirPath ? `${dirPath}/${entry.name}` : entry.name,
  }
  const url = fileUrl(item.path)
  const isImage = IMAGE_EXT.includes(item.ext)
  const isPdf = item.ext === 'pdf'
  const isText = TEXT_EXT.includes(item.ext)
  const multi = files.length > 1

  const prev = useCallback(() => setIdx((i) => (i - 1 + files.length) % files.length), [files.length])
  const next = useCallback(() => setIdx((i) => (i + 1) % files.length), [files.length])

  useEffect(() => {
    setText(null)
    if (!isText) return undefined
    let active = true
    fetch(url)
      .then((r) => r.text())
      .then((t) => { if (active) setText(t) })
      .catch(() => { if (active) setText('Failed to load file.') })
    return () => { active = false }
  }, [url, isText])

  // Arrow keys page through the folder; Escape closes.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-blue-500/30 rounded-lg max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-blue-500/20">
          <div className="flex items-center gap-2 min-w-0">
            {multi && (
              <>
                <button onClick={prev} aria-label="Previous file" className="shrink-0 text-gray-400 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={next} aria-label="Next file" className="shrink-0 text-gray-400 hover:text-white">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="shrink-0 text-xs text-gray-500">{idx + 1}/{files.length}</span>
              </>
            )}
            <span className="text-sm text-gray-200 font-mono truncate">{item.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
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
          {isImage && (
            // Drag the bottom-right corner to resize the preview.
            <div
              className="resize overflow-auto mx-auto rounded border border-blue-500/20 bg-black/30"
              style={{ width: '38rem', height: '60vh', maxWidth: '100%', minWidth: '12rem', minHeight: '8rem' }}
            >
              <img src={url} alt={item.name} className="w-full h-full object-contain" />
            </div>
          )}
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
  files: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, ext: PropTypes.string }),
  ).isRequired,
  dirPath: PropTypes.string.isRequired,
  startName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}
