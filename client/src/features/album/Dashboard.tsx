import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Clock, ChevronRight, LayoutGrid, Search, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
    fetchAlbums,
    selectAlbums,
    selectAlbumsStatus,
    deleteAlbum,
} from '@/features/album/albumSlice';
import { selectUser } from '@/features/auth/authSlice';
import {
    checkGooglePhotosStatus
} from '@/features/googlePhotos/googlePhotosSlice';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function Dashboard(): JSX.Element {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const albums = useAppSelector(selectAlbums);
    const status = useAppSelector(selectAlbumsStatus);
    const user = useAppSelector(selectUser);


    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [albumToDelete, setAlbumToDelete] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        dispatch(fetchAlbums());
        dispatch(checkGooglePhotosStatus());
    }, [dispatch]);

    const handleOpenAlbum = (albumId: string) => {
        // Navigate via URL - the useUrlSync hook will handle fetching the album
        navigate(`/album/${albumId}`);
    };

    const handleDeleteAlbum = () => {
        if (albumToDelete) {
            dispatch(deleteAlbum(albumToDelete.id));
            setAlbumToDelete(null);
        }
    };



    const filteredAlbums = albums.filter(album =>
        album.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto bg-background/50">
            <div className="max-w-7xl mx-auto px-8 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Hey{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''} 👋
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium">
                            Continue your creative journey where you left off.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-64 hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search albums..."
                                className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold rounded-full px-6"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="mr-2 h-5 w-5" /> Create New
                        </Button>
                    </div>
                </div>

                {/* Stats / Quick Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="group border-none bg-gradient-to-br from-blue-500/10 to-blue-500/5 shadow-none p-6 flex flex-row items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                            <LayoutGrid className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-bold">Quick Layouts</CardTitle>
                            <CardDescription className="text-sm font-medium">Explore new templates</CardDescription>
                        </div>
                    </Card>

                    <Card className="group border-none bg-gradient-to-br from-purple-500/10 to-purple-500/5 shadow-none p-6 flex flex-row items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                            <Clock className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-bold">{albums.length} Albums</CardTitle>
                            <CardDescription className="text-sm font-medium">Total projects created</CardDescription>
                        </div>
                    </Card>
                </div>

                {/* Dashboard Main Content */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            Your Recent Projects
                        </h2>
                        {albums.length > 0 && (
                            <Button variant="ghost" size="sm" className="font-medium">
                                View All
                            </Button>
                        )}
                    </div>

                    {status === 'loading' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="h-48 w-full rounded-2xl" />
                                    <Skeleton className="h-5 w-3/4 rounded-full" />
                                    <Skeleton className="h-4 w-1/2 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : filteredAlbums.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredAlbums.map((album) => (
                                <Card
                                    key={album.id}
                                    className="overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl"
                                    onClick={() => handleOpenAlbum(album.id!)}
                                >
                                    <div className="h-48 bg-muted/50 flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
                                        <BookOpen className="h-16 w-16 text-muted-foreground/20 group-hover:scale-110 group-hover:text-primary/20 transition-all duration-500" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                                            <Button variant="secondary" size="lg" className="gap-2 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-all duration-300 font-bold">
                                                Open Album <ChevronRight className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        {/* Menu button */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAlbumToDelete({ id: album.id!, name: album.name });
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="p-5 space-y-2">
                                        <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">{album.name}</CardTitle>
                                        <CardDescription className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-muted-foreground/80">{album.size}</span>
                                            {album.updatedAt && (
                                                <span className="text-xs">
                                                    Updated {new Date(album.updatedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-border/50 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mx-auto shadow-sm">
                                <Plus className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-bold">No albums found</p>
                                <p className="text-muted-foreground max-w-xs mx-auto">
                                    {searchQuery
                                        ? `We couldn't find any albums matching "${searchQuery}"`
                                        : "You haven't created any albums yet. Let's start your first one!"}
                                </p>
                            </div>
                            <Button size="lg" className="rounded-full px-8" onClick={() => setIsCreateDialogOpen(true)}>
                                Create First Album
                            </Button>
                        </div>
                    )}
                </section>
            </div>

            <CreateAlbumDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />

            {/* Delete Album Confirmation Dialog */}
            <AlertDialog open={!!albumToDelete} onOpenChange={(open) => !open && setAlbumToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete album?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{albumToDelete?.name}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAlbum}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
