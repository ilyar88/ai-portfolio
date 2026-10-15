/**
 * FilesTable
 * ----------
 * The table shared by the folder listing and the search results: one row per
 * entry with its open / download / zip / copy-url actions.
 *
 * `search` switches the Modified column for a Location column. `getPath` maps an
 * entry to its path relative to the files root; `onOpen` is the row/Open handler.
 */
import PropTypes from 'prop-types'
import { Download } from 'lucide-react'
import { fileUrl, zipUrl } from '../../../services/filesService'
import { copyShortcut, displayName, formatDate, iconFor, typeLabel } from './fileHelpers'

const LINK = 'text-blue-400 hover:text-blue-300'

export const FilesTable = ({ entries, search = false, getPath, onOpen, showEmpty, emptyText }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-400 border-b border-blue-500/20">
          <th className="px-4 py-2 font-medium">Name</th>
          {search && <th className="px-4 py-2 font-medium">Location</th>}
          <th className="px-4 py-2 font-medium hidden sm:table-cell">Type</th>
          {!search && <th className="px-4 py-2 font-medium hidden md:table-cell">Modified</th>}
          <th className="px-4 py-2 font-medium text-left">
            <div className="flex gap-3"><span className="w-16">Open</span><span>Actions</span></div>
          </th>
        </tr>
      </thead>
      <tbody>
        {entries?.map((entry) => {
          const Icon = iconFor(entry)
          const path = getPath(entry)
          return (
            <tr
              key={path}
              className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
              onClick={() => onOpen(entry)}
            >
              <td className="px-4 py-2">
                <span className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${entry.type === 'dir' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span className="text-gray-200">{displayName(entry)}</span>
                  {!search && entry.type === 'dir' && entry.itemCount != null && (
                    <span className="text-xs text-gray-500">({entry.itemCount})</span>
                  )}
                </span>
              </td>
              {search && <td className="px-4 py-2 text-gray-400 font-mono whitespace-nowrap">/{entry.dir}</td>}
              <td className="px-4 py-2 text-gray-400 whitespace-nowrap hidden sm:table-cell">{typeLabel(entry)}</td>
              {!search && (
                <td className="px-4 py-2 text-gray-400 whitespace-nowrap hidden md:table-cell">{formatDate(entry.modified)}</td>
              )}
              <td className="px-4 py-2 text-left whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-start gap-3">
                  <button onClick={() => onOpen(entry)} className={`w-16 text-left ${LINK}`}>
                    {entry.ext === 'url' ? 'Open url' : 'Open'}
                  </button>
                  {entry.type === 'file' && entry.ext !== 'url' && (
                    <a href={fileUrl(path, true)} className={`${LINK} flex items-center gap-1`}>
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                  {entry.ext === 'url' && (
                    <button onClick={(e) => copyShortcut(path, e.currentTarget)} className={LINK}>Copy url</button>
                  )}
                  {entry.type === 'dir' && (
                    <a href={zipUrl(path)} className={`${LINK} flex items-center gap-1`}>
                      <Download className="w-3.5 h-3.5" /> ZIP
                    </a>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
        {showEmpty && entries?.length === 0 && (
          <tr>
            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">{emptyText}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)

FilesTable.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.object),
  search: PropTypes.bool,
  getPath: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  showEmpty: PropTypes.bool,
  emptyText: PropTypes.string,
}
