const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * List one directory under the backend's FILES_ROOT (defaults to frontend/public).
 * @param {string} path - relative path, "" for the root folder
 * @returns {Promise<{path:string, parent:string|null, breadcrumb:{name:string,path:string}[], entries:object[]}>}
 */
export const listDir = async (path = '') => {
  let res;
  try {
    res = await fetch(`${BACKEND_URL}/files/list?path=${encodeURIComponent(path)}`);
  } catch {
    throw new Error(`Can't reach the file service at ${BACKEND_URL} - is the backend running?`);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // FastAPI answers unknown routes with {"detail":"Not Found"} - the backend is
    // up but has no /files endpoint (older build); its own errors say "... not found".
    if (res.status === 404 && err.detail === 'Not Found') {
      throw new Error('Backend has no /files endpoint - rebuild/restart it to pick up the file browser routes.');
    }
    throw new Error(err.detail || `File service error (${res.status})`);
  }
  return res.json();
};

/** URL that streams a single file, inline for preview or as an attachment. */
export const fileUrl = (path, download = false) =>
  `${BACKEND_URL}/files/raw?path=${encodeURIComponent(path)}${download ? '&download=true' : ''}`;
