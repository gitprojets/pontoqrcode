import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Key,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogAuditoria {
  id: string;
  usuario: string;
  acao: string;
  recurso: string;
  data: string;
  ip: string;
  status: 'sucesso' | 'falha';
}

const mockLogs: LogAuditoria[] = [
  {
    id: '1',
    usuario: 'ana.ferreira@escola.edu.br',
    acao: 'Alteração de configuração',
    recurso: 'Políticas de senha',
    data: '2024-12-06 09:15',
    ip: '192.168.1.100',
    status: 'sucesso',
  },
  {
    id: '2',
    usuario: 'joao.oliveira@escola.edu.br',
    acao: 'Login',
    recurso: 'Sistema',
    data: '2024-12-06 08:30',
    ip: '192.168.1.50',
    status: 'sucesso',
  },
  {
    id: '3',
    usuario: 'usuario.teste@escola.edu.br',
    acao: 'Tentativa de login',
    recurso: 'Sistema',
    data: '2024-12-06 08:15',
    ip: '45.67.89.123',
    status: 'falha',
  },
  {
    id: '4',
    usuario: 'maria.silva@escola.edu.br',
    acao: 'Exportação de dados',
    recurso: 'Relatório de presenças',
    data: '2024-12-05 17:45',
    ip: '192.168.1.75',
    status: 'sucesso',
  },
];

export default function Seguranca() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Segurança
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure políticas de segurança e visualize logs de auditoria
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Protegido</p>
              <p className="text-sm text-muted-foreground">Status do sistema</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-sm text-muted-foreground">Sessões ativas</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-sm text-muted-foreground">Tentativas bloqueadas</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">30 min</p>
              <p className="text-sm text-muted-foreground">Timeout de sessão</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Security Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-elevated p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Políticas de Autenticação
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Autenticação em dois fatores (MFA)</p>
                    <p className="text-sm text-muted-foreground">Exigir verificação adicional no login</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Bloqueio após tentativas falhas</p>
                    <p className="text-sm text-muted-foreground">Bloquear conta após 5 tentativas incorretas</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Expiração de senha</p>
                    <p className="text-sm text-muted-foreground">Forçar troca de senha a cada 90 dias</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Senha forte obrigatória</p>
                    <p className="text-sm text-muted-foreground">Mínimo 8 caracteres, letras, números e símbolos</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="card-elevated p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-secondary" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    Logs de Auditoria
                  </h2>
                </div>
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </div>
              
              <div className="space-y-3">
                {mockLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      log.status === 'sucesso' ? 'bg-success/10' : 'bg-destructive/10'
                    )}>
                      {log.status === 'sucesso' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{log.acao}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {log.usuario} • {log.recurso}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-foreground">{log.data}</p>
                      <p className="text-muted-foreground">{log.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-elevated p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Eye className="w-5 h-5 text-warning" />
                </div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Sessões Ativas
                </h2>
              </div>
              
              <div className="space-y-3">
                {[
                  { usuario: 'ana.ferreira', dispositivo: 'Chrome / Windows', hora: '09:00' },
                  { usuario: 'joao.oliveira', dispositivo: 'Safari / macOS', hora: '08:30' },
                  { usuario: 'maria.silva', dispositivo: 'Firefox / Windows', hora: '07:45' },
                ].map((sessao, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{sessao.usuario}</p>
                      <p className="text-xs text-muted-foreground">{sessao.dispositivo}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{sessao.hora}</span>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                Encerrar todas as sessões
              </Button>
            </div>

            <div className="card-elevated p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  IPs Bloqueados
                </h2>
              </div>
              
              <div className="space-y-2">
                {['45.67.89.123', '123.45.67.89', '98.76.54.32'].map((ip, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-destructive/5 rounded text-sm">
                    <span className="text-foreground font-mono">{ip}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
