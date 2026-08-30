import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import '../../../test/mocks';
import { renderWithConfig } from '../../../test/testUtils';
import { FilesSection } from './index';
import { listDir } from '../../../services/filesService';

// The explorer talks to the backend through filesService; stub it.
vi.mock('../../../services/filesService', () => ({
  listDir: vi.fn(),
  fileUrl: vi.fn((path, download) => `http://api/files/raw?path=${path}${download ? '&download=true' : ''}`),
}));

// FilesSection reads the current folder from the router and navigates on click.
const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ '*': '' }),
  useNavigate: () => navigate,
}));

const listing = {
  root: 'public',
  path: '',
  parent: null,
  breadcrumb: [],
  entries: [
    { name: 'AI pictures', type: 'dir', size: null, modified: '2026-01-01T00:00:00Z', ext: '', itemCount: 2 },
    { name: 'CV.pdf', type: 'file', size: 2048, modified: '2026-01-02T00:00:00Z', ext: 'pdf', itemCount: null },
  ],
};

describe('FilesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders folder and file rows returned by listDir', async () => {
    vi.mocked(listDir).mockResolvedValue(listing);

    renderWithConfig(<FilesSection />);

    expect(await screen.findByText('AI pictures')).toBeInTheDocument();
    expect(screen.getByText('CV.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF file')).toBeInTheDocument();
    expect(listDir).toHaveBeenCalledWith('');
  });

  it('offers a download link only for files', async () => {
    vi.mocked(listDir).mockResolvedValue(listing);

    renderWithConfig(<FilesSection />);
    await screen.findByText('AI pictures');

    const downloadLinks = screen.getAllByText('Download');
    expect(downloadLinks).toHaveLength(1);
    expect(downloadLinks[0].closest('a')).toHaveAttribute(
      'href',
      'http://api/files/raw?path=CV.pdf&download=true',
    );
  });

  it('shows the error message when the listing fails', async () => {
    vi.mocked(listDir).mockRejectedValue(new Error('Path not found'));

    renderWithConfig(<FilesSection />);

    expect(await screen.findByText('Path not found')).toBeInTheDocument();
  });
});
