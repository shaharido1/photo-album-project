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
});
