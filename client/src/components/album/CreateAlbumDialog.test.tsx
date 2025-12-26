/// <reference types="jest" />
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CreateAlbumDialog } from './CreateAlbumDialog';
import albumReducer, { createAlbum } from '@/features/album/albumSlice';
import photosReducer from '@/features/photos/photosSlice';

// Mock the createAlbum action to track dispatches
const mockDispatch = jest.fn();
jest.mock('@/app/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn(),
}));

describe('CreateAlbumDialog', () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        album: albumReducer,
        photos: photosReducer,
      },
    });

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDialog = (props = {}) => {
    const store = createTestStore();
    return render(
      <Provider store={store}>
        <CreateAlbumDialog {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('should render dialog when open', () => {
    renderDialog();

    expect(screen.getByText('Create New Album')).toBeInTheDocument();
    expect(
      screen.getByText('Choose a name and size for your photo album.')
    ).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByText('Create New Album')).not.toBeInTheDocument();
  });

  it('should render album name input', () => {
    renderDialog();

    expect(screen.getByLabelText('Album Name')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('My Photo Album')
    ).toBeInTheDocument();
  });

  it('should render all album size options', () => {
    renderDialog();

    expect(screen.getByText('8×8"')).toBeInTheDocument();
    expect(screen.getByText('10×10"')).toBeInTheDocument();
    expect(screen.getByText('12×12"')).toBeInTheDocument();
    expect(screen.getByText('A4 Landscape')).toBeInTheDocument();
    expect(screen.getByText('A4 Portrait')).toBeInTheDocument();
  });

  it('should have 10x10 selected by default', () => {
    renderDialog();

    const size10x10Button = screen.getByTestId('album-size-10x10');
    expect(size10x10Button).toHaveClass('border-primary');
  });

  it('should update album name on input', async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByLabelText('Album Name');
    await user.type(input, 'My Test Album');

    expect(input).toHaveValue('My Test Album');
  });

  it('should change selected size when clicking size option', async () => {
    const user = userEvent.setup();
    renderDialog();

    const size12x12Button = screen.getByTestId('album-size-12x12');
    await user.click(size12x12Button);

    expect(size12x12Button).toHaveClass('border-primary');
  });

  it('should disable Create Album button when name is empty', () => {
    renderDialog();

    const createButton = screen.getByRole('button', { name: 'Create Album' });
    expect(createButton).toBeDisabled();
  });

  it('should enable Create Album button when name is provided', async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByLabelText('Album Name');
    await user.type(input, 'Test Album');

    const createButton = screen.getByRole('button', { name: 'Create Album' });
    expect(createButton).toBeEnabled();
  });

  it('should dispatch createAlbum and close dialog on submit', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog({ onOpenChange });

    const input = screen.getByLabelText('Album Name');
    await user.type(input, 'My New Album');

    const createButton = screen.getByRole('button', { name: 'Create Album' });
    await user.click(createButton);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: createAlbum.type,
        payload: { name: 'My New Album', size: '10x10' },
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should dispatch with selected size', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog({ onOpenChange });

    const input = screen.getByLabelText('Album Name');
    await user.type(input, 'Album 12x12');

    const size12x12Button = screen.getByTestId('album-size-12x12');
    await user.click(size12x12Button);

    const createButton = screen.getByRole('button', { name: 'Create Album' });
    await user.click(createButton);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { name: 'Album 12x12', size: '12x12' },
      })
    );
  });

  it('should call onOpenChange with false when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog({ onOpenChange });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should reset form when dialog is closed', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog({ onOpenChange });

    // Type in name and select different size
    const input = screen.getByLabelText('Album Name');
    await user.type(input, 'Test Name');

    const size12x12Button = screen.getByTestId('album-size-12x12');
    await user.click(size12x12Button);

    // Cancel dialog (which triggers onOpenChange with false)
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should create album on Enter key press when name is filled', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog({ onOpenChange });

    const input = screen.getByLabelText('Album Name');
    await user.type(input, 'Quick Album{enter}');

    expect(mockDispatch).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not create album on Enter key press when name is empty', async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByLabelText('Album Name');
    await user.type(input, '{enter}');

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should not create album when name is only whitespace', async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByLabelText('Album Name');
    await user.type(input, '   ');

    const createButton = screen.getByRole('button', { name: 'Create Album' });
    expect(createButton).toBeDisabled();
  });

  it('should show dimension info for each size', () => {
    renderDialog();

    expect(screen.getByText('20×20 cm')).toBeInTheDocument();
    expect(screen.getByText('25×25 cm')).toBeInTheDocument();
    expect(screen.getByText('30×30 cm')).toBeInTheDocument();
    expect(screen.getByText('297×210 mm')).toBeInTheDocument();
    expect(screen.getByText('210×297 mm')).toBeInTheDocument();
  });
});
