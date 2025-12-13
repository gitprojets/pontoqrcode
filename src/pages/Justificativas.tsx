import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Upload,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Justificativa {
  id: string;
  tipo: 'medico' | 'oficial' | 'treinamento' | 'outro';
  dataInicio: string;
  dataFim: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  descricao: string;
  anexo?: string;
}

const mockJustificativas: Justificativa[] = [
  {
    id: '1',
    tipo: 'medico',
    dataInicio: '2024-12-01',
    dataFim: '2024-12-01',
    status: 'aprovado',
    descricao: 'Consulta médica de rotina',
    anexo: 'atestado_001.pdf',
  },
  {
    id: '2',
    tipo: 'treinamento',
    dataInicio: '2024-11-28',
    dataFim: '2024-11-29',
    status: 'aprovado',
    descricao: 'Capacitação em metodologias ativas',
  },
  {
    id: '3',
    tipo: 'medico',
    dataInicio: '2024-12-05',
    dataFim: '2024-12-05',
    status: 'pendente',
    descricao: 'Exame laboratorial',
    anexo: 'atestado_002.pdf',
  },
];

const tipoLabels = {
  medico: 'Atestado Médico',
  oficial: 'Compromisso Oficial',
  treinamento: 'Treinamento',
  outro: 'Outro',
};

const statusConfig = {
  pendente: {
    icon: Clock,
    label: 'Pendente',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  aprovado: {
    icon: CheckCircle,
    label: 'Aprovado',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  rejeitado: {
    icon: XCircle,
    label: 'Rejeitado',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
};

export default function Justificativas() {
  const [showForm, setShowForm] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Justificativa enviada com sucesso!');
    setShowForm(false);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Justificativas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus atestados e justificativas de ausência
            </p>
          </div>
          
          <Button variant="gradient" className="gap-2" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            Nova Justificativa
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card-elevated p-6 animate-slide-up">
            <h2 className="text-lg font-display font-semibold text-foreground mb-6">
              Enviar Justificativa
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tipo</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground">
                    <option value="medico">Atestado Médico</option>
                    <option value="oficial">Compromisso Oficial</option>
                    <option value="treinamento">Treinamento</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Anexo</label>
                  <div className="flex gap-2">
                    <Input type="file" accept=".pdf,.jpg,.png" className="flex-1" />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data Início</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data Fim</label>
                  <Input type="date" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-foreground resize-none"
                  placeholder="Descreva o motivo da ausência..."
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="gradient">
                  Enviar Justificativa
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="card-elevated p-6 animate-slide-up">
          <h2 className="text-lg font-display font-semibold text-foreground mb-6">
            Minhas Justificativas
          </h2>
          
          <div className="space-y-4">
            {mockJustificativas.map((item) => {
              const config = statusConfig[item.status];
              const StatusIcon = config.icon;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                >
                  <div className={cn('p-3 rounded-lg', config.bg)}>
                    <FileText className={cn('w-5 h-5', config.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        {tipoLabels[item.tipo]}
                      </p>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        config.bg,
                        config.color
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.descricao}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(item.dataInicio)}</span>
                      {item.dataInicio !== item.dataFim && (
                        <span>- {formatDate(item.dataFim)}</span>
                      )}
                    </div>
                    {item.anexo && (
                      <p className="text-xs text-primary mt-1">{item.anexo}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
