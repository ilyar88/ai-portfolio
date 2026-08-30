import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listDir, fileUrl } from './filesService';

describe('filesService', () => {
  globalThis.fetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listDir', () => {
    it('returns the parsed listing on success', async () => {
      const listing = { path: '', parent: null, breadcrumb: [], entries: [] };
      globalThis.fetch.mockResolvedValue(new Response(JSON.stringify(listing)));

      await expect(listDir('')).resolves.toEqual(listing);
      expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:8000/files/list?path=');
    });

    it('explains that the backend is unreachable when fetch rejects', async () => {
      globalThis.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(listDir('')).rejects.toThrow(/Can't reach the file service/);
    });

    it('explains a missing /files route (FastAPI "Not Found")', async () => {
      globalThis.fetch.mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Not Found' }), { status: 404 }),
      );

      await expect(listDir('')).rejects.toThrow(/no \/files endpoint/);
    });

    it('surfaces the backend detail for its own errors', async () => {
      globalThis.fetch.mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Path not found' }), { status: 404 }),
      );

      await expect(listDir('bogus')).rejects.toThrow('Path not found');
    });
  });

  describe('fileUrl', () => {
    it('builds inline and download URLs', () => {
      expect(fileUrl('a/b.png')).toBe('http://localhost:8000/files/raw?path=a%2Fb.png');
      expect(fileUrl('a/b.png', true)).toBe(
        'http://localhost:8000/files/raw?path=a%2Fb.png&download=true',
      );
    });
  });
});
