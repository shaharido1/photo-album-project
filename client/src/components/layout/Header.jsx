import { Button } from '@/components/ui/button';
import { Download, Save, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

// Check system preference synchronously before first render
const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add('dark');
  }
  return prefersDark;
};

export function Header() {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Photo Album</h1>
        <span className="text-sm text-muted-foreground">Untitled Album</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Saved</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </header>
  );
}
