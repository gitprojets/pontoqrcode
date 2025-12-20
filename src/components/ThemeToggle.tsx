import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative h-11 w-11 rounded-full border-2 border-primary/40 bg-background shadow-lg hover:bg-accent hover:border-primary hover:shadow-xl transition-all duration-300 overflow-hidden group"
          >
            {/* Sun icon */}
            <Sun 
              className="h-5 w-5 text-amber-500 transition-all duration-500 ease-in-out rotate-0 scale-100 dark:-rotate-180 dark:scale-0 group-hover:rotate-12" 
            />
            {/* Moon icon */}
            <Moon 
              className="absolute h-5 w-5 text-indigo-400 transition-all duration-500 ease-in-out rotate-180 scale-0 dark:rotate-0 dark:scale-100 group-hover:dark:-rotate-12" 
            />
            {/* Glow effect */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/20 to-transparent dark:from-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="sr-only">Alternar tema</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="font-medium">
          <p>{isDark ? 'Modo Claro' : 'Modo Escuro'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
