import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Clock, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function QRCodeGenerator() {
  const { user, profile } = useAuth();
  const [qrData, setQrData] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-qr-token');
      
      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.token) {
        setQrData(data.token);
        setExpiresIn(data.expiresIn || 60);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Error generating QR token:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar QR Code');
      // Do not fall back to insecure local generation - require secure JWT tokens
      setQrData('');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile?.matricula]);

  useEffect(() => {
    generateQRCode();
    
    const interval = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          generateQRCode();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [generateQRCode]);

  const getTimerColor = () => {
    if (expiresIn <= 10) return 'text-destructive';
    if (expiresIn <= 30) return 'text-warning';
    return 'text-foreground';
  };

  return (
    <div className="card-elevated p-4 sm:p-8 text-center max-w-md mx-auto animate-slide-up">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground">
          Seu QR Code de Presença
        </h2>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
        Apresente este código ao diretor para registrar sua presença
      </p>

      {/* QR Code */}
      <div className="relative mx-auto w-48 h-48 sm:w-64 sm:h-64 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 p-3 sm:p-4 shadow-inner">
        {isLoading ? (
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-primary" />
        ) : qrData ? (
          <QRCodeSVG
            value={qrData}
            size={168}
            level="H"
            includeMargin={false}
            className="w-full h-full"
            imageSettings={{
              src: "/favicon.ico",
              height: 20,
              width: 20,
              excavate: true,
            }}
          />
        ) : (
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-destructive" />
        )}
        <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">Tente novamente ou verifique sua conexão</p>
        </div>
      )}

      {/* Security Badge */}
      <div className="mb-3 sm:mb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3 h-3 text-primary" />
        <span>Assinatura JWT criptográfica</span>
      </div>

      {/* Timer */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span className="text-xs sm:text-sm">Expira em</span>
          <span className={`text-xl sm:text-2xl font-bold font-display transition-colors ${getTimerColor()}`}>
            {expiresIn}s
          </span>
        </div>
        <div className="mt-2 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${
              expiresIn <= 10 
                ? 'bg-destructive' 
                : expiresIn <= 30 
                  ? 'bg-warning' 
                  : 'bg-primary'
            }`}
            style={{ width: `${(expiresIn / 60) * 100}%` }}
          />
        </div>
      </div>

      <Button onClick={generateQRCode} variant="outline" className="gap-2 w-full sm:w-auto" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        Gerar novo código
      </Button>

      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Matrícula:</strong> {profile?.matricula || 'Não definida'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          <strong>Nome:</strong> {profile?.nome || 'Não definido'}
        </p>
      </div>
    </div>
  );
}
