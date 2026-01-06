import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Clock, Layout, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
    fetchAlbums,
    selectAlbums,
    selectAlbumsStatus,
} from '@/features/album/albumSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import {
    checkGooglePhotosStatus
} from '@/features/googlePhotos/googlePhotosSlice';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';
import { Skeleton } from '@/components/ui/skeleton';

export function LandingPage(): JSX.Element {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const albums = useAppSelector(selectAlbums);
    const status = useAppSelector(selectAlbumsStatus);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchAlbums());
            dispatch(checkGooglePhotosStatus());
        }
    }, [dispatch, isAuthenticated]);

    const handleOpenAlbum = (albumId: string) => {
        // Navigate via URL - the useUrlSync hook will handle fetching
        navigate(`/album/${albumId}`);
    };



    return (
        <div className="flex-1 overflow-y-auto bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Hero Section */}
                <section className="text-center space-y-4 py-12">
                    <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                        Memories worth keeping.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Design beautiful, high-quality photo albums with ease.
                        Choose your layout, drag your photos, and create a masterpiece.
                    </p>
                    {!isAuthenticated && (
                        <div className="pt-4">
                            <p className="text-sm text-muted-foreground mb-4">Sign in to save your projects and access them anywhere.</p>
                        </div>
                    )}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create New Album Card */}
                    <Card
                        className="group relative overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Plus className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="mb-2">Create New Album</CardTitle>
                        <CardDescription>Start a fresh story from scratch</CardDescription>
                    </Card>

                    {/* Features / Info Cards */}
                    <Card className="bg-muted/30 border-none shadow-none">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                                <Layout className="h-5 w-5 text-blue-600" />
                            </div>
                            <CardTitle className="text-lg">Smart Layouts</CardTitle>
                            <CardDescription>Pro-designed templates for any number of photos.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Recent Projects Section */}
                {isAuthenticated && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <h2 className="text-2xl font-bold">Your Recent Albums</h2>
                            </div>
                            <p className="text-sm text-muted-foreground">{albums.length} projects found</p>
                        </div>

                        {status === 'loading' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="space-y-3">
                                        <Skeleton className="h-40 w-full rounded-xl" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : albums.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {albums.map((album) => (
                                    <Card
                                        key={album.id}
                                        className="overflow-hidden group hover:shadow-xl transition-all cursor-pointer border-transparent hover:border-primary/20"
                                        onClick={() => handleOpenAlbum(album.id!)}
                                    >
                                        <div className="h-40 bg-muted flex items-center justify-center relative">
                                            <BookOpen className="h-12 w-12 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <Button variant="secondary" size="sm" className="gap-2">
                                                    Continue <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-base truncate">{album.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 text-xs">
                                                <span>{album.size}</span>
                                                <span>•</span>
                                                <span>Page {album.currentPageIndex + 1}</span>
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                                <p className="text-muted-foreground">You haven't created any albums yet.</p>
                                <Button variant="link" onClick={() => setIsCreateDialogOpen(true)}>
                                    Create your first one now
                                </Button>
                            </div>
                        )}
                    </section>
                )}
            </div>

            <CreateAlbumDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
        </div>
    );
}
