/// <reference types="jest" />
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FilterControls, buildFilterString } from './FilterControls';
import albumReducer from '@/features/album/albumSlice';
import photosReducer from '@/features/photos/photosSlice';
import authReducer from '@/features/auth/authSlice';
import googlePhotosReducer from '@/features/googlePhotos/googlePhotosSlice';
import {
  FILTER_PRESETS,
  DEFAULT_FILTER_VALUES,
  type PageSlot,
  type PhotoFilterValues,
} from '@/types';

describe('FilterControls', () => {
  const mockSlot: PageSlot = {
    id: 'slot-1',
    photoId: 'photo-1',
    position: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    filters: { ...DEFAULT_FILTER_VALUES },
    filterPreset: 'none',
  };

  const mockThumbnail = 'http://example.com/photo.jpg';

  const createTestStore = (preloadedState = {}) =>
    configureStore({
      reducer: {
        photos: photosReducer,
        album: albumReducer,
        auth: authReducer,
        googlePhotos: googlePhotosReducer,
      },
      preloadedState: {
        photos: {
          items: [],
          selectedIds: [],
          status: 'idle',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
        album: {
          album: {
            id: 'album-1',
            name: 'Test Album',
            size: '10x10',
            pages: [
              {
                id: 'page-1',
                layoutId: 'single',
                background: '#ffffff',
                slots: [mockSlot],
              },
            ],
            currentPageIndex: 0,
          },
          albums: [],
          albumsStatus: 'idle',
          selectedSlot: { pageIndex: 0, slotIndex: 0 },
          viewMode: 'book',
          currentSpread: 0,
          status: 'idle',
          error: null,
        },
        auth: {
          user: null,
          token: null,
          status: 'idle',
          error: null,
          isInitialized: true,
        },
        googlePhotos: {
          albums: [],
          albumsStatus: 'idle',
          albumsNextPageToken: null,
          selectedAlbum: null,
          photos: [],
          photosStatus: 'idle',
          photosNextPageToken: null,
          importProgress: null,
          error: null,
          isDialogOpen: false,
        },
        ...preloadedState,
      },
    });

  const renderFilterControls = (
    slot: PageSlot = mockSlot,
    pageIndex = 0,
    slotIndex = 0,
    photoThumbnail = mockThumbnail,
    storeOverrides = {}
  ) => {
    const store = createTestStore(storeOverrides);
    return {
      ...render(
        <Provider store={store}>
          <FilterControls
            slot={slot}
            pageIndex={pageIndex}
            slotIndex={slotIndex}
            photoThumbnail={photoThumbnail}
          />
        </Provider>
      ),
      store,
    };
  };

  describe('buildFilterString utility function', () => {
    it('should return "none" for default filter values', () => {
      const result = buildFilterString(DEFAULT_FILTER_VALUES);
      expect(result).toBe('none');
    });

    it('should generate brightness filter', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        brightness: 150,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('brightness(150%)');
    });

    it('should generate contrast filter', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        contrast: 120,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('contrast(120%)');
    });

    it('should generate saturation filter', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        saturation: 80,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('saturate(80%)');
    });

    it('should generate hue-rotate filter', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        hue: 45,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('hue-rotate(45deg)');
    });

    it('should generate grayscale filter', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        grayscale: 50,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('grayscale(50%)');
    });

    it('should generate sepia filter', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        sepia: 30,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('sepia(30%)');
    });

    it('should generate invert filter', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        invert: 25,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('invert(25%)');
    });

    it('should generate blur filter', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        blur: 5,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('blur(5px)');
    });

    it('should generate opacity filter', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        opacity: 75,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('opacity(75%)');
    });

    it('should combine multiple filters', () => {
      const filters: PhotoFilterValues = {
        brightness: 110,
        contrast: 120,
        saturation: 130,
        hue: 15,
        grayscale: 0,
        sepia: 10,
        invert: 0,
        blur: 2,
        opacity: 100,
      };
      const result = buildFilterString(filters);
      expect(result).toContain('brightness(110%)');
      expect(result).toContain('contrast(120%)');
      expect(result).toContain('saturate(130%)');
      expect(result).toContain('hue-rotate(15deg)');
      expect(result).toContain('sepia(10%)');
      expect(result).toContain('blur(2px)');
    });

    it('should not include filters at default values', () => {
      const filters: PhotoFilterValues = {
        brightness: 100, // default
        contrast: 120, // not default
        saturation: 100, // default
        hue: 0, // default
        grayscale: 0, // default
        sepia: 0, // default
        invert: 0, // default
        blur: 0, // default
        opacity: 100, // default
      };
      const result = buildFilterString(filters);
      expect(result).toBe('contrast(120%)');
      expect(result).not.toContain('brightness');
      expect(result).not.toContain('saturate');
    });

    it('should handle negative hue values', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        hue: -90,
      };
      const result = buildFilterString(filters);
      expect(result).toBe('hue-rotate(-90deg)');
    });
  });

  describe('basic rendering', () => {
    it('should render Filter Presets section', () => {
      renderFilterControls();
      expect(screen.getByText('Filter Presets')).toBeInTheDocument();
    });

    it('should render Reset button', () => {
      renderFilterControls();
      expect(
        screen.getByRole('button', { name: /reset/i })
      ).toBeInTheDocument();
    });

    it('should render Adjustments section', () => {
      renderFilterControls();
      expect(screen.getByText('Adjustments')).toBeInTheDocument();
    });

    it('should render all adjustment sliders', () => {
      renderFilterControls();
      expect(screen.getByText('Brightness')).toBeInTheDocument();
      expect(screen.getByText('Contrast')).toBeInTheDocument();
      expect(screen.getByText('Saturation')).toBeInTheDocument();
      expect(screen.getByText('Hue Shift')).toBeInTheDocument();
      expect(screen.getByText('Grayscale')).toBeInTheDocument();
      expect(screen.getByText('Sepia')).toBeInTheDocument();
      expect(screen.getByText('Blur')).toBeInTheDocument();
    });

    it('should display current filter values', () => {
      const slotWithFilters: PageSlot = {
        ...mockSlot,
        filters: {
          ...DEFAULT_FILTER_VALUES,
          brightness: 120,
          contrast: 130,
        },
      };
      renderFilterControls(slotWithFilters);
      expect(screen.getByText('120%')).toBeInTheDocument();
      expect(screen.getByText('130%')).toBeInTheDocument();
    });
  });

  describe('filter presets', () => {
    it('should render all filter presets', () => {
      renderFilterControls();
      // Each preset should be rendered as a button with its label
      // Use getAllByTitle because some presets have similar names in their titles
      FILTER_PRESETS.forEach((preset) => {
        const elements = screen.getAllByTitle(new RegExp(preset.label));
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should render preset thumbnails with filter applied', () => {
      renderFilterControls();
      const presetButtons = screen.getAllByRole('button').filter((btn) => {
        // Filter out the Reset button
        return !btn.textContent?.includes('Reset');
      });
      // Should have one button per preset
      expect(presetButtons.length).toBeGreaterThanOrEqual(FILTER_PRESETS.length);
    });

    it('should highlight current preset', () => {
      const slotWithPreset: PageSlot = {
        ...mockSlot,
        filterPreset: 'dynamic',
      };
      renderFilterControls(slotWithPreset);
      const dynamicButton = screen.getByTitle(/Dynamic/);
      expect(dynamicButton).toHaveClass('border-primary');
    });

    it('should dispatch setSlotFilterPreset when preset is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderFilterControls();

      const dynamicButton = screen.getByTitle(/Dynamic/);
      await user.click(dynamicButton);

      const state = store.getState().album;
      const slot = state.album?.pages[0].slots[0];
      expect(slot?.filterPreset).toBe('dynamic');
    });
  });

  describe('manual adjustments', () => {
    it('should render brightness slider with correct value', () => {
      const slotWithBrightness: PageSlot = {
        ...mockSlot,
        filters: {
          ...DEFAULT_FILTER_VALUES,
          brightness: 120,
        },
      };
      renderFilterControls(slotWithBrightness);

      // The value should be displayed
      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    it('should display blur value with decimal places', () => {
      const slotWithBlur: PageSlot = {
        ...mockSlot,
        filters: {
          ...DEFAULT_FILTER_VALUES,
          blur: 2.5,
        },
      };
      renderFilterControls(slotWithBlur);
      expect(screen.getByText('2.5px')).toBeInTheDocument();
    });

    it('should display hue value with degree symbol', () => {
      const slotWithHue: PageSlot = {
        ...mockSlot,
        filters: {
          ...DEFAULT_FILTER_VALUES,
          hue: 45,
        },
      };
      renderFilterControls(slotWithHue);
      expect(screen.getByText('45°')).toBeInTheDocument();
    });
  });

  describe('reset functionality', () => {
    it('should dispatch resetSlotFilters when Reset button is clicked', async () => {
      const user = userEvent.setup();
      const slotWithFilters: PageSlot = {
        ...mockSlot,
        filters: {
          brightness: 150,
          contrast: 120,
          saturation: 80,
          hue: 45,
          grayscale: 10,
          sepia: 20,
          invert: 0,
          blur: 2,
          opacity: 90,
        },
        filterPreset: 'dynamic',
      };
      const { store } = renderFilterControls(slotWithFilters);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      const state = store.getState().album;
      const slot = state.album?.pages[0].slots[0];
      expect(slot?.filterPreset).toBe('none');
      expect(slot?.filters).toEqual(DEFAULT_FILTER_VALUES);
    });
  });

  describe('slot without filters', () => {
    it('should use default filter values when slot has no filters', () => {
      const slotWithoutFilters: PageSlot = {
        id: 'slot-1',
        photoId: 'photo-1',
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        // No filters property
      };
      renderFilterControls(slotWithoutFilters);
      // Should display default values - multiple 100% values exist (brightness, contrast, saturation)
      const hundredPercentElements = screen.getAllByText('100%');
      expect(hundredPercentElements.length).toBeGreaterThan(0);
    });

    it('should use "none" preset when slot has no preset', () => {
      const slotWithoutPreset: PageSlot = {
        id: 'slot-1',
        photoId: 'photo-1',
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        filters: DEFAULT_FILTER_VALUES,
        // No filterPreset property
      };
      renderFilterControls(slotWithoutPreset);
      const noneButton = screen.getByTitle(/None/);
      expect(noneButton).toHaveClass('border-primary');
    });
  });

  describe('preset filter values', () => {
    it('should have valid filter ranges for all presets', () => {
      FILTER_PRESETS.forEach((preset) => {
        expect(preset.values.brightness).toBeGreaterThanOrEqual(0);
        expect(preset.values.brightness).toBeLessThanOrEqual(200);
        expect(preset.values.contrast).toBeGreaterThanOrEqual(0);
        expect(preset.values.contrast).toBeLessThanOrEqual(200);
        expect(preset.values.saturation).toBeGreaterThanOrEqual(0);
        expect(preset.values.saturation).toBeLessThanOrEqual(200);
        expect(preset.values.hue).toBeGreaterThanOrEqual(-180);
        expect(preset.values.hue).toBeLessThanOrEqual(180);
        expect(preset.values.grayscale).toBeGreaterThanOrEqual(0);
        expect(preset.values.grayscale).toBeLessThanOrEqual(100);
        expect(preset.values.sepia).toBeGreaterThanOrEqual(0);
        expect(preset.values.sepia).toBeLessThanOrEqual(100);
        expect(preset.values.blur).toBeGreaterThanOrEqual(0);
        expect(preset.values.blur).toBeLessThanOrEqual(20);
        expect(preset.values.opacity).toBeGreaterThanOrEqual(0);
        expect(preset.values.opacity).toBeLessThanOrEqual(100);
      });
    });

    it('should generate different filter strings for different presets', () => {
      const filterStrings = FILTER_PRESETS.map((preset) =>
        buildFilterString(preset.values)
      );
      // 'none' preset should return 'none'
      expect(filterStrings[0]).toBe('none');
      // Other presets should have actual filter values
      const nonNoneFilters = filterStrings.filter((f) => f !== 'none');
      expect(nonNoneFilters.length).toBeGreaterThan(0);
    });

    it('should apply dynamic preset filter correctly', () => {
      const dynamicPreset = FILTER_PRESETS.find((p) => p.name === 'dynamic');
      expect(dynamicPreset).toBeDefined();
      const filterString = buildFilterString(dynamicPreset!.values);
      expect(filterString).toContain('brightness');
      expect(filterString).toContain('contrast');
      expect(filterString).toContain('saturate');
    });

    it('should apply noir preset filter correctly', () => {
      const noirPreset = FILTER_PRESETS.find((p) => p.name === 'noir');
      expect(noirPreset).toBeDefined();
      const filterString = buildFilterString(noirPreset!.values);
      expect(filterString).toContain('grayscale(100%)');
      expect(filterString).toContain('contrast');
    });

    it('should apply vintage preset filter correctly', () => {
      const vintagePreset = FILTER_PRESETS.find((p) => p.name === 'vintage');
      expect(vintagePreset).toBeDefined();
      const filterString = buildFilterString(vintagePreset!.values);
      expect(filterString).toContain('sepia');
    });
  });
});
