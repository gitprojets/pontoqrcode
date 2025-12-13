import { useState } from 'react';
import { QrCode, CheckCircle, XCircle, AlertCircle, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ScanResult = 'idle' | 'success' | 'error' | 'warning';

interface ScanHistory {
  id: string;
  nome: string;
  cargo: string;
  horario: string;
  status: 'entrada' | 'saida';
  resultado: ScanResult;
}

export function AttendanceScanner() {
  const [scanResult, setScanResult] = useState<ScanResult>('idle');
  const [lastScan, setLastScan] = useState<ScanHistory | null>(null);
  const [history, setHistory] = useState<ScanHistory[]>([
    {
      id: '1',
      nome: 'Maria Silva',
      cargo: 'Professora',
      horario: '07:32',
      status: 'entrada',
      resultado: 'success',
    },
    {
      id: '2',
      nome: 'José Santos',
      cargo: 'Coordenador',
      horario: '07:45',
      status: 'entrada',
      resultado: 'success',
    },
    {
      id: '3',
      nome: 'Ana Oliveira',
      cargo: 'Professora',
      horario: '08:15',
      status: 'entrada',
      resultado: 'warning',
    },
  ]);

  const simulateScan = () => {
    setScanResult('idle');
    
    // Simulate scanning
    setTimeout(() => {
      const results: ScanResult[] = ['success', 'success', 'success', 'warning', 'error'];
      const result = results[Math.floor(Math.random() * results.length)];
      setScanResult(result);

      const newScan: ScanHistory = {
        id: Date.now().toString(),
        nome: ['Carlos Mendes', 'Patrícia Lima', 'Roberto Alves'][Math.floor(Math.random() * 3)],
        cargo: ['Professor', 'Vigia', 'Coordenador'][Math.floor(Math.random() * 3)],
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: Math.random() > 0.5 ? 'entrada' : 'saida',
        resultado: result,
      };

      setLastScan(newScan);
      setHistory((prev) => [newScan, ...prev.slice(0, 9)]);

      if (result === 'success') {
        toast.success('Presença registrada com sucesso!');
      } else if (result === 'warning') {
        toast.warning('Presença registrada com atraso.');
      } else {
        toast.error('QR Code inválido ou expirado.');
      }
    }, 1000);
  };

  const resultConfig = {
    idle: {
      icon: Scan,
      bg: 'bg-muted',
      text: 'Aguardando leitura...',
      color: 'text-muted-foreground',
    },
    success: {
      icon: CheckCircle,
      bg: 'bg-success/10',
      text: 'Presença registrada!',
      color: 'text-success',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-warning/10',
      text: 'Registrado com atraso',
      color: 'text-warning',
    },
    error: {
      icon: XCircle,
      bg: 'bg-destructive/10',
      text: 'QR inválido',
      color: 'text-destructive',
    },
  };

  const config = resultConfig[scanResult];
  const Icon = config.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Scanner */}
      <div className="card-elevated p-8 animate-slide-up">
        <h2 className="text-xl font-display font-semibold text-foreground mb-6">
          Leitor de QR Code
        </h2>

        <div className={`relative aspect-square max-w-sm mx-auto rounded-2xl ${config.bg} flex items-center justify-center mb-6 transition-colors duration-300`}>
          <div className="absolute inset-4 border-2 border-dashed border-border rounded-xl" />
          
          <div className="text-center">
            <Icon className={`w-16 h-16 mx-auto mb-4 ${config.color}`} />
            <p className={`font-medium ${config.color}`}>{config.text}</p>
            {lastScan && scanResult !== 'idle' && (
              <div className="mt-4 text-foreground">
                <p className="font-semibold">{lastScan.nome}</p>
                <p className="text-sm text-muted-foreground">{lastScan.cargo}</p>
                <p className="text-sm text-muted-foreground">
                  {lastScan.status === 'entrada' ? 'Entrada' : 'Saída'} às {lastScan.horario}
                </p>
              </div>
            )}
          </div>
        </div>

        <Button onClick={simulateScan} variant="gradient" size="lg" className="w-full gap-2">
          <QrCode className="w-5 h-5" />
          Simular Leitura
        </Button>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          Em produção, conectado ao leitor físico de QR Code
        </p>
      </div>

      {/* History */}
      <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h2 className="text-xl font-display font-semibold text-foreground mb-6">
          Últimas Leituras
        </h2>

        <div className="space-y-3">
          {history.map((item) => {
            const statusConfig = resultConfig[item.resultado];
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
              >
                <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                  <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.nome}</p>
                  <p className="text-sm text-muted-foreground">{item.cargo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{item.horario}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.status === 'entrada' ? 'Entrada' : 'Saída'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
