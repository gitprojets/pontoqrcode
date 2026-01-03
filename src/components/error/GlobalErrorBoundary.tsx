import { ReactNode, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

// Full-page error fallback for critical errors
function CriticalErrorFallback({ error }: { error: Error }) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring' }}
          className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center"
        >
          <AlertTriangle className="w-12 h-12 text-destructive" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Erro Crítico
          </h1>
          <p className="text-muted-foreground">
            A aplicação encontrou um erro inesperado e precisa ser reiniciada.
          </p>
        </div>

        <details className="text-left rounded-lg bg-muted/30 p-4 text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Detalhes do erro
          </summary>
          <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-destructive font-mono overflow-auto max-h-32">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>

        <Button onClick={handleReload} size="lg" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Recarregar Aplicação
        </Button>

        <p className="text-xs text-muted-foreground">
          Se o problema persistir, entre em contato com o suporte técnico.
        </p>
      </motion.div>
    </div>
  );
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  // Capture unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled Promise Rejection', {
        action: 'unhandled_rejection',
        reason: String(event.reason),
      });
    };

    const handleError = (event: ErrorEvent) => {
      logger.error('Global Error', {
        action: 'global_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    logger.info('Global error handlers initialized', {
      action: 'init',
      component: 'GlobalErrorBoundary',
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary
      componentName="App"
      fallback={<CriticalErrorFallback error={new Error('Erro crítico na aplicação')} />}
      onError={(error) => {
        logger.logError(error, {
          component: 'GlobalErrorBoundary',
          action: 'critical_error',
          severity: 'critical',
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
