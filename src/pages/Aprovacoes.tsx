import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  User,
  Calendar,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Solicitacao {
  id: string;
  tipo: 'justificativa' | 'correcao';
  funcionario: string;
  cargo: string;
  data: string;
  descricao: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  anexo?: string;
}

const mockSolicitacoes: Solicitacao[] = [
  {
    id: '1',
    tipo: 'justificativa',
    funcionario: 'Maria Silva Santos',
    cargo: 'Professora',
    data: '2024-12-05',
    descricao: 'Atestado médico - Consulta de rotina',
    status: 'pendente',
    anexo: 'atestado_001.pdf',
  },
  {
    id: '2',
    tipo: 'correcao',
    funcionario: 'José Carlos Oliveira',
    cargo: 'Professor',
    data: '2024-12-04',
    descricao: 'Correção de ponto - Esqueceu de registrar saída',
    status: 'pendente',
  },
  {
    id: '3',
    tipo: 'justificativa',
    funcionario: 'Ana Paula Lima',
    cargo: 'Coordenadora',
    data: '2024-12-03',
    descricao: 'Compromisso oficial - Reunião na secretaria',
    status: 'pendente',
  },
  {
    id: '4',
    tipo: 'justificativa',
    funcionario: 'Roberto Mendes',
    cargo: 'Professor',
    data: '2024-12-02',
    descricao: 'Treinamento - Capacitação docente',
    status: 'aprovado',
    anexo: 'certificado_001.pdf',
  },
];

export default function Aprovacoes() {
  const [solicitacoes, setSolicitacoes] = useState(mockSolicitacoes);
  const pendentes = solicitacoes.filter(s => s.status === 'pendente');

  const handleAprovar = (id: string) => {
    setSolicitacoes(prev =>
      prev.map(s => s.id === id ? { ...s, status: 'aprovado' as const } : s)
    );
    toast.success('Solicitação aprovada com sucesso!');
  };

  const handleRejeitar = (id: string) => {
    setSolicitacoes(prev =>
      prev.map(s => s.id === id ? { ...s, status: 'rejeitado' as const } : s)
    );
    toast.error('Solicitação rejeitada.');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
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

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Aprovações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie solicitações de justificativas e correções
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendentes.length}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {solicitacoes.filter(s => s.status === 'aprovado').length}
              </p>
              <p className="text-sm text-muted-foreground">Aprovadas</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {solicitacoes.filter(s => s.status === 'rejeitado').length}
              </p>
              <p className="text-sm text-muted-foreground">Rejeitadas</p>
            </div>
          </div>
        </div>

        {/* Pending List */}
        {pendentes.length > 0 && (
          <div className="card-elevated p-6 animate-slide-up">
            <h2 className="text-lg font-display font-semibold text-foreground mb-6">
              Solicitações Pendentes
            </h2>
            
            <div className="space-y-4">
              {pendentes.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl"
                >
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <FileText className="w-5 h-5 text-warning" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{item.funcionario}</span>
                      <span className="text-sm text-muted-foreground">• {item.cargo}</span>
                    </div>
                    <p className="text-sm text-foreground">{item.descricao}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(item.data)}</span>
                      {item.anexo && (
                        <>
                          <span>•</span>
                          <span className="text-primary">{item.anexo}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.anexo && (
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRejeitar(item.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-success hover:text-success hover:bg-success/10"
                      onClick={() => handleAprovar(item.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Requests */}
        <div className="card-elevated p-6 animate-slide-up">
          <h2 className="text-lg font-display font-semibold text-foreground mb-6">
            Histórico de Solicitações
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Funcionário
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Descrição
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((item) => {
                  const config = statusConfig[item.status];
                  const StatusIcon = config.icon;
                  
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-foreground">{item.funcionario}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-foreground capitalize">{item.tipo}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-foreground">{formatDate(item.data)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-muted-foreground truncate block max-w-[200px]">
                          {item.descricao}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
