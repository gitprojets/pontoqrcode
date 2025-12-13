import { CheckCircle, Clock, XCircle, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { exportToPDF, exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
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
  status: 'presente' | 'atraso' | 'falta' | 'justificado';
  observacao?: string;
}

const mockHistory: AttendanceRecord[] = [
  { id: '1', data: '2024-12-02', entrada: '07:28', saida: '12:05', status: 'presente' },
  { id: '2', data: '2024-12-01', entrada: '07:45', saida: '12:00', status: 'atraso', observacao: '15 min de atraso' },
  { id: '3', data: '2024-11-29', entrada: '07:30', saida: '12:00', status: 'presente' },
  { id: '4', data: '2024-11-28', entrada: null, saida: null, status: 'justificado', observacao: 'Atestado médico' },
  { id: '5', data: '2024-11-27', entrada: '07:32', saida: '12:02', status: 'presente' },
  { id: '6', data: '2024-11-26', entrada: null, saida: null, status: 'falta' },
];

const statusConfig = {
  presente: {
    icon: CheckCircle,
    label: 'Presente',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  atraso: {
    icon: Clock,
    label: 'Atraso',
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
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const handleExportPDF = () => {
    const dataToExport = mockHistory.map(record => ({
      data: formatDate(record.data),
      entrada: record.entrada || '—',
      saida: record.saida || '—',
      status: statusConfig[record.status].label,
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
    const dataToExport = mockHistory.map(record => ({
      data: formatDate(record.data),
      entrada: record.entrada || '',
      saida: record.saida || '',
      status: statusConfig[record.status].label,
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

  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-semibold text-foreground">
          Histórico de Presença
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
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
            {mockHistory.map((record) => {
              const config = statusConfig[record.status];
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
    </div>
  );
}
