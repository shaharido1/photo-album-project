/// <reference types="jest" />
import albumReducer, {
  createAlbum,
  setAlbumName,
  setAlbumSize,
  addPage,
  removePage,
  setCurrentPage,
  updatePageLayout,
  setPageBackground,
  assignPhotoToSlot,
  removePhotoFromSlot,
  updateSlotPosition,
  updateSlotScale,
  updateSlotRotation,
  updateSlotFilters,
  setSlotFilterPreset,
  resetSlotFilters,
  selectSlot,
  clearAlbum,
  setViewMode,
  setCurrentSpread,
  nextSpread,
  prevSpread,
  editPage,
  loadAlbum,
  ALBUM_SIZE_PRESETS,
  LAYOUT_TEMPLATES,
  selectAlbum,
  selectAlbumName,
  selectAlbumSize,
  selectPages,
  selectCurrentPageIndex,
  selectCurrentPage,
  selectSelectedSlot,
  selectViewMode,
  selectCurrentSpread,
  selectSpreadInfo,
  selectTotalSpreads,
} from './albumSlice';
import { signOut } from '../auth/authSlice';
import { DEFAULT_FILTER_VALUES, FILTER_PRESETS } from '@/types';
import type {
  AlbumState,
  Album,
  AlbumPage,
  AlbumSizeKey,
} from '@/types';

