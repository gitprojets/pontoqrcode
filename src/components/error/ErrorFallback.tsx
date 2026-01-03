import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
  componentName?: string;
}

export function ErrorFallback({ error, resetErrorBoundary, componentName }: ErrorFallbackProps) {
  const handleReportError = () => {
    const logs = logger.exportLogs();
    console.log('Error Report:', {
      error: error.message,
      stack: error.stack,
      component: componentName,
      logs,
    });
    // Could integrate with a bug tracking service here
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[400px] flex items-center justify-center p-6"
    >
      <Card className="max-w-lg w-full border-destructive/20 bg-gradient-to-br from-background to-destructive/5">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4"
          >
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </motion.div>
          <CardTitle className="text-xl text-foreground">
            Ops! Algo deu errado
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {componentName 
              ? `Ocorreu um erro no componente "${componentName}"`
              : 'Ocorreu um erro inesperado na aplicação'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error details (collapsible for dev) */}
          <details className="rounded-lg bg-muted/50 p-3 text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-destructive font-mono">
              {error.message}
            </pre>
          </details>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {resetErrorBoundary && (
              <Button 
                onClick={resetErrorBoundary}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            )}
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </div>

          <Button 
            onClick={handleReportError}
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
          >
            <Bug className="w-4 h-4 mr-2" />
            Reportar problema
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
