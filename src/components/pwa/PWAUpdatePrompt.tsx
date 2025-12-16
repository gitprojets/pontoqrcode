import { RefreshCw, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { cn } from '@/lib/utils';

export function PWAUpdatePrompt() {
  const { needsUpdate, isUpdating, applyUpdate, dismissUpdate } = usePWAUpdate();

  if (!needsUpdate) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 z-[100] animate-slide-up",
      "sm:left-auto sm:right-4 sm:max-w-sm"
    )}>
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Nova versão disponível!
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Uma atualização do FrequênciaQR está pronta para ser instalada.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="gradient"
                onClick={applyUpdate}
                disabled={isUpdating}
                className="gap-1.5 text-xs h-8"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Atualizar Agora
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissUpdate}
                disabled={isUpdating}
                className="text-xs h-8"
              >
                Depois
              </Button>
            </div>
          </div>
          <button
            onClick={dismissUpdate}
            disabled={isUpdating}
            className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
