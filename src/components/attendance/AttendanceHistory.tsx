import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Clock, XCircle, FileText, Download, Loader2, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { exportToPDF, exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AttendanceRecord {
  id: string;
  data: string;
  entrada: string | null;
  saida: string | null;
  status: 'presente' | 'atrasado' | 'falta' | 'justificado';
  observacao?: string;
}

const statusConfig = {
  presente: {
    icon: CheckCircle,
    label: 'Presente',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  atrasado: {
    icon: Clock,
    label: 'Atrasado',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  falta: {
    icon: XCircle,
    label: 'Falta',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  justificado: {
    icon: FileText,
    label: 'Justificado',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
};

const ITEMS_PER_PAGE = 10;

const months = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

export function AttendanceHistory() {
  const { user, role } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filtros de data
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentDate.getFullYear().toString());

  // Gerar lista de anos (últimos 5 anos)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString(),
    }));
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Calcular intervalo de datas baseado no mês/ano selecionado
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // Último dia do mês
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Primeiro, buscar contagem total para paginação
        let countQuery = supabase
          .from('registros_frequencia')
          .select('id', { count: 'exact', head: true })
          .gte('data_registro', startDateStr)
          .lte('data_registro', endDateStr);

        if (role === 'professor' || role === 'outro') {
          countQuery = countQuery.eq('professor_id', user.id);
        }

        const { count } = await countQuery;
        setTotalCount(count || 0);

        // Buscar dados paginados
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
          .from('registros_frequencia')
          .select('id, data_registro, hora_entrada, hora_saida, status, observacao')
          .gte('data_registro', startDateStr)
          .lte('data_registro', endDateStr)
          .order('data_registro', { ascending: false })
          .range(from, to);

        if (role === 'professor' || role === 'outro') {
          query = query.eq('professor_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        const formattedData: AttendanceRecord[] = (data || []).map((record) => ({
          id: record.id,
          data: record.data_registro,
          entrada: record.hora_entrada,
          saida: record.hora_saida,
          status: record.status as AttendanceRecord['status'],
          observacao: record.observacao || undefined,
        }));

        setHistory(formattedData);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        toast.error('Erro ao carregar histórico de presença');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user, role, selectedMonth, selectedYear, currentPage]);

  // Reset para página 1 quando mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const handleExportPDF = () => {
    if (history.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const dataToExport = history.map(record => ({
      data: formatDate(record.data),
      entrada: record.entrada || '—',
      saida: record.saida || '—',
      status: statusConfig[record.status]?.label || record.status,
      observacao: record.observacao || '—',
    }));

    const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';
    
    exportToPDF({
      title: `Histórico de Presença - ${monthLabel}/${selectedYear}`,
      columns: [
        { header: 'Data', key: 'data', width: 35 },
        { header: 'Entrada', key: 'entrada', width: 25 },
        { header: 'Saída', key: 'saida', width: 25 },
        { header: 'Status', key: 'status', width: 30 },
        { header: 'Observação', key: 'observacao', width: 50 },
      ],
      data: dataToExport,
      filename: `historico_presenca_${selectedMonth}_${selectedYear}`,
    });
    toast.success('PDF exportado com sucesso!');
  };

  const handleExportCSV = () => {
    if (history.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const dataToExport = history.map(record => ({
      data: formatDate(record.data),
      entrada: record.entrada || '',
      saida: record.saida || '',
      status: statusConfig[record.status]?.label || record.status,
      observacao: record.observacao || '',
    }));

    exportToCSV({
      columns: [
        { header: 'Data', key: 'data' },
        { header: 'Entrada', key: 'entrada' },
        { header: 'Saída', key: 'saida' },
        { header: 'Status', key: 'status' },
        { header: 'Observação', key: 'observacao' },
      ],
      data: dataToExport,
      filename: `historico_presenca_${selectedMonth}_${selectedYear}`,
    });
    toast.success('CSV exportado com sucesso!');
  };

  if (isLoading) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Histórico de Presença
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={history.length === 0}>
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filtros de Mês/Ano */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtrar por:</span>
          
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground ml-auto">
            {totalCount} registro{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhum registro de presença encontrado
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Entrada
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Saída
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Observação
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => {
                  const config = statusConfig[record.status] || statusConfig.presente;
                  const StatusIcon = config.icon;

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-foreground">
                          {formatDate(record.data)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-foreground">
                          {record.entrada || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-foreground">
                          {record.saida || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          config.bg,
                          config.color
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">
                          {record.observacao || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}