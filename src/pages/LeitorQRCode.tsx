import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { QRCodeScanner } from '@/components/qrcode/QRCodeScanner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Trash2,
  RefreshCw,
  Clock,
  User,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface RegistroHoje {
  id: string;
  professor_id: string;
  hora_entrada: string | null;
  hora_saida: string | null;
  status: string;
  professor: {
    nome: string;
    matricula: string | null;
  };
}

export default function LeitorQRCode() {
  const { profile } = useAuth();
  const [registrosHoje, setRegistrosHoje] = useState<RegistroHoje[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRegistrosHoje = async () => {
    try {
      setIsLoading(true);
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      let query = supabase
        .from('registros_frequencia')
        .select(`
          id,
          professor_id,
          hora_entrada,
          hora_saida,
          status,
          professor:profiles!registros_frequencia_professor_id_fkey(nome, matricula)
        `)
        .eq('data_registro', hoje)
        .order('hora_entrada', { ascending: false });

      // Filter by unit for directors
      const unidadeId = profile?.unidade_id;
      if (unidadeId) {
        query = query.eq('unidade_id', unidadeId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setRegistrosHoje((data || []) as RegistroHoje[]);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrosHoje();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRegistrosHoje, 30000);
    return () => clearInterval(interval);
  }, [profile?.unidade_id]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('registros_frequencia')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      toast.success('Registro excluído com sucesso!');
      await fetchRegistrosHoje();
      setDeleteId(null);
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast.error('Erro ao excluir registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSaida = async () => {
    if (!resetId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('registros_frequencia')
        .update({ hora_saida: null })
        .eq('id', resetId);

      if (error) throw error;
      
      toast.success('Saída resetada! O professor pode registrar novamente.');
      await fetchRegistrosHoje();
      setResetId(null);
    } catch (error) {
      console.error('Erro ao resetar saída:', error);
      toast.error('Erro ao resetar saída');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = {
    presente: { label: 'Presente', color: 'bg-success/10 text-success' },
    atrasado: { label: 'Atrasado', color: 'bg-warning/10 text-warning' },
    ausente: { label: 'Ausente', color: 'bg-destructive/10 text-destructive' },
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Leitura de Presença
          </h1>
          <p className="text-muted-foreground mt-1">
            Escaneie o QR Code dos professores para registrar frequência
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Scanner */}
          <QRCodeScanner />

          {/* Today's Readings */}
          <div className="card-elevated p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Registros de Hoje
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRegistrosHoje}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                Atualizar
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : registrosHoje.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum registro de presença hoje
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {registrosHoje.map((registro) => {
                  const config = statusConfig[registro.status as keyof typeof statusConfig] || statusConfig.presente;
                  
                  return (
                    <div
                      key={registro.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {registro.professor?.nome || 'Professor'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Mat: {registro.professor?.matricula || '-'}</span>
                            <span className={cn('px-2 py-0.5 rounded-full', config.color)}>
                              {config.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="font-medium">{registro.hora_entrada || '--:--'}</span>
                          </div>
                          {registro.hora_saida ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{registro.hora_saida}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem saída</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {registro.hora_saida && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setResetId(registro.id)}
                              title="Resetar saída"
                              className="h-8 w-8 text-warning hover:text-warning hover:bg-warning/10"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(registro.id)}
                            title="Excluir registro"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-xs text-warning">
                  <strong>Atenção:</strong> Use as opções de excluir ou resetar apenas em caso de erro na leitura. 
                  Todas as alterações são registradas no sistema.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro de Presença</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de presença? 
              O professor precisará escanear o QR Code novamente para registrar sua frequência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Dialog */}
      <Dialog open={!!resetId} onOpenChange={() => setResetId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Horário de Saída</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Isso irá remover apenas o horário de saída do registro. 
            O professor poderá escanear novamente para registrar a saída correta.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleResetSaida} className="gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Resetar Saída
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
