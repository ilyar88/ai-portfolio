import { File, FileText, Folder, Image as ImageIcon } from 'lucide-react'

export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']
export const TEXT_EXT = ['md', 'txt', 'json', 'log', 'csv', 'yml', 'yaml', 'xml', 'js', 'jsx', 'css', 'html']

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
  if (IMAGE_EXT.includes(entry.ext)) return ImageIcon
  if (entry.ext === 'pdf' || TEXT_EXT.includes(entry.ext)) return FileText
  return File
}
