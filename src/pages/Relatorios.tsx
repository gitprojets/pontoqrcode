import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToPDF, exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidades } from '@/hooks/useUnidades';
import { useMonthlyReport } from '@/hooks/useMonthlyReport';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Relatorio {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'presenca' | 'atraso' | 'justificativa' | 'geral' | 'mensal';
}

const relatoriosDisponiveis: Relatorio[] = [
  {
    id: 'mensal',
    titulo: 'Relatório Mensal Completo',
    descricao: 'Resumo consolidado de frequência por funcionário',
    tipo: 'mensal',
  },
  {
    id: '1',
    titulo: 'Relatório de Presenças',
    descricao: 'Relatório detalhado de presenças por período',
    tipo: 'presenca',
  },
  {
    id: '2',
    titulo: 'Relatório de Atrasos',
    descricao: 'Análise de atrasos por funcionário',
    tipo: 'atraso',
  },
  {
    id: '3',
    titulo: 'Relatório de Justificativas',
    descricao: 'Atestados e justificativas por período',
    tipo: 'justificativa',
  },
  {
    id: '4',
    titulo: 'Relatório Geral',
    descricao: 'Visão consolidada de todas as métricas',
    tipo: 'geral',
  },
];

const tipoIcons = {
  presenca: Users,
  atraso: Clock,
  justificativa: FileText,
  geral: TrendingUp,
  mensal: FileSpreadsheet,
};

const tipoColors = {
  presenca: 'bg-success/10 text-success',
  atraso: 'bg-warning/10 text-warning',
  justificativa: 'bg-primary/10 text-primary',
  geral: 'bg-secondary/10 text-secondary-foreground',
  mensal: 'bg-accent text-accent-foreground',
};

interface Stats {
  taxaPresenca: string;
  taxaAtraso: string;
  justificativas: number;
  diasLetivos: number;
}

