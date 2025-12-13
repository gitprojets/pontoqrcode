import { useEffect, useState } from 'react';
import { QrCode, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function QRCodeDisplay() {
  const { user, profile } = useAuth();
  const [qrData, setQrData] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState(60);

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
  }, []);

  const generateQRCode = () => {
    // In production, this would be a signed JWT token
    const payload = {
      userId: user?.id,
      matricula: profile?.matricula,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    };
    setQrData(btoa(JSON.stringify(payload)));
    setExpiresIn(60);
  };

  return (
    <div className="card-elevated p-8 text-center max-w-md mx-auto animate-slide-up">
      <h2 className="text-xl font-display font-semibold text-foreground mb-2">
        Seu QR Code de Presença
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Apresente este código no leitor para registrar sua presença
      </p>

      {/* QR Code Placeholder - In production, use a QR library */}
      <div className="relative mx-auto w-64 h-64 bg-muted rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
        <div className="absolute inset-4 border-4 border-primary/20 rounded-xl" />
        <div className="grid grid-cols-8 gap-1 p-4">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-sm ${
                Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center shadow-lg">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span className="text-sm">Expira em</span>
          <span className={`text-2xl font-bold font-display ${
            expiresIn <= 10 ? 'text-destructive' : 'text-foreground'
          }`}>
            {expiresIn}s
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 rounded-full"
            style={{ width: `${(expiresIn / 60) * 100}%` }}
          />
        </div>
      </div>

      <Button onClick={generateQRCode} variant="outline" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Gerar novo código
      </Button>

      <p className="mt-6 text-xs text-muted-foreground">
        Matrícula: {profile?.matricula || 'Não definida'}
      </p>
    </div>
  );
}
