/// <reference types="jest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LandingPage } from './LandingPage';
import albumReducer, { fetchAlbums, fetchAlbum } from '@/features/album/albumSlice';
import authReducer from '@/features/auth/authSlice';
import googlePhotosReducer, {
    checkGooglePhotosStatus,
    openDialog,
    startGooglePhotosAuth
} from '@/features/googlePhotos/googlePhotosSlice';
import photosReducer from '@/features/photos/photosSlice';

// Mock the async thunks
jest.mock('@/features/album/albumSlice', () => {
    const actual = jest.requireActual('@/features/album/albumSlice');
    return {
        ...actual,
        __esModule: true,
        fetchAlbums: jest.fn(() => ({ type: 'album/fetchAlbums' })),
        fetchAlbum: jest.fn((id) => ({ type: 'album/fetchAlbum', payload: id })),
    };
});

jest.mock('@/features/googlePhotos/googlePhotosSlice', () => {
    const actual = jest.requireActual('@/features/googlePhotos/googlePhotosSlice');
    return {
        ...actual,
        __esModule: true,
        checkGooglePhotosStatus: jest.fn(() => ({ type: 'googlePhotos/checkStatus' })),
        openDialog: jest.fn(() => ({ type: 'googlePhotos/openDialog' })),
        startGooglePhotosAuth: jest.fn(() => ({ type: 'googlePhotos/startAuth' })),
    };
});

// Mock the hooks
const mockDispatch = jest.fn();
jest.mock('@/app/hooks', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selector: any) => selector(mockState),
}));

let mockState: any;

describe('LandingPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState = {
            auth: {
                user: null,
                status: 'idle',
                error: null,
                isInitialized: true,
            },
            album: {
                album: { id: null, name: '', size: '10x10', pages: [], currentPageIndex: 0 },
                albums: [],
                albumsStatus: 'idle',
                status: 'idle',
                error: null,
            },
            googlePhotos: {
                isConnected: false,
                connectionStatus: 'idle',
            },
            photos: {
                items: [],
            }
        };
    });

    const renderLandingPage = () => {
        return render(
            <Provider store={configureStore({
                reducer: {
                    album: albumReducer,
                    auth: authReducer,
                    googlePhotos: googlePhotosReducer,
                    photos: photosReducer
                }
            })}>
                <LandingPage />
            </Provider>
        );
    };

    it('renders hero section with title', () => {
        renderLandingPage();
        expect(screen.getByText('Memories worth keeping.')).toBeInTheDocument();
    });

    it('shows auth prompt when not authenticated', () => {
        mockState.auth.user = null;
        renderLandingPage();
        expect(screen.getByText(/Sign in to save your projects/)).toBeInTheDocument();
    });

    it('dispatches fetchAlbums and checkGooglePhotosStatus on mount when authenticated', () => {
        mockState.auth.user = { id: '123', email: 'test@example.com' };
        renderLandingPage();

        expect(fetchAlbums).toHaveBeenCalled();
        expect(checkGooglePhotosStatus).toHaveBeenCalled();
    });

    it('renders recent albums section when authenticated', () => {
        mockState.auth.user = { id: '123' };
        mockState.album.albums = [{ id: '1', name: 'My Travel Album', size: '10x10', currentPageIndex: 0 }];
        mockState.album.albumsStatus = 'succeeded';

        renderLandingPage();

        expect(screen.getByText('Your Recent Albums')).toBeInTheDocument();
        expect(screen.getByText('My Travel Album')).toBeInTheDocument();
    });

    it('dispatches fetchAlbum when clicking an album card', () => {
        mockState.auth.user = { id: '123' };
        mockState.album.albums = [{ id: 'album-123', name: 'My Travel Album', size: '10x10', currentPageIndex: 0 }];
        mockState.album.albumsStatus = 'succeeded';

        renderLandingPage();

        const albumCard = screen.getByText('My Travel Album');
        fireEvent.click(albumCard);

        expect(fetchAlbum).toHaveBeenCalledWith('album-123');
    });

    describe('Google Photos integration', () => {
        it('shows "Google Photos" when not connected', () => {
            mockState.auth.user = { id: '123' };
            mockState.googlePhotos.isConnected = false;

            renderLandingPage();

            expect(screen.getByText('Google Photos')).toBeInTheDocument();
        });

        it('shows "Import Photos" when connected', () => {
            mockState.auth.user = { id: '123' };
            mockState.googlePhotos.isConnected = true;

            renderLandingPage();

            expect(screen.getByText('Import Photos')).toBeInTheDocument();
        });

        it('dispatches startGooglePhotosAuth when clicking and not connected', () => {
            mockState.auth.user = { id: '123' };
            mockState.googlePhotos.isConnected = false;

            renderLandingPage();

            const card = screen.getByText('Google Photos');
            fireEvent.click(card);

            expect(startGooglePhotosAuth).toHaveBeenCalled();
        });

        it('dispatches openDialog when clicking and connected', () => {
            mockState.auth.user = { id: '123' };
            mockState.googlePhotos.isConnected = true;

            renderLandingPage();

            const card = screen.getByText('Import Photos');
            fireEvent.click(card);

            expect(openDialog).toHaveBeenCalled();
        });
    });
});
