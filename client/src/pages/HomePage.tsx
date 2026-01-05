import { useState } from 'react';
import { Plus, Layout, Image as ImageIcon, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/app/hooks';
import { selectGooglePhotosIsConnected } from '@/features/googlePhotos/googlePhotosSlice';
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog';
import { LoginButton } from '@/components/auth/LoginButton';
import { cn } from '@/lib/utils';

export function HomePage(): JSX.Element {
    const isGoogleConnected = useAppSelector(selectGooglePhotosIsConnected);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    return (
        <div className="flex-1 overflow-y-auto bg-background">
            {/* Gradient Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative max-w-6xl mx-auto px-6 py-20 space-y-24">
                {/* Hero Section */}
                <section className="text-center space-y-10 py-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-500">
                            <Sparkles className="h-4 w-4" />
                            <span>The future of photo albums is here</span>
                        </div>
                        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            Memories worth <br />
                            <span className="text-primary">keeping forever.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-in fade-in duration-1000 delay-200">
                            Transform your digital gallery into beautifully crafted photo books.
                            Professional designs, intuitive editing, and seamless cloud integration.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in fade-in duration-1000 delay-300">
                        <Button
                            size="lg"
                            className="h-14 px-10 text-lg rounded-full shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95 group font-semibold"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                            Start Your Story
                        </Button>
                        <LoginButton variant="outline" className="h-14 px-10 text-lg rounded-full border-2 hover:bg-accent transition-all font-semibold">
                            Sign in to save
                        </LoginButton>
                    </div>
                </section>

                {/* Value Propositions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="relative overflow-hidden border-none bg-gradient-to-b from-muted/50 to-muted/20 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-300 shadow-none">
                        <CardHeader className="p-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Layout className="h-6 w-6 text-blue-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold mb-3">Smart Layouts</CardTitle>
                            <CardDescription className="text-lg leading-relaxed">
                                Our intelligent engine suggests the perfect arrangement for your photos, saving you hours of work.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="relative overflow-hidden border-none bg-gradient-to-b from-muted/50 to-muted/20 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-300 shadow-none">
                        <CardHeader className="p-8">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <ImageIcon className="h-6 w-6 text-orange-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold mb-3">Cloud Sync</CardTitle>
                            <CardDescription className="text-lg leading-relaxed">
                                Connect Google Photos and import your library instantly. No more manual uploads.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="relative overflow-hidden border-none bg-gradient-to-b from-muted/50 to-muted/20 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-300 shadow-none">
                        <CardHeader className="p-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Shield className="h-6 w-6 text-emerald-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold mb-3">Safe & Secure</CardTitle>
                            <CardDescription className="text-lg leading-relaxed">
                                Your memories are encrypted and stored securely. You always have full control over your data.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Interactive Preview Section (Mockup) */}
                <section className="py-12">
                    <div className="rounded-3xl border border-border/50 bg-muted/30 overflow-hidden shadow-2xl aspect-[16/9] md:aspect-[21/9] relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-purple-500/5" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-background/80 backdrop-blur-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Zap className="h-8 w-8 text-primary fill-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold">Experience the Editor</h3>
                                <p className="text-muted-foreground text-lg max-w-lg">
                                    Our lightning-fast editor works right in your browser. No downloads, no lag.
                                </p>
                            </div>
                            <Button variant="secondary" size="lg" className="rounded-full px-8" onClick={() => setIsCreateDialogOpen(true)}>
                                Try the Demo
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Footer Section */}
                <footer className="pt-12 pb-24 border-t text-center space-y-4">
                    <p className="text-muted-foreground">Ready to preserve your memories?</p>
                    <div className="flex items-center justify-center gap-8 text-sm font-medium">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Contact Us</a>
                    </div>
                </footer>
            </div>

            <CreateAlbumDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
        </div>
    );
}
