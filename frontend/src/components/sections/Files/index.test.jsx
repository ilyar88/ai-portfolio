import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import '../../../test/mocks';
import { renderWithConfig } from '../../../test/testUtils';
import { FilesSection } from './index';
import { listDir } from '../../../services/filesService';

// The explorer talks to the backend through filesService; stub it.
vi.mock('../../../services/filesService', () => ({
  listDir: vi.fn(),
  fileUrl: vi.fn((path, download) => `http://api/files/raw?path=${path}${download ? '&download=true' : ''}`),
  zipUrl: vi.fn((path) => `http://api/files/zip?path=${path}`),
}));

// FilesSection reads the current folder from the router and navigates on click.
const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ '*': '' }),
  useNavigate: () => navigate,
}));

const listing = {
  root: 'docs',
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

  it('renders folders as cards and files as tiles returned by listDir', async () => {
    vi.mocked(listDir).mockResolvedValue(listing);

    renderWithConfig(<FilesSection />);

    expect((await screen.findAllByText('AI pictures')).length).toBeGreaterThan(0);
    expect(screen.getByText('CV.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF file')).toBeInTheDocument();
    expect(listDir).toHaveBeenCalledWith('');
  });

  it('offers a download link only for files', async () => {
    vi.mocked(listDir).mockResolvedValue(listing);

    renderWithConfig(<FilesSection />);
    await screen.findByText('CV.pdf');

    const downloadLinks = screen.getAllByLabelText(/^Download /);
    expect(downloadLinks).toHaveLength(1);
    expect(downloadLinks[0]).toHaveAttribute(
      'href',
      'http://api/files/raw?path=CV.pdf&download=true',
    );
  });

  it('leaves markdown notes out of the folder view', async () => {
    vi.mocked(listDir).mockResolvedValue({
      ...listing,
      entries: [
        ...listing.entries,
        { name: 'Resume.md', type: 'file', size: 10, modified: null, ext: 'md', itemCount: null },
      ],
    });

    renderWithConfig(<FilesSection />);

    await screen.findByText('CV.pdf');
    expect(screen.queryByText('Resume.md')).not.toBeInTheDocument();
  });

  it('opens a folder after its card is clicked', async () => {
    vi.useFakeTimers();
    vi.mocked(listDir).mockResolvedValue(listing);

    renderWithConfig(<FilesSection />);
    await vi.waitFor(() => expect(screen.getAllByText('AI pictures').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText('AI pictures')[0]);
    vi.advanceTimersByTime(400);

    expect(navigate).toHaveBeenCalledWith('/files/AI pictures');
    vi.useRealTimers();
  });

  it('shows the error message when the listing fails', async () => {
    vi.mocked(listDir).mockRejectedValue(new Error('Path not found'));

    renderWithConfig(<FilesSection />);

    expect(await screen.findByText('Path not found')).toBeInTheDocument();
  });

  it('pages forward/back through the folder files in the preview', async () => {
    vi.mocked(listDir).mockResolvedValue({
      ...listing,
      entries: [
        { name: 'one.png', type: 'file', size: 10, modified: null, ext: 'png', itemCount: null },
        { name: 'two.png', type: 'file', size: 20, modified: null, ext: 'png', itemCount: null },
      ],
    });

    renderWithConfig(<FilesSection />);
    fireEvent.click(await screen.findByText('one.png'));

    expect(screen.getByText('1/2')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Next file'));
    expect(screen.getByText('2/2')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Next file')); // wraps around
    expect(screen.getByText('1/2')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Previous file'));
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });
});
