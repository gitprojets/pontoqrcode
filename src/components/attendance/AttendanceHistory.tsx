import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, FileText, Download, Loader2, Calendar } from 'lucide-react';
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

export function AttendanceHistory() {
  const { user, role } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        let query = supabase
          .from('registros_frequencia')
          .select('id, data_registro, hora_entrada, hora_saida, status, observacao')
          .order('data_registro', { ascending: false })
          .limit(50);

        // Professores só veem seus próprios registros
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
  }, [user, role]);

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

    exportToPDF({
      title: 'Histórico de Presença',
      columns: [
        { header: 'Data', key: 'data', width: 35 },
        { header: 'Entrada', key: 'entrada', width: 25 },
        { header: 'Saída', key: 'saida', width: 25 },
        { header: 'Status', key: 'status', width: 30 },
        { header: 'Observação', key: 'observacao', width: 50 },
      ],
      data: dataToExport,
      filename: `historico_presenca_${new Date().toISOString().split('T')[0]}`,
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
      filename: `historico_presenca_${new Date().toISOString().split('T')[0]}`,
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
      <div className="flex items-center justify-between mb-6">
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

      {history.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhum registro de presença encontrado
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Seus registros aparecerão aqui quando você registrar presença
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}