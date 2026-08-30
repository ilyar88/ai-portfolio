const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * List one directory under the backend's FILES_ROOT (defaults to frontend/public).
 * @param {string} path - relative path, "" for the root folder
 * @returns {Promise<{path:string, parent:string|null, breadcrumb:{name:string,path:string}[], entries:object[]}>}
 */
export const listDir = async (path = '') => {
  const res = await fetch(`${BACKEND_URL}/files/list?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load folder');
  }
  return res.json();
};

/** URL that streams a single file, inline for preview or as an attachment. */
export const fileUrl = (path, download = false) =>
  `${BACKEND_URL}/files/raw?path=${encodeURIComponent(path)}${download ? '&download=true' : ''}`;
