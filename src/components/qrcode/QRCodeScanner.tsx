import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, CheckCircle, XCircle, AlertTriangle, User, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ScanResult {
  status: 'idle' | 'success' | 'error' | 'warning' | 'processing';
  message: string;
  professor?: {
    id: string;
    nome: string;
    matricula: string | null;
    foto?: string | null;
  };
}

interface ScanHistory {
  id: string;
  nome: string;
  matricula: string | null;
  hora: string;
  status: 'entrada' | 'saida' | 'atrasado';
  timestamp: Date;
}

export function QRCodeScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>({ status: 'idle', message: '' });
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // Refs for synchronous checks to prevent race conditions
  const processingRef = useRef(false);
  const lastProcessedTokenRef = useRef<string | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const processQRCode = useCallback(async (decodedText: string) => {
    // Synchronous check using ref to prevent race conditions
    if (processingRef.current) return;
    
    // Prevent processing the same token twice (debounce duplicate scans)
    if (lastProcessedTokenRef.current === decodedText) return;
    
    // Set refs synchronously BEFORE any async operation
    processingRef.current = true;
    lastProcessedTokenRef.current = decodedText;
    
    setIsProcessing(true);
    setScanResult({ status: 'processing', message: 'Validando token JWT...' });

    try {
      // First, try JWT validation via edge function
      const { data, error: fnError } = await supabase.functions.invoke('validate-qr-token', {
        body: { token: decodedText }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.valid === false) {
        setScanResult({
          status: 'error',
          message: data?.error || 'Token inválido',
        });
        return;
      }

      if (data?.valid && data?.professor) {
        await processValidatedProfessor(data.professor);
        return;
      }

      // Fallback: try legacy base64 decode
      throw new Error('Invalid JWT response');

    } catch (error: unknown) {
      console.error('JWT validation failed, trying legacy format:', error);
      
      // Try legacy format (base64 encoded JSON)
      try {
        const payload = JSON.parse(atob(decodedText));
        await processLegacyPayload(payload);
      } catch (legacyError) {
        console.error('Legacy parsing also failed:', legacyError);
        setScanResult({
          status: 'error',
          message: 'QR Code inválido ou corrompido',
        });
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      
      // Clear the last processed token after a cooldown period (3 seconds)
      // This prevents the same QR code from being scanned again too quickly
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
      cooldownRef.current = setTimeout(() => {
        lastProcessedTokenRef.current = null;
      }, 3000);
    }
  }, [profile]);

  const processValidatedProfessor = useCallback(async (professor: { id: string; nome: string; matricula: string | null; unidade_id: string | null }) => {
    const directorUnitId = profile?.unidade_id;
    
    if (!directorUnitId) {
      setScanResult({
        status: 'error',
        message: 'Você não está vinculado a nenhuma unidade.',
      });
      return;
    }

    // Check if professor belongs to same unit
    if (professor.unidade_id !== directorUnitId) {
      setScanResult({
        status: 'warning',
        message: 'Este professor não pertence à sua unidade.',
        professor: { id: professor.id, nome: professor.nome, matricula: professor.matricula },
      });
      return;
    }

    await recordAttendance(professor);
  }, [profile]);

  const processLegacyPayload = useCallback(async (payload: { id: string; m: string; t: number; n: string; e: number }) => {
    // Validate expiration
    if (Date.now() > payload.e) {
      setScanResult({
        status: 'error',
        message: 'QR Code expirado. Peça ao professor para gerar um novo.',
      });
      return;
    }

    // Validate timestamp (not too old)
    if (Date.now() - payload.t > 120000) {
      setScanResult({
        status: 'error',
        message: 'QR Code muito antigo.',
      });
      return;
    }

    // Fetch professor data
    const { data: professor, error: profError } = await supabase
      .from('profiles')
      .select('id, nome, matricula, foto, unidade_id')
      .eq('id', payload.id)
      .maybeSingle();

    if (profError || !professor) {
      setScanResult({
        status: 'error',
        message: 'Professor não encontrado no sistema.',
      });
      return;
    }

    const directorUnitId = profile?.unidade_id;
    
    if (!directorUnitId) {
      setScanResult({
        status: 'error',
        message: 'Você não está vinculado a nenhuma unidade.',
      });
      return;
    }

    if (professor.unidade_id !== directorUnitId) {
      setScanResult({
        status: 'warning',
        message: 'Este professor não pertence à sua unidade.',
        professor,
      });
      return;
    }

    await recordAttendance(professor);
  }, [profile]);

  const recordAttendance = useCallback(async (professor: { id: string; nome: string; matricula: string | null; foto?: string | null; unidade_id?: string | null }) => {
    const directorUnitId = profile?.unidade_id;
    const hoje = new Date().toISOString().split('T')[0];
    const agora = new Date().toTimeString().split(' ')[0].substring(0, 5);
    const diaSemana = new Date().getDay();

    // Find week start (Sunday)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const semanaInicio = weekStart.toISOString().split('T')[0];

    const { data: escala } = await supabase
      .from('escalas_trabalho')
      .select('hora_entrada, is_folga')
      .eq('professor_id', professor.id)
      .eq('semana_inicio', semanaInicio)
      .eq('dia_semana', diaSemana)
      .maybeSingle();

    // Check if it's a day off
    if (escala?.is_folga) {
      setScanResult({
        status: 'warning',
        message: `${professor.nome} está de folga hoje.`,
        professor,
      });
      return;
    }

    // Check for existing record today
    const { data: existing } = await supabase
      .from('registros_frequencia')
      .select('id, hora_entrada, hora_saida')
      .eq('professor_id', professor.id)
      .eq('data_registro', hoje)
      .maybeSingle();

    let status: 'entrada' | 'saida' | 'atrasado' = 'entrada';
    let registroStatus: 'presente' | 'atrasado' = 'presente';

    // Check if late
    if (escala?.hora_entrada && agora > escala.hora_entrada) {
      status = 'atrasado';
      registroStatus = 'atrasado';
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (existing) {
      if (!existing.hora_saida) {
        // Register exit
        const { error } = await supabase
          .from('registros_frequencia')
          .update({ 
            hora_saida: agora,
            lido_por: user?.id 
          })
          .eq('id', existing.id);

        if (error) throw error;
        status = 'saida';
      } else {
        setScanResult({
          status: 'warning',
          message: `${professor.nome} já tem entrada e saída registradas hoje.`,
          professor,
        });
        return;
      }
    } else {
      // Create entry
      const { error } = await supabase
        .from('registros_frequencia')
        .insert({
          professor_id: professor.id,
          unidade_id: directorUnitId,
          data_registro: hoje,
          hora_entrada: agora,
          status: registroStatus,
          lido_por: user?.id,
        });

      if (error) throw error;
    }

    // Add to history
    setHistory(prev => [{
      id: professor.id,
      nome: professor.nome,
      matricula: professor.matricula,
      hora: agora,
      status,
      timestamp: new Date(),
    }, ...prev.slice(0, 9)]);

    setScanResult({
      status: 'success',
      message: status === 'saida' 
        ? `Saída de ${professor.nome} registrada às ${agora}`
        : status === 'atrasado'
          ? `Entrada com atraso de ${professor.nome} às ${agora}`
          : `Entrada de ${professor.nome} registrada às ${agora}`,
      professor,
    });

    toast({
      title: status === 'saida' ? 'Saída registrada' : status === 'atrasado' ? 'Entrada com atraso' : 'Entrada registrada',
      description: `${professor.nome} - ${agora}`,
      variant: status === 'atrasado' ? 'destructive' : 'default',
    });
  }, [profile, toast]);

  const startScanner = useCallback(async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processQRCode(decodedText);
        },
        () => {} // Ignore errors during scanning
      );

      setIsScanning(true);
      setScanResult({ status: 'idle', message: '' });
    } catch (error: unknown) {
      console.error('Scanner error:', error);
      toast({
        title: 'Erro ao iniciar câmera',
        description: 'Verifique as permissões de câmera do navegador.',
        variant: 'destructive',
      });
    }
  }, [processQRCode, toast]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
      // Clear cooldown timer on unmount
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
    };
  }, []);

  const resultConfig = {
    idle: {
      icon: Camera,
      bg: 'bg-muted',
      text: 'Aguardando leitura...',
      textColor: 'text-muted-foreground',
    },
    processing: {
      icon: Loader2,
      bg: 'bg-primary/10',
      text: scanResult.message,
      textColor: 'text-primary',
      animate: true,
    },
    success: {
      icon: CheckCircle,
      bg: 'bg-success/10',
      text: scanResult.message,
      textColor: 'text-success',
    },
    error: {
      icon: XCircle,
      bg: 'bg-destructive/10',
      text: scanResult.message,
      textColor: 'text-destructive',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-warning/10',
      text: scanResult.message,
      textColor: 'text-warning',
    },
  };

  const config = resultConfig[scanResult.status];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Scanner */}
      <div className="card-elevated p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-semibold text-foreground">
              Leitor de QR Code
            </h2>
          </div>
          <Button
            onClick={isScanning ? stopScanner : startScanner}
            variant={isScanning ? 'destructive' : 'gradient'}
            className="gap-2"
            disabled={isProcessing}
          >
            {isScanning ? (
              <>
                <CameraOff className="w-4 h-4" />
                Parar Leitura
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Iniciar Leitura
              </>
            )}
          </Button>
        </div>

        {/* Camera View */}
        <div className="relative aspect-square max-w-md mx-auto bg-black rounded-xl overflow-hidden">
          <div id="qr-reader" className="w-full h-full" />
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Clique em "Iniciar Leitura" para<br />ativar a câmera
              </p>
            </div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3 text-primary" />
          <span>Validação JWT com proteção anti-replay server-side</span>
        </div>

        {/* Result */}
        <div className={`mt-4 p-4 rounded-xl ${config.bg} transition-all`}>
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${config.textColor} ${'animate' in config && config.animate ? 'animate-spin' : ''}`} />
            <div className="flex-1">
              <p className={`font-medium ${config.textColor}`}>
                {config.text}
              </p>
              {scanResult.professor && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {scanResult.professor.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Matrícula: {scanResult.professor.matricula || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card-elevated p-6 animate-slide-up">
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">
          Leituras Recentes
        </h3>
        
        {history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma leitura realizada ainda
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((item, i) => (
              <div
                key={`${item.id}-${item.timestamp.getTime()}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'saida' 
                      ? 'bg-primary' 
                      : item.status === 'atrasado' 
                        ? 'bg-warning' 
                        : 'bg-success'
                  }`} />
                  <div>
                    <p className="font-medium text-foreground">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.matricula || 'Sem matrícula'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'saida'
                      ? 'bg-primary/10 text-primary'
                      : item.status === 'atrasado'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-success/10 text-success'
                  }`}>
                    {item.status === 'saida' ? 'Saída' : item.status === 'atrasado' ? 'Atrasado' : 'Entrada'}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">{item.hora}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