describe('albumSlice', () => {
  const initialState: AlbumState = {
    album: {
      id: null,
      name: 'Untitled Album',
      size: '10x10',
      pages: [],
      currentPageIndex: 0,
    },
    selectedSlot: null,
    viewMode: 'book',
    currentSpread: 0,
    status: 'idle',
    error: null,
  };

  const createMockPage = (id: string, layoutId = 'single'): AlbumPage => ({
    id,
    layoutId,
    background: '#ffffff',
    slots: [
      {
        id: `slot-${id}-1`,
        photoId: null,
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
      },
    ],
  });

  const createStateWithPages = (pageCount: number): AlbumState => ({
    ...initialState,
    album: {
      ...initialState.album,
      id: 'album-1',
      pages: Array.from({ length: pageCount }, (_, i) =>
        createMockPage(`page-${i + 1}`)
      ),
    },
  });

  describe('createAlbum', () => {
    it('should create a new album with provided name and size', () => {
      const newState = albumReducer(
        initialState,
        createAlbum({ name: 'My Album', size: '12x12' })
      );

      expect(newState.album.name).toBe('My Album');
      expect(newState.album.size).toBe('12x12');
      expect(newState.album.id).toBeTruthy();
      expect(newState.album.pages).toHaveLength(1);
      expect(newState.album.currentPageIndex).toBe(0);
      expect(newState.selectedSlot).toBeNull();
    });

    it('should use default name if not provided', () => {
      const newState = albumReducer(initialState, createAlbum({ size: '8x8' }));

      expect(newState.album.name).toBe('Untitled Album');
    });

    it('should use default size if not provided', () => {
      const newState = albumReducer(
        initialState,
        createAlbum({ name: 'Test' })
      );

      expect(newState.album.size).toBe('10x10');
    });

    it('should create first page with single layout', () => {
      const newState = albumReducer(
        initialState,
        createAlbum({ name: 'Test', size: '10x10' })
      );

      expect(newState.album.pages[0].layoutId).toBe('single');
      expect(newState.album.pages[0].background).toBe('#ffffff');
    });
  });

  describe('setAlbumName', () => {
    it('should update album name', () => {
      const stateWithAlbum = createStateWithPages(1);
      const newState = albumReducer(stateWithAlbum, setAlbumName('New Name'));

      expect(newState.album.name).toBe('New Name');
    });

    it('should allow empty name', () => {
      const stateWithAlbum = createStateWithPages(1);
      const newState = albumReducer(stateWithAlbum, setAlbumName(''));

      expect(newState.album.name).toBe('');
    });
  });

  describe('setAlbumSize', () => {
    it('should update album size', () => {
      const newState = albumReducer(initialState, setAlbumSize('12x12'));

      expect(newState.album.size).toBe('12x12');
    });

    it('should accept all valid size keys', () => {
      const sizes: AlbumSizeKey[] = [
        '8x8',
        '10x10',
        '12x12',
        'a4-landscape',
        'a4-portrait',
      ];

      sizes.forEach((size) => {
        const newState = albumReducer(initialState, setAlbumSize(size));
        expect(newState.album.size).toBe(size);
      });
    });
  });

  describe('addPage', () => {
    it('should add a page with default layout', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(stateWithPages, addPage());

      expect(newState.album.pages).toHaveLength(2);
      expect(newState.album.pages[1].layoutId).toBe('single');
    });

    it('should add a page with specified layout', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(stateWithPages, addPage('4-grid'));

      expect(newState.album.pages).toHaveLength(2);
      expect(newState.album.pages[1].layoutId).toBe('4-grid');
    });

    it('should create correct number of slots for layout', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(stateWithPages, addPage('4-grid'));

      expect(newState.album.pages[1].slots).toHaveLength(4);
    });
  });

  describe('removePage', () => {
    it('should remove page at specified index', () => {
      const stateWithPages = createStateWithPages(3);
      const newState = albumReducer(stateWithPages, removePage(1));

      expect(newState.album.pages).toHaveLength(2);
      expect(newState.album.pages[0].id).toBe('page-1');
      expect(newState.album.pages[1].id).toBe('page-3');
    });

    it('should not remove the last page', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(stateWithPages, removePage(0));

      expect(newState.album.pages).toHaveLength(1);
    });

    it('should adjust currentPageIndex if needed', () => {
      const stateWithPages: AlbumState = {
        ...createStateWithPages(3),
        album: {
          ...createStateWithPages(3).album,
          currentPageIndex: 2,
        },
      };
      const newState = albumReducer(stateWithPages, removePage(2));

      expect(newState.album.currentPageIndex).toBe(1);
    });
  });

  describe('setCurrentPage', () => {
    it('should set current page index', () => {
      const stateWithPages = createStateWithPages(3);
      const newState = albumReducer(stateWithPages, setCurrentPage(2));

      expect(newState.album.currentPageIndex).toBe(2);
    });

    it('should clear selected slot when changing page', () => {
      const stateWithPages: AlbumState = {
        ...createStateWithPages(3),
        selectedSlot: { pageIndex: 0, slotIndex: 0 },
      };
      const newState = albumReducer(stateWithPages, setCurrentPage(1));

      expect(newState.selectedSlot).toBeNull();
    });

    it('should not change page if index is out of bounds', () => {
      const stateWithPages = createStateWithPages(3);
      const newState = albumReducer(stateWithPages, setCurrentPage(5));

      expect(newState.album.currentPageIndex).toBe(0);
    });

    it('should not change page if index is negative', () => {
      const stateWithPages = createStateWithPages(3);
      const newState = albumReducer(stateWithPages, setCurrentPage(-1));

      expect(newState.album.currentPageIndex).toBe(0);
    });
  });

  describe('updatePageLayout', () => {
    it('should update layout for specified page', () => {
      const stateWithPages = createStateWithPages(2);
      const newState = albumReducer(
        stateWithPages,
        updatePageLayout({ pageIndex: 0, layoutId: '4-grid' })
      );

      expect(newState.album.pages[0].layoutId).toBe('4-grid');
      expect(newState.album.pages[0].slots).toHaveLength(4);
    });

    it('should preserve existing photos when changing layout', () => {
      const stateWithPages = createStateWithPages(1);
      stateWithPages.album.pages[0].slots[0].photoId = 'photo-1';

      const newState = albumReducer(
        stateWithPages,
        updatePageLayout({ pageIndex: 0, layoutId: '2-horizontal' })
      );

      expect(newState.album.pages[0].slots[0].photoId).toBe('photo-1');
    });

    it('should not modify page if index is invalid', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        updatePageLayout({ pageIndex: 5, layoutId: '4-grid' })
      );

      expect(newState.album.pages[0].layoutId).toBe('single');
    });
  });

  describe('setPageBackground', () => {
    it('should set page background color', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        setPageBackground({ pageIndex: 0, color: '#ff0000' })
      );

      expect(newState.album.pages[0].background).toBe('#ff0000');
    });

    it('should not modify page if index is invalid', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        setPageBackground({ pageIndex: 5, color: '#ff0000' })
      );

      expect(newState.album.pages[0].background).toBe('#ffffff');
    });
  });

  describe('assignPhotoToSlot', () => {
    it('should assign photo to slot', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        assignPhotoToSlot({ pageIndex: 0, slotIndex: 0, photoId: 'photo-1' })
      );

      expect(newState.album.pages[0].slots[0].photoId).toBe('photo-1');
    });

    it('should assign photo and url to slot', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        assignPhotoToSlot({
          pageIndex: 0,
          slotIndex: 0,
          photoId: 'photo-1',
          photoUrl: 'http://example.com/photo.jpg',
        })
      );

      expect(newState.album.pages[0].slots[0].photoId).toBe('photo-1');
      expect(newState.album.pages[0].slots[0].photoUrl).toBe(
        'http://example.com/photo.jpg'
      );
    });

    it('should not modify slot if page index is invalid', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        assignPhotoToSlot({ pageIndex: 5, slotIndex: 0, photoId: 'photo-1' })
      );

      expect(newState.album.pages[0].slots[0].photoId).toBeNull();
    });

    it('should not modify slot if slot index is invalid', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        assignPhotoToSlot({ pageIndex: 0, slotIndex: 5, photoId: 'photo-1' })
      );

      expect(newState.album.pages[0].slots[0].photoId).toBeNull();
    });
  });

  describe('removePhotoFromSlot', () => {
    it('should remove photo from slot and reset transforms', () => {
      const stateWithPages = createStateWithPages(1);
      stateWithPages.album.pages[0].slots[0].photoId = 'photo-1';
      stateWithPages.album.pages[0].slots[0].position = { x: 10, y: 20 };
      stateWithPages.album.pages[0].slots[0].scale = 1.5;
      stateWithPages.album.pages[0].slots[0].rotation = 45;

      const newState = albumReducer(
        stateWithPages,
        removePhotoFromSlot({ pageIndex: 0, slotIndex: 0 })
      );

      expect(newState.album.pages[0].slots[0].photoId).toBeNull();
      expect(newState.album.pages[0].slots[0].position).toEqual({ x: 0, y: 0 });
      expect(newState.album.pages[0].slots[0].scale).toBe(1);
      expect(newState.album.pages[0].slots[0].rotation).toBe(0);
    });
  });

  describe('updateSlotPosition', () => {
    it('should update slot position', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        updateSlotPosition({
          pageIndex: 0,
          slotIndex: 0,
          position: { x: 100, y: 200 },
        })
      );

      expect(newState.album.pages[0].slots[0].position).toEqual({
        x: 100,
        y: 200,
      });
    });
  });

  describe('updateSlotScale', () => {
    it('should update slot scale', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        updateSlotScale({ pageIndex: 0, slotIndex: 0, scale: 2.5 })
      );

      expect(newState.album.pages[0].slots[0].scale).toBe(2.5);
    });
  });

  describe('updateSlotRotation', () => {
    it('should update slot rotation', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        updateSlotRotation({ pageIndex: 0, slotIndex: 0, rotation: 90 })
      );

      expect(newState.album.pages[0].slots[0].rotation).toBe(90);
    });
  });

  describe('selectSlot', () => {
    it('should select a slot', () => {
      const newState = albumReducer(
        initialState,
        selectSlot({ pageIndex: 0, slotIndex: 1 })
      );

      expect(newState.selectedSlot).toEqual({ pageIndex: 0, slotIndex: 1 });
    });

    it('should clear selection when null is passed', () => {
      const stateWithSelection: AlbumState = {
        ...initialState,
        selectedSlot: { pageIndex: 0, slotIndex: 0 },
      };
      const newState = albumReducer(stateWithSelection, selectSlot(null));

      expect(newState.selectedSlot).toBeNull();
    });
  });

  describe('clearAlbum', () => {
    it('should reset album to initial state', () => {
      const stateWithData: AlbumState = {
        album: {
          id: 'album-1',
          name: 'My Album',
          size: '12x12',
          pages: [createMockPage('page-1')],
          currentPageIndex: 0,
        },
        selectedSlot: { pageIndex: 0, slotIndex: 0 },
        viewMode: 'edit',
        currentSpread: 2,
        status: 'succeeded',
        error: 'some error',
      };

      const newState = albumReducer(stateWithData, clearAlbum());

      expect(newState.album.id).toBeNull();
      expect(newState.album.name).toBe('Untitled Album');
      expect(newState.album.size).toBe('10x10');
      expect(newState.album.pages).toHaveLength(0);
      expect(newState.selectedSlot).toBeNull();
      expect(newState.viewMode).toBe('book');
      expect(newState.currentSpread).toBe(0);
      expect(newState.status).toBe('idle');
      expect(newState.error).toBeNull();
    });
  });

  describe('view mode actions', () => {
    describe('setViewMode', () => {
      it('should set view mode to edit', () => {
        const newState = albumReducer(initialState, setViewMode('edit'));

        expect(newState.viewMode).toBe('edit');
      });

      it('should set view mode to book', () => {
        const stateInEditMode: AlbumState = {
          ...initialState,
          viewMode: 'edit',
        };
        const newState = albumReducer(stateInEditMode, setViewMode('book'));

        expect(newState.viewMode).toBe('book');
      });

      it('should sync currentPageIndex when switching to edit mode', () => {
        const stateWithPages: AlbumState = {
          ...createStateWithPages(5),
          viewMode: 'book',
          currentSpread: 2,
        };
        const newState = albumReducer(stateWithPages, setViewMode('edit'));

        expect(newState.viewMode).toBe('edit');
        expect(newState.album.currentPageIndex).toBe(3); // spread 2 = pages 3-4
      });
    });

    describe('setCurrentSpread', () => {
      it('should set current spread', () => {
        const stateWithPages = createStateWithPages(5);
        const newState = albumReducer(stateWithPages, setCurrentSpread(2));

        expect(newState.currentSpread).toBe(2);
      });

      it('should not set spread beyond max', () => {
        const stateWithPages = createStateWithPages(3);
        const newState = albumReducer(stateWithPages, setCurrentSpread(10));

        expect(newState.currentSpread).toBe(0);
      });

      it('should not set negative spread', () => {
        const stateWithPages = createStateWithPages(3);
        const newState = albumReducer(stateWithPages, setCurrentSpread(-1));

        expect(newState.currentSpread).toBe(0);
      });
    });

    describe('nextSpread', () => {
      it('should increment spread', () => {
        const stateWithPages: AlbumState = {
          ...createStateWithPages(5),
          currentSpread: 0,
        };
        const newState = albumReducer(stateWithPages, nextSpread());

        expect(newState.currentSpread).toBe(1);
      });

      it('should not go beyond max spread', () => {
        const stateWithPages: AlbumState = {
          ...createStateWithPages(3),
          currentSpread: 1, // max for 3 pages
        };
        const newState = albumReducer(stateWithPages, nextSpread());

        expect(newState.currentSpread).toBe(1);
      });
    });

    describe('prevSpread', () => {
      it('should decrement spread', () => {
        const stateWithPages: AlbumState = {
          ...createStateWithPages(5),
          currentSpread: 2,
        };
        const newState = albumReducer(stateWithPages, prevSpread());

        expect(newState.currentSpread).toBe(1);
      });

      it('should not go below 0', () => {
        const stateWithPages: AlbumState = {
          ...createStateWithPages(5),
          currentSpread: 0,
        };
        const newState = albumReducer(stateWithPages, prevSpread());

        expect(newState.currentSpread).toBe(0);
      });
    });

    describe('editPage', () => {
      it('should switch to edit mode and set page index', () => {
        const stateWithPages = createStateWithPages(5);
        const newState = albumReducer(stateWithPages, editPage(2));

        expect(newState.viewMode).toBe('edit');
        expect(newState.album.currentPageIndex).toBe(2);
      });

      it('should not change if page index is invalid', () => {
        const stateWithPages = createStateWithPages(3);
        const newState = albumReducer(stateWithPages, editPage(10));

        expect(newState.viewMode).toBe('book');
        expect(newState.album.currentPageIndex).toBe(0);
      });
    });
  });

  describe('loadAlbum', () => {
    it('should load album from API response', () => {
      const albumData: Album = {
        id: 'loaded-album',
        name: 'Loaded Album',
        size: '12x12',
        pages: [createMockPage('loaded-page-1')],
        currentPageIndex: 0,
      };

      const newState = albumReducer(initialState, loadAlbum(albumData));

      expect(newState.album).toEqual(albumData);
      expect(newState.selectedSlot).toBeNull();
      expect(newState.viewMode).toBe('book');
      expect(newState.currentSpread).toBe(0);
      expect(newState.status).toBe('succeeded');
      expect(newState.error).toBeNull();
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      album: {
        album: {
          id: 'album-1',
          name: 'Test Album',
          size: '10x10' as AlbumSizeKey,
          pages: [
            createMockPage('page-1'),
            createMockPage('page-2'),
            createMockPage('page-3'),
          ],
          currentPageIndex: 1,
        },
        selectedSlot: { pageIndex: 1, slotIndex: 0 },
        viewMode: 'book' as const,
        currentSpread: 1,
        status: 'succeeded' as const,
        error: null,
      },
    };

    it('selectAlbum should return album object', () => {
      // @ts-expect-error - partial state for testing
      expect(selectAlbum(mockRootState)).toEqual(mockRootState.album.album);
    });

    it('selectAlbumName should return album name', () => {
      // @ts-expect-error - partial state for testing
      expect(selectAlbumName(mockRootState)).toBe('Test Album');
    });

    it('selectAlbumSize should return album size', () => {
      // @ts-expect-error - partial state for testing
      expect(selectAlbumSize(mockRootState)).toBe('10x10');
    });

    it('selectPages should return pages array', () => {
      // @ts-expect-error - partial state for testing
      expect(selectPages(mockRootState)).toHaveLength(3);
    });

    it('selectCurrentPageIndex should return current page index', () => {
      // @ts-expect-error - partial state for testing
      expect(selectCurrentPageIndex(mockRootState)).toBe(1);
    });

    it('selectCurrentPage should return current page', () => {
      // @ts-expect-error - partial state for testing
      const currentPage = selectCurrentPage(mockRootState);
      expect(currentPage?.id).toBe('page-2');
    });

    it('selectSelectedSlot should return selected slot', () => {
      // @ts-expect-error - partial state for testing
      expect(selectSelectedSlot(mockRootState)).toEqual({
        pageIndex: 1,
        slotIndex: 0,
      });
    });

    it('selectViewMode should return view mode', () => {
      // @ts-expect-error - partial state for testing
      expect(selectViewMode(mockRootState)).toBe('book');
    });

    it('selectCurrentSpread should return current spread', () => {
      // @ts-expect-error - partial state for testing
      expect(selectCurrentSpread(mockRootState)).toBe(1);
    });

    it('selectTotalSpreads should return correct number of spreads', () => {
      // 3 pages: spread 0 (cover), spread 1 (pages 1-2) = 2 spreads total
      // @ts-expect-error - partial state for testing
      expect(selectTotalSpreads(mockRootState)).toBe(2);
    });

    describe('selectSpreadInfo', () => {
      it('should return cover spread info for spread 0', () => {
        const stateWithCover = {
          album: {
            ...mockRootState.album,
            currentSpread: 0,
          },
        };
        // @ts-expect-error - partial state for testing
        const spreadInfo = selectSpreadInfo(stateWithCover);

        expect(spreadInfo.isCover).toBe(true);
        expect(spreadInfo.leftPageIndex).toBe(0);
        expect(spreadInfo.rightPageIndex).toBeNull();
      });

      it('should return spread info for regular spread', () => {
        // @ts-expect-error - partial state for testing
        const spreadInfo = selectSpreadInfo(mockRootState);

        expect(spreadInfo.isCover).toBe(false);
        expect(spreadInfo.leftPageIndex).toBe(1);
        expect(spreadInfo.rightPageIndex).toBe(2);
      });
    });
  });

  describe('ALBUM_SIZE_PRESETS', () => {
    it('should have all expected sizes', () => {
      expect(ALBUM_SIZE_PRESETS['8x8']).toBeDefined();
      expect(ALBUM_SIZE_PRESETS['10x10']).toBeDefined();
      expect(ALBUM_SIZE_PRESETS['12x12']).toBeDefined();
      expect(ALBUM_SIZE_PRESETS['a4-landscape']).toBeDefined();
      expect(ALBUM_SIZE_PRESETS['a4-portrait']).toBeDefined();
    });

    it('should have correct dimensions for square sizes', () => {
      expect(ALBUM_SIZE_PRESETS['10x10'].dimensions).toEqual({
        width: 3000,
        height: 3000,
      });
    });
  });

  describe('LAYOUT_TEMPLATES', () => {
    it('should have all expected layouts', () => {
      expect(LAYOUT_TEMPLATES['single']).toBeDefined();
      expect(LAYOUT_TEMPLATES['4-grid']).toBeDefined();
      expect(LAYOUT_TEMPLATES['6-grid']).toBeDefined();
    });

    it('should have correct slot counts', () => {
      expect(LAYOUT_TEMPLATES['single'].slots).toBe(1);
      expect(LAYOUT_TEMPLATES['4-grid'].slots).toBe(4);
      expect(LAYOUT_TEMPLATES['6-grid'].slots).toBe(6);
    });
  });

  // =============================================================================
  // FILTER ACTIONS TESTS
  // =============================================================================

  describe('updateSlotFilters', () => {
    it('should update a single filter property', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        updateSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
          filters: { brightness: 120 },
        })
      );

      expect(newState.album.pages[0].slots[0].filters?.brightness).toBe(120);
      // Other values should be defaults
      expect(newState.album.pages[0].slots[0].filters?.contrast).toBe(100);
      expect(newState.album.pages[0].slots[0].filters?.saturation).toBe(100);
    });

    it('should update multiple filter properties at once', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        updateSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
          filters: { brightness: 110, contrast: 130, saturation: 80 },
        })
      );

      expect(newState.album.pages[0].slots[0].filters?.brightness).toBe(110);
      expect(newState.album.pages[0].slots[0].filters?.contrast).toBe(130);
      expect(newState.album.pages[0].slots[0].filters?.saturation).toBe(80);
    });

    it('should clear filterPreset when manually adjusting filters', () => {
      const stateWithPages = createStateWithPages(1);
      // First set a preset
      let newState = albumReducer(
        stateWithPages,
        setSlotFilterPreset({
          pageIndex: 0,
          slotIndex: 0,
          preset: 'vivid',
        })
      );
      expect(newState.album.pages[0].slots[0].filterPreset).toBe('vivid');

      // Then update manually
      newState = albumReducer(
        newState,
        updateSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
          filters: { brightness: 50 },
        })
      );
      expect(newState.album.pages[0].slots[0].filterPreset).toBeUndefined();
    });

    it('should preserve existing filter values when updating', () => {
      const stateWithPages = createStateWithPages(1);
      let newState = albumReducer(
        stateWithPages,
        updateSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
          filters: { brightness: 120 },
        })
      );

      newState = albumReducer(
        newState,
        updateSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
          filters: { contrast: 140 },
        })
      );

      // Both values should be preserved
      expect(newState.album.pages[0].slots[0].filters?.brightness).toBe(120);
      expect(newState.album.pages[0].slots[0].filters?.contrast).toBe(140);
    });

    it('should not update with invalid page index', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        updateSlotFilters({
          pageIndex: 999,
          slotIndex: 0,
          filters: { brightness: 120 },
        })
      );

      // State should be unchanged
      expect(newState.album.pages[0].slots[0].filters).toBeUndefined();
    });

    it('should not update with invalid slot index', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        updateSlotFilters({
          pageIndex: 0,
          slotIndex: 999,
          filters: { brightness: 120 },
        })
      );

      // State should be unchanged
      expect(newState.album.pages[0].slots[0].filters).toBeUndefined();
    });
  });

  describe('setSlotFilterPreset', () => {
    it('should apply dynamic preset correctly', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        setSlotFilterPreset({
          pageIndex: 0,
          slotIndex: 0,
          preset: 'dynamic',
        })
      );

      expect(newState.album.pages[0].slots[0].filterPreset).toBe('dynamic');
      expect(newState.album.pages[0].slots[0].filters?.brightness).toBe(105);
      expect(newState.album.pages[0].slots[0].filters?.contrast).toBe(120);
      expect(newState.album.pages[0].slots[0].filters?.saturation).toBe(115);
    });

    it('should apply noir (grayscale) preset correctly', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        setSlotFilterPreset({
          pageIndex: 0,
          slotIndex: 0,
          preset: 'noir',
        })
      );

      expect(newState.album.pages[0].slots[0].filterPreset).toBe('noir');
      expect(newState.album.pages[0].slots[0].filters?.grayscale).toBe(100);
      expect(newState.album.pages[0].slots[0].filters?.contrast).toBe(120);
    });

    it('should apply vintage preset correctly', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        setSlotFilterPreset({
          pageIndex: 0,
          slotIndex: 0,
          preset: 'vintage',
        })
      );

      expect(newState.album.pages[0].slots[0].filterPreset).toBe('vintage');
      expect(newState.album.pages[0].slots[0].filters?.sepia).toBe(30);
      expect(newState.album.pages[0].slots[0].filters?.saturation).toBe(80);
    });

    it('should apply none preset to reset to defaults', () => {
      const stateWithPages = createStateWithPages(1);
      // First apply a filter
      let newState = albumReducer(
        stateWithPages,
        setSlotFilterPreset({
          pageIndex: 0,
          slotIndex: 0,
          preset: 'vivid',
        })
      );

      // Then apply none
      newState = albumReducer(
        newState,
        setSlotFilterPreset({
          pageIndex: 0,
          slotIndex: 0,
          preset: 'none',
        })
      );

      expect(newState.album.pages[0].slots[0].filterPreset).toBe('none');
      expect(newState.album.pages[0].slots[0].filters).toEqual(DEFAULT_FILTER_VALUES);
    });

    it('should replace previous filter values completely', () => {
      const stateWithPages = createStateWithPages(1);
      // Apply vivid first
      let newState = albumReducer(
        stateWithPages,
        setSlotFilterPreset({
          pageIndex: 0,
          slotIndex: 0,
          preset: 'vivid',
        })
      );
      expect(newState.album.pages[0].slots[0].filters?.saturation).toBe(140);

      // Apply cool (which has lower saturation)
      newState = albumReducer(
        newState,
        setSlotFilterPreset({
          pageIndex: 0,
          slotIndex: 0,
          preset: 'cool',
        })
      );
      expect(newState.album.pages[0].slots[0].filters?.saturation).toBe(90);
      expect(newState.album.pages[0].slots[0].filterPreset).toBe('cool');
    });

    it('should not update with invalid page index', () => {
      const stateWithPages = createStateWithPages(1);
      const newState = albumReducer(
        stateWithPages,
        setSlotFilterPreset({
          pageIndex: 999,
          slotIndex: 0,
          preset: 'dynamic',
        })
      );

      expect(newState.album.pages[0].slots[0].filterPreset).toBeUndefined();
    });
  });

  describe('resetSlotFilters', () => {
    it('should reset all filters to defaults', () => {
      const stateWithPages = createStateWithPages(1);
      // First apply some filters
      let newState = albumReducer(
        stateWithPages,
        updateSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
          filters: { brightness: 150, contrast: 80, saturation: 200, grayscale: 50 },
        })
      );

      // Reset
      newState = albumReducer(
        newState,
        resetSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
        })
      );

      expect(newState.album.pages[0].slots[0].filters).toEqual(DEFAULT_FILTER_VALUES);
      expect(newState.album.pages[0].slots[0].filterPreset).toBe('none');
    });

    it('should reset preset to none', () => {
      const stateWithPages = createStateWithPages(1);
      // Apply a preset
      let newState = albumReducer(
        stateWithPages,
        setSlotFilterPreset({
          pageIndex: 0,
          slotIndex: 0,
          preset: 'dramatic',
        })
      );
      expect(newState.album.pages[0].slots[0].filterPreset).toBe('dramatic');

      // Reset
      newState = albumReducer(
        newState,
        resetSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
        })
      );

      expect(newState.album.pages[0].slots[0].filterPreset).toBe('none');
    });

    it('should not affect other slots', () => {
      // Create a state with a 4-grid layout (4 slots)
      const stateWithPages: AlbumState = {
        ...initialState,
        album: {
          ...initialState.album,
          id: 'album-1',
          pages: [
            {
              id: 'page-1',
              layoutId: '4-grid',
              background: '#ffffff',
              slots: Array.from({ length: 4 }, (_, i) => ({
                id: `slot-${i}`,
                photoId: null,
                position: { x: 0, y: 0 },
                scale: 1,
                rotation: 0,
              })),
            },
          ],
        },
      };

      // Apply filters to slot 0 and slot 1
      let newState = albumReducer(
        stateWithPages,
        updateSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
          filters: { brightness: 150 },
        })
      );
      newState = albumReducer(
        newState,
        updateSlotFilters({
          pageIndex: 0,
          slotIndex: 1,
          filters: { contrast: 180 },
        })
      );

      // Reset only slot 0
      newState = albumReducer(
        newState,
        resetSlotFilters({
          pageIndex: 0,
          slotIndex: 0,
        })
      );

      // Slot 0 should be reset
      expect(newState.album.pages[0].slots[0].filters?.brightness).toBe(100);
      // Slot 1 should still have its filter
      expect(newState.album.pages[0].slots[1].filters?.contrast).toBe(180);
    });
  });

  describe('FILTER_PRESETS constant', () => {
    it('should have all expected presets', () => {
      const presetNames = FILTER_PRESETS.map((p) => p.name);
      expect(presetNames).toContain('none');
      expect(presetNames).toContain('dynamic');
      expect(presetNames).toContain('vivid');
      expect(presetNames).toContain('warm');
      expect(presetNames).toContain('cool');
      expect(presetNames).toContain('vintage');
      expect(presetNames).toContain('dramatic');
      expect(presetNames).toContain('soft');
      expect(presetNames).toContain('noir');
      expect(presetNames).toContain('sunset');
      expect(presetNames).toContain('forest');
      expect(presetNames).toContain('ocean');
      expect(presetNames).toContain('fade');
      expect(presetNames).toContain('sharp');
      expect(presetNames).toContain('dreamy');
    });

    it('should have 15 presets total', () => {
      expect(FILTER_PRESETS).toHaveLength(15);
    });

    it('should have none preset with default values', () => {
      const nonePreset = FILTER_PRESETS.find((p) => p.name === 'none');
      expect(nonePreset).toBeDefined();
      expect(nonePreset?.values).toEqual(DEFAULT_FILTER_VALUES);
    });

    it('should have valid filter values in all presets', () => {
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
      });
    });

    it('each preset should have a label and description', () => {
      FILTER_PRESETS.forEach((preset) => {
        expect(preset.label).toBeTruthy();
        expect(preset.description).toBeTruthy();
      });
    });
  });

  describe('DEFAULT_FILTER_VALUES constant', () => {
    it('should have neutral default values', () => {
      expect(DEFAULT_FILTER_VALUES.brightness).toBe(100);
      expect(DEFAULT_FILTER_VALUES.contrast).toBe(100);
      expect(DEFAULT_FILTER_VALUES.saturation).toBe(100);
      expect(DEFAULT_FILTER_VALUES.hue).toBe(0);
      expect(DEFAULT_FILTER_VALUES.blur).toBe(0);
      expect(DEFAULT_FILTER_VALUES.grayscale).toBe(0);
      expect(DEFAULT_FILTER_VALUES.sepia).toBe(0);
      expect(DEFAULT_FILTER_VALUES.invert).toBe(0);
      expect(DEFAULT_FILTER_VALUES.opacity).toBe(100);
    });
  });

  describe('extraReducers', () => {
    it('should clear state when signOut.fulfilled is dispatched', () => {
      const stateWithData: AlbumState = {
        album: {
          id: 'album-1',
          name: 'My Album',
          size: '12x12',
          pages: [createMockPage('page-1')],
          currentPageIndex: 0,
        },
        selectedSlot: { pageIndex: 0, slotIndex: 0 },
        viewMode: 'edit',
        currentSpread: 2,
        status: 'succeeded',
        error: 'some error',
        albums: [{ id: 'album-1', name: 'My Album', size: '12x12', currentPageIndex: 0 }],
        albumsStatus: 'succeeded',
      };

      const action = { type: signOut.fulfilled.type };
      const newState = albumReducer(stateWithData, action);

      expect(newState.album.id).toBeNull();
      expect(newState.album.name).toBe('Untitled Album');
      expect(newState.album.size).toBe('10x10');
      expect(newState.album.pages).toHaveLength(0);
      expect(newState.selectedSlot).toBeNull();
      expect(newState.viewMode).toBe('book');
      expect(newState.currentSpread).toBe(0);
      expect(newState.status).toBe('idle');
      expect(newState.error).toBeNull();
      expect(newState.albums).toHaveLength(0);
      expect(newState.albumsStatus).toBe('idle');
    });
  });
});
