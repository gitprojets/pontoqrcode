import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminUnidades } from '@/hooks/useAdminUnidades';

interface RegistroDia {
  id: string;
  professor_id: string;
  professor_nome: string;
  hora_entrada: string | null;
  hora_saida: string | null;
  status: string;
  unidade_nome: string;
}

const statusConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  presente: {
    icon: CheckCircle,
    label: 'Presente',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  atrasado: {
    icon: AlertCircle,
    label: 'Atrasado',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  ausente: {
    icon: XCircle,
    label: 'Ausente',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  justificado: {
    icon: CheckCircle,
    label: 'Justificado',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
};

export default function RegistrosDia() {
  const { profile, role } = useAuth();
  const { adminUnidades } = useAdminUnidades();
  const [registros, setRegistros] = useState<RegistroDia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnidade, setSelectedUnidade] = useState<string>('all');
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const hoje = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchUnidades();
  }, [adminUnidades, role]);

  useEffect(() => {
    fetchRegistros();
  }, [selectedUnidade, adminUnidades]);

  const fetchUnidades = async () => {
    try {
      if (role === 'administrador' && adminUnidades.length > 0) {
        const { data } = await supabase
          .from('unidades')
          .select('id, nome')
          .in('id', adminUnidades)
          .order('nome');
        setUnidades(data || []);
      }
    } catch (error) {
      console.error('Error fetching unidades:', error);
    }
  };

  const fetchRegistros = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('registros_frequencia')
        .select(`
          id,
          professor_id,
          hora_entrada,
          hora_saida,
          status,
          professor:profiles!professor_id(nome),
          unidade:unidades!unidade_id(nome)
        `)
        .eq('data_registro', hoje)
        .order('hora_entrada', { ascending: false });

      // Filter by admin's linked units
      if (role === 'administrador' && adminUnidades.length > 0) {
        if (selectedUnidade !== 'all') {
          query = query.eq('unidade_id', selectedUnidade);
        } else {
          query = query.in('unidade_id', adminUnidades);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData: RegistroDia[] = (data || []).map((r: any) => ({
        id: r.id,
        professor_id: r.professor_id,
        professor_nome: Array.isArray(r.professor) ? r.professor[0]?.nome : r.professor?.nome || 'Desconhecido',
        hora_entrada: r.hora_entrada,
        hora_saida: r.hora_saida,
        status: r.status,
        unidade_nome: Array.isArray(r.unidade) ? r.unidade[0]?.nome : r.unidade?.nome || 'Sem unidade',
      }));

      setRegistros(formattedData);
    } catch (error) {
      console.error('Error fetching registros:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: registros.length,
    presentes: registros.filter(r => r.status === 'presente').length,
    atrasados: registros.filter(r => r.status === 'atrasado').length,
    ausentes: registros.filter(r => r.status === 'ausente').length,
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Registros do Dia
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          
          <div className="flex gap-2">
            {role === 'administrador' && unidades.length > 0 && (
              <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {unidades.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" className="gap-2" onClick={fetchRegistros}>
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.presentes}</p>
              <p className="text-sm text-muted-foreground">Presentes</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.atrasados}</p>
              <p className="text-sm text-muted-foreground">Atrasados</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.ausentes}</p>
              <p className="text-sm text-muted-foreground">Ausentes</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="card-elevated p-6 animate-slide-up">
          <h2 className="text-lg font-display font-semibold text-foreground mb-6">
            Registros de Frequência
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum registro encontrado para hoje</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {registros.map((registro) => {
                  const config = statusConfig[registro.status] || statusConfig.presente;
                  const StatusIcon = config.icon;
                  
                  return (
                    <div
                      key={registro.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {registro.professor_nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{registro.professor_nome}</p>
                        <p className="text-xs text-muted-foreground">{registro.unidade_nome}</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Entrada:</span>
                          <span className="font-medium text-foreground">
                            {registro.hora_entrada || '--:--'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Saída:</span>
                          <span className="font-medium text-foreground">
                            {registro.hora_saida || '--:--'}
                          </span>
                        </div>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          config.bg,
                          config.color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </MainLayout>
  );
}