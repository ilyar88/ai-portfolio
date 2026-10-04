import { File, FileText, Folder, Image as ImageIcon, Link } from 'lucide-react'
import { fileUrl } from '../../../services/filesService'

export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']
export const TEXT_EXT = ['md', 'txt', 'json', 'log', 'csv', 'yml', 'yaml', 'xml', 'js', 'jsx', 'css', 'html']
export const WORD_EXT = ['docx']

// Internet shortcuts (.url) show without the extension and open their link in a new tab.
export const displayName = (entry) => (entry.ext === 'url' ? entry.name.replace(/\.url$/i, '') : entry.name)

export const openShortcut = (path) => {
  const tab = window.open('', '_blank') // opened up front so the popup blocker allows it
  fetch(fileUrl(path))
    .then((r) => r.text())
    .then((t) => {
      const link = t.match(/^URL=(.+)$/m)?.[1].trim()
      if (link && tab) { tab.opener = null; tab.location.href = link } else tab?.close()
    })
    .catch(() => tab?.close())
}

export const formatSize = (bytes) => {
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

export const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export const typeLabel = (entry) => {
  if (entry.type === 'dir') return 'Folder'
  if (!entry.ext) return 'File'
  if (IMAGE_EXT.includes(entry.ext)) return `${entry.ext.toUpperCase()} image`
  return `${entry.ext.toUpperCase()} file`
}

export const iconFor = (entry) => {
  if (entry.type === 'dir') return Folder
  if (entry.ext === 'url') return Link
  if (IMAGE_EXT.includes(entry.ext)) return ImageIcon
  if (entry.ext === 'pdf' || WORD_EXT.includes(entry.ext) || TEXT_EXT.includes(entry.ext)) return FileText
  return File
}
