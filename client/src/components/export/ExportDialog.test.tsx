/**
 * Tests for Export Dialog Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExportDialog } from './ExportDialog';
import albumReducer from '@/features/album/albumSlice';
import photosReducer from '@/features/photos/photosSlice';
import settingsReducer from '@/features/settings/settingsSlice';
import type { Album, Photo } from '@/types';

// Mock the PDF generator
jest.mock('@/features/export/services/pdfGenerator', () => ({
  generatePDF: jest.fn(() =>
    Promise.resolve({
      mainPdf: new Blob(['test'], { type: 'application/pdf' }),
      filename: 'test_album_20240101.pdf',
    })
  ),
  downloadBlob: jest.fn(),
}));

// Mock URL methods
const mockCreateObjectURL = jest.fn(() => 'blob:test');
const mockRevokeObjectURL = jest.fn();
URL.createObjectURL = mockCreateObjectURL;
URL.revokeObjectURL = mockRevokeObjectURL;

const createMockAlbum = (pageCount = 5): Album => ({
  id: 'test-album',
  name: 'Test Album',
  size: '10x10',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pages: Array.from({ length: pageCount }, (_, i) => ({
    id: `page-${i}`,
    layoutId: 'single-photo',
    background: '#ffffff',
    slots: [
      {
        photoId: `photo-${i}`,
        photoUrl: 'https://example.com/photo.jpg',
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
      },
    ],
  })),
  userId: 'test-user',
});

const mockPhotos: Photo[] = [
  {
    id: 'photo-0',
    thumbnail: 'https://example.com/thumb.jpg',
    fullSize: 'https://example.com/full.jpg',
    width: 1000,
    height: 800,
    name: 'Test Photo',
    mimeType: 'image/jpeg',
  },
];

const createTestStore = (album: Album = createMockAlbum(), photos: Photo[] = mockPhotos) => {
  return configureStore({
    reducer: {
      album: albumReducer,
      photos: photosReducer,
      settings: settingsReducer,
    },
    preloadedState: {
      album: {
        album,
        status: 'idle' as const,
        error: null,
        autoSaveEnabled: false,
        lastSaved: null,
        selectedPageId: null,
      },
      photos: {
        photos,
        status: 'idle' as const,
        error: null,
      },
      settings: {
        theme: 'system' as const,
        showGrid: false,
        snapToGrid: true,
        gridSize: 10,
        photoLibraryPanelWidth: 300,
        isPhotoPanelCollapsed: false,
        defaultAlbumSize: '10x10',
        unitPreference: 'inches' as const,
        isAuthenticated: false,
      },
    },
  });
};

const renderExportDialog = (props = {}, album?: Album, photos?: Photo[]) => {
  const store = createTestStore(album, photos);
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    ...props,
  };

  return {
    ...render(
      <Provider store={store}>
        <ExportDialog {...defaultProps} />
      </Provider>
    ),
    store,
    onOpenChange: defaultProps.onOpenChange,
  };
};

describe('ExportDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog rendering', () => {
    it('should render when open is true', () => {
      renderExportDialog();

      expect(screen.getByText('Export Album as PDF')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      renderExportDialog({ open: false });

      expect(screen.queryByText('Export Album as PDF')).not.toBeInTheDocument();
    });

    it('should show dialog description', () => {
      renderExportDialog();

      expect(
        screen.getByText(/Choose export settings for professional printing/i)
      ).toBeInTheDocument();
    });
  });

  describe('Export presets', () => {
    it('should display all three presets', () => {
      renderExportDialog();

      expect(screen.getByText('Professional Print (PDF/X-1a)')).toBeInTheDocument();
      expect(screen.getByText('Modern Print (PDF/X-4)')).toBeInTheDocument();
      expect(screen.getByText('Digital Preview')).toBeInTheDocument();
    });

    it('should mark Modern Print as recommended', () => {
      renderExportDialog();

      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('should select Modern preset by default', () => {
      renderExportDialog();

      const modernButton = screen.getByText('Modern Print (PDF/X-4)').closest('button');
      expect(modernButton).toHaveClass('border-primary');
    });

    it('should allow selecting different preset', () => {
      renderExportDialog();

      const professionalButton = screen.getByText('Professional Print (PDF/X-1a)').closest('button');
      fireEvent.click(professionalButton!);

      expect(professionalButton).toHaveClass('border-primary');
    });
  });

  describe('Resolution settings', () => {
    it('should display resolution options', () => {
      renderExportDialog();

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
    });

    it('should default to 300 DPI', () => {
      renderExportDialog();

      const dpi300Button = screen.getByText('300');
      expect(dpi300Button).toHaveClass('border-primary');
    });

    it('should allow changing resolution', () => {
      renderExportDialog();

      const dpi150Button = screen.getByText('150');
      fireEvent.click(dpi150Button);

      expect(dpi150Button).toHaveClass('border-primary');
    });
  });

  describe('Bleed settings', () => {
    it('should display bleed options', () => {
      renderExportDialog();

      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('3mm')).toBeInTheDocument();
      expect(screen.getByText('6mm')).toBeInTheDocument();
    });

    it('should default to 3mm bleed', () => {
      renderExportDialog();

      const bleed3mmButton = screen.getByText('3mm');
      expect(bleed3mmButton).toHaveClass('border-primary');
    });
  });

  describe('Print marks', () => {
    it('should display print mark options', () => {
      renderExportDialog();

      expect(screen.getByText('Crop marks')).toBeInTheDocument();
      expect(screen.getByText('Bleed area')).toBeInTheDocument();
      expect(screen.getByText('Registration marks')).toBeInTheDocument();
      expect(screen.getByText('Page info')).toBeInTheDocument();
    });

    it('should have all print marks enabled by default', () => {
      renderExportDialog();

      const switches = screen.getAllByRole('switch');
      // First 4 switches are print marks
      const printMarkSwitches = switches.slice(0, 4);
      printMarkSwitches.forEach((switchEl) => {
        expect(switchEl).toHaveAttribute('data-state', 'checked');
      });
    });
  });

  describe('Cover export options', () => {
    it('should show cover export option', () => {
      renderExportDialog();

      expect(screen.getByText('Export cover separately')).toBeInTheDocument();
    });

    it('should expand paper type options when cover export is enabled', async () => {
      renderExportDialog();

      // Find the cover export switch (after the 4 print mark switches)
      const switches = screen.getAllByRole('switch');
      const coverSwitch = switches.find((s) =>
        s.closest('div')?.querySelector('label')?.textContent?.includes('Export cover separately')
      );

      fireEvent.click(coverSwitch!);

      await waitFor(() => {
        expect(screen.getByText('Paper type (for spine calculation)')).toBeInTheDocument();
      });
    });

    it('should display paper type options when cover export is enabled', async () => {
      renderExportDialog();

      // Find the cover export switch - it's the 5th switch after the 4 print mark switches
      const switches = screen.getAllByRole('switch');
      // Click the last switch which should be the cover export one
      fireEvent.click(switches[switches.length - 1]);

      // Wait for the paper type selection to appear and check for any paper type text
      await waitFor(
        () => {
          expect(screen.getByText(/paper type/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should show spine width calculation', async () => {
      renderExportDialog();

      const switches = screen.getAllByRole('switch');
      const coverSwitch = switches.find((s) =>
        s.closest('div')?.querySelector('label')?.textContent?.includes('Export cover separately')
      );
      fireEvent.click(coverSwitch!);

      await waitFor(() => {
        expect(screen.getByText(/Calculated spine width:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Output info', () => {
    it('should display output dimensions', () => {
      renderExportDialog();

      expect(screen.getByText(/Output size:/i)).toBeInTheDocument();
    });

    it('should display page count', () => {
      renderExportDialog();

      expect(screen.getByText(/Pages:/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Default mock has 5 pages
    });

    it('should display estimated file size', () => {
      renderExportDialog();

      expect(screen.getByText(/Est\. file size:/i)).toBeInTheDocument();
    });

    it('should display pixel dimensions', () => {
      renderExportDialog();

      expect(screen.getByText(/Pixel size:/i)).toBeInTheDocument();
    });
  });

  describe('Export button', () => {
    it('should display export button', () => {
      renderExportDialog();

      expect(screen.getByRole('button', { name: /Export PDF/i })).toBeInTheDocument();
    });

    it('should disable export button when album has no pages', () => {
      const emptyAlbum = createMockAlbum(0);
      renderExportDialog({}, emptyAlbum);

      const exportButton = screen.getByRole('button', { name: /Export PDF/i });
      expect(exportButton).toBeDisabled();
    });

    it('should enable export button when album has pages', () => {
      renderExportDialog();

      const exportButton = screen.getByRole('button', { name: /Export PDF/i });
      expect(exportButton).not.toBeDisabled();
    });
  });

  describe('Cancel button', () => {
    it('should display cancel button', () => {
      renderExportDialog();

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should call onOpenChange when cancel is clicked', () => {
      const { onOpenChange } = renderExportDialog();

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Preset switching', () => {
    it('should update resolution when switching to Digital preset', () => {
      renderExportDialog();

      const digitalButton = screen.getByText('Digital Preview').closest('button');
      fireEvent.click(digitalButton!);

      const dpi150Button = screen.getByText('150');
      expect(dpi150Button).toHaveClass('border-primary');
    });

    it('should update bleed when switching to Digital preset', () => {
      renderExportDialog();

      const digitalButton = screen.getByText('Digital Preview').closest('button');
      fireEvent.click(digitalButton!);

      const noneButton = screen.getByText('None');
      expect(noneButton).toHaveClass('border-primary');
    });
  });
});