export default function Relatorios() {
  const { profile, role } = useAuth();
  const { unidades } = useUnidades();
  const { isGenerating, generateMonthlyReport } = useMonthlyReport();
  
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stats, setStats] = useState<Stats>({
    taxaPresenca: '0',
    taxaAtraso: '0',
    justificativas: 0,
    diasLetivos: 0,
  });
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedUnidade, setSelectedUnidade] = useState<string>('all');

  // Diretores, Coordenadores e Secretários só podem ver relatórios da sua unidade
  const canSelectUnidade = role === 'desenvolvedor';
  const isUnitRestricted = role === 'diretor' || role === 'coordenador' || role === 'secretario' || role === 'administrador';

  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const unidadeId = canSelectUnidade && selectedUnidade !== 'all' 
        ? selectedUnidade 
        : profile?.unidade_id;
      const dataInicio = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const dataFim = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(endOfMonth(new Date()), 'yyyy-MM-dd');

      let query = supabase
        .from('registros_frequencia')
        .select('status')
        .gte('data_registro', dataInicio)
        .lte('data_registro', dataFim);

      if (unidadeId && role === 'diretor') {
        query = query.eq('unidade_id', unidadeId);
      } else if (canSelectUnidade && selectedUnidade !== 'all') {
        query = query.eq('unidade_id', selectedUnidade);
      }

      const { data: registros } = await query;

      const total = registros?.length || 1;
      const presentes = registros?.filter(r => r.status === 'presente' || r.status === 'atrasado').length || 0;
      const atrasados = registros?.filter(r => r.status === 'atrasado').length || 0;
      const justificados = registros?.filter(r => r.status === 'justificado').length || 0;

      // Calculate school days
      const now = new Date();
      const diasNoMes = now.getDate();
      const diasLetivos = Math.round(diasNoMes * 5 / 7);

      setStats({
        taxaPresenca: ((presentes / total) * 100).toFixed(1),
        taxaAtraso: ((atrasados / total) * 100).toFixed(1),
        justificativas: justificados,
        diasLetivos,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [profile, role, dateRange, selectedUnidade, canSelectUnidade]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleMonthlyExport = async () => {
    const unidadeId = canSelectUnidade && selectedUnidade !== 'all' 
      ? selectedUnidade 
      : profile?.unidade_id;
    const unidadeNome = canSelectUnidade && selectedUnidade !== 'all'
      ? unidades.find(u => u.id === selectedUnidade)?.nome
      : undefined;
    
    await generateMonthlyReport(selectedMonth, unidadeId, unidadeNome);
  };

  const handleExport = async (relatorio: Relatorio, format_type: 'pdf' | 'csv' = 'pdf') => {
    if (relatorio.tipo === 'mensal') {
      await handleMonthlyExport();
      return;
    }

    setExportingId(relatorio.id);
    
    try {
      const unidadeId = canSelectUnidade && selectedUnidade !== 'all' 
        ? selectedUnidade 
        : profile?.unidade_id;
      const dataInicio = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const dataFim = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(endOfMonth(new Date()), 'yyyy-MM-dd');

      let data: any[] = [];
      let columns: any[] = [];

      if (relatorio.tipo === 'presenca' || relatorio.tipo === 'atraso') {
        let query = supabase
          .from('registros_frequencia')
          .select(`
            data_registro,
            hora_entrada,
            hora_saida,
            status,
            professor:profiles!professor_id(nome, matricula)
          `)
          .gte('data_registro', dataInicio)
          .lte('data_registro', dataFim)
          .order('data_registro', { ascending: false })
          .limit(1000);

        if (unidadeId && role === 'diretor') {
          query = query.eq('unidade_id', unidadeId);
        } else if (canSelectUnidade && selectedUnidade !== 'all') {
          query = query.eq('unidade_id', selectedUnidade);
        }

        if (relatorio.tipo === 'atraso') {
          query = query.eq('status', 'atrasado');
        }

        const { data: registros } = await query;

        data = (registros || []).map(r => ({
          nome: Array.isArray(r.professor) ? r.professor[0]?.nome : r.professor?.nome,
          matricula: Array.isArray(r.professor) ? r.professor[0]?.matricula : r.professor?.matricula || '-',
          data: new Date(r.data_registro + 'T00:00:00').toLocaleDateString('pt-BR'),
          entrada: r.hora_entrada || '-',
          saida: r.hora_saida || '-',
          status: r.status === 'presente' ? 'Presente' : r.status === 'atrasado' ? 'Atrasado' : r.status,
        }));

        columns = [
          { header: 'Nome', key: 'nome', width: 50 },
          { header: 'Matrícula', key: 'matricula', width: 25 },
          { header: 'Data', key: 'data', width: 25 },
          { header: 'Entrada', key: 'entrada', width: 20 },
          { header: 'Saída', key: 'saida', width: 20 },
          { header: 'Status', key: 'status', width: 25 },
        ];
      } else if (relatorio.tipo === 'geral') {
        data = [
          { metrica: 'Taxa de Presença', valor: `${stats.taxaPresenca}%` },
          { metrica: 'Taxa de Atraso', valor: `${stats.taxaAtraso}%` },
          { metrica: 'Justificativas no Período', valor: String(stats.justificativas) },
          { metrica: 'Dias Letivos', valor: String(stats.diasLetivos) },
        ];

        columns = [
          { header: 'Métrica', key: 'metrica', width: 80 },
          { header: 'Valor', key: 'valor', width: 40 },
        ];
      } else {
        // Justificativas
        let query = supabase
          .from('registros_frequencia')
          .select(`
            data_registro,
            status,
            observacao,
            professor:profiles!professor_id(nome)
          `)
          .eq('status', 'justificado')
          .gte('data_registro', dataInicio)
          .lte('data_registro', dataFim)
          .limit(1000);

        if (unidadeId && role === 'diretor') {
          query = query.eq('unidade_id', unidadeId);
        } else if (canSelectUnidade && selectedUnidade !== 'all') {
          query = query.eq('unidade_id', selectedUnidade);
        }

        const { data: justificativas } = await query;

        data = (justificativas || []).map(j => ({
          nome: Array.isArray(j.professor) ? j.professor[0]?.nome : j.professor?.nome,
          data: new Date(j.data_registro + 'T00:00:00').toLocaleDateString('pt-BR'),
          observacao: j.observacao || 'Sem observação',
        }));

        columns = [
          { header: 'Nome', key: 'nome', width: 60 },
          { header: 'Data', key: 'data', width: 30 },
          { header: 'Observação', key: 'observacao', width: 80 },
        ];
      }

      const dateSubtitle = dateRange.from && dateRange.to 
        ? `Período: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
        : undefined;

      if (format_type === 'csv') {
        exportToCSV({
          columns,
          data,
          filename: `${relatorio.tipo}_${new Date().toISOString().split('T')[0]}`,
        });
      } else {
        exportToPDF({
          title: relatorio.titulo,
          subtitle: dateSubtitle,
          columns,
          data,
          filename: `${relatorio.tipo}_${new Date().toISOString().split('T')[0]}`,
          orientation: relatorio.tipo === 'presenca' || relatorio.tipo === 'atraso' ? 'landscape' : 'portrait',
        });
      }

      toast.success(`${relatorio.titulo} exportado com sucesso!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-1">
              Gere e exporte relatórios do sistema
            </p>
          </div>
          
          {canSelectUnidade && (
            <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Unidades</SelectItem>
                {unidades.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              {isLoadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{stats.taxaPresenca}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de presença</p>
                </>
              )}
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              {isLoadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{stats.taxaAtraso}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de atraso</p>
                </>
              )}
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              {isLoadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{stats.justificativas}</p>
                  <p className="text-sm text-muted-foreground">Justificativas</p>
                </>
              )}
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              {isLoadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{stats.diasLetivos}</p>
                  <p className="text-sm text-muted-foreground">Dias letivos/mês</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {relatoriosDisponiveis.map((relatorio) => {
            const Icon = tipoIcons[relatorio.tipo];
            const colorClass = tipoColors[relatorio.tipo];
            const isMonthly = relatorio.tipo === 'mensal';
            
            return (
              <div
                key={relatorio.id}
                className="card-elevated p-6 animate-slide-up"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-semibold text-foreground">
                      {relatorio.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {relatorio.descricao}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  {isMonthly ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 space-y-2">
                          <p className="text-sm font-medium">Selecione o mês</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[0, 1, 2, 3, 4, 5].map(i => {
                              const month = subMonths(new Date(), i);
                              return (
                                <Button
                                  key={i}
                                  variant={format(month, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM') ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setSelectedMonth(month)}
                                >
                                  {format(month, 'MMM', { locale: ptBR })}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 gap-2">
                          <Calendar className="w-4 h-4" />
                          {dateRange.from && dateRange.to 
                            ? `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`
                            : 'Período'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="range"
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          locale={ptBR}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <Button 
                    variant="gradient" 
                    className="flex-1 gap-2"
                    onClick={() => handleExport(relatorio)}
                    disabled={exportingId === relatorio.id || (isMonthly && isGenerating)}
                  >
                    {exportingId === relatorio.id || (isMonthly && isGenerating) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    PDF
                  </Button>
                  {!isMonthly && (
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handleExport(relatorio, 'csv')}
                      disabled={exportingId === relatorio.id}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
