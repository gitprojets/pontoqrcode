import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  QrCode, 
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  AlertTriangle,
  Building,
  Calendar,
  Shield,
  Code,
  Settings,
  ClipboardList,
  FileText,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { SchoolCalendar } from '@/components/calendar/SchoolCalendar';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory';

type DemoRole = 'professor' | 'diretor' | 'administrador' | 'desenvolvedor';

const roleConfig: Record<DemoRole, { title: string; subtitle: string; color: string }> = {
  professor: {
    title: 'Demonstração - Professor',
    subtitle: 'Visualização do painel do professor',
    color: 'text-primary',
  },
  diretor: {
    title: 'Demonstração - Diretor',
    subtitle: 'Visualização do painel do diretor',
    color: 'text-secondary',
  },
  administrador: {
    title: 'Demonstração - Administrador',
    subtitle: 'Visualização do painel administrativo',
    color: 'text-warning',
  },
  desenvolvedor: {
    title: 'Demonstração - Desenvolvedor',
    subtitle: 'Visualização do painel do desenvolvedor',
    color: 'text-destructive',
  },
};

function DemoProfessor() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Presenças no Mês"
          value="18"
          subtitle="de 22 dias letivos"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Atrasos"
          value="2"
          subtitle="no mês atual"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Faltas"
          value="1"
          subtitle="justificada"
          icon={XCircle}
          variant="default"
        />
        <StatCard
          title="Taxa de Presença"
          value="95%"
          trend={{ value: 3, isPositive: true }}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      {/* Menu de funcionalidades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <QrCode className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Meu QR Code</p>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Calendar className="w-8 h-8 mx-auto text-secondary mb-2" />
          <p className="text-sm font-medium text-foreground">Calendário</p>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <ClipboardList className="w-8 h-8 mx-auto text-warning mb-2" />
          <p className="text-sm font-medium text-foreground">Histórico</p>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">Justificativas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SchoolCalendar />
        <AttendanceHistory />
      </div>
    </div>
  );
}

function DemoDiretor() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Professores Presentes"
          value="42"
          subtitle="de 45 esperados"
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Alunos Presentes"
          value="847"
          subtitle="de 920 matriculados"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Pendências"
          value="8"
          subtitle="justificativas para aprovar"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Taxa Geral"
          value="92%"
          trend={{ value: 1.5, isPositive: true }}
          icon={TrendingUp}
          variant="secondary"
        />
      </div>

      {/* Menu de funcionalidades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Users className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Funcionários</p>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <FileText className="w-8 h-8 mx-auto text-secondary mb-2" />
          <p className="text-sm font-medium text-foreground">Aprovações</p>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Calendar className="w-8 h-8 mx-auto text-warning mb-2" />
          <p className="text-sm font-medium text-foreground">Calendário</p>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">Relatórios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SchoolCalendar />
        
        <div className="card-elevated p-6">
          <h2 className="text-xl font-display font-semibold text-foreground mb-6">
            Alertas do Dia
          </h2>
          <div className="space-y-4">
            {[
              { type: 'warning', message: '3 professores com atraso superior a 15 min' },
              { type: 'info', message: '2 turmas sem professor substituto' },
              { type: 'success', message: 'Taxa de presença acima da meta' },
            ].map((alert, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  alert.type === 'warning' ? 'bg-warning/10' :
                  alert.type === 'info' ? 'bg-primary/10' : 'bg-success/10'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                  alert.type === 'warning' ? 'text-warning' :
                  alert.type === 'info' ? 'text-primary' : 'text-success'
                }`} />
                <p className="text-sm text-foreground">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoAdmin() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Unidades Ativas"
          value="12"
          subtitle="escolas conectadas"
          icon={Building}
          variant="primary"
        />
        <StatCard
          title="Total de Usuários"
          value="1.245"
          subtitle="ativos no sistema"
          icon={Users}
          variant="secondary"
        />
        <StatCard
          title="Leituras Hoje"
          value="4.832"
          subtitle="registros de presença"
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="Dispositivos Online"
          value="48"
          subtitle="de 52 instalados"
          icon={CheckCircle}
          variant="default"
        />
      </div>

      {/* Menu de funcionalidades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Building className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Unidades</p>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Users className="w-8 h-8 mx-auto text-secondary mb-2" />
          <p className="text-sm font-medium text-foreground">Usuários</p>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Smartphone className="w-8 h-8 mx-auto text-warning mb-2" />
          <p className="text-sm font-medium text-foreground">Dispositivos</p>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <Shield className="w-8 h-8 mx-auto text-destructive mb-2" />
          <p className="text-sm font-medium text-foreground">Segurança</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SchoolCalendar />
        </div>
        
        <div className="card-elevated p-6">
          <h2 className="text-xl font-display font-semibold text-foreground mb-6">
            Status por Unidade
          </h2>
          <div className="space-y-4">
            {[
              { nome: 'E.M. Dom Pedro II', taxa: 94, status: 'online' },
              { nome: 'E.M. Santos Dumont', taxa: 91, status: 'online' },
              { nome: 'E.M. Tiradentes', taxa: 88, status: 'warning' },
              { nome: 'E.M. Castro Alves', taxa: 96, status: 'online' },
            ].map((unidade, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    unidade.status === 'online' ? 'bg-success' : 'bg-warning'
                  }`} />
                  <span className="text-sm font-medium text-foreground">
                    {unidade.nome}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {unidade.taxa}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoDesenvolvedor() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Unidades Ativas"
          value="12"
          subtitle="escolas conectadas"
          icon={Building}
          variant="primary"
        />
        <StatCard
          title="Total de Usuários"
          value="1.245"
          subtitle="ativos no sistema"
          icon={Users}
          variant="secondary"
        />
        <StatCard
          title="Leituras Hoje"
          value="4.832"
          subtitle="registros de presença"
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="Dispositivos Online"
          value="48"
          subtitle="de 52 instalados"
          icon={CheckCircle}
          variant="default"
        />
      </div>

      {/* Menu de funcionalidades - Desenvolvedor tem acesso total */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-destructive/20">
          <Building className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Unidades</p>
          <span className="text-xs text-destructive">Acesso Total</span>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-destructive/20">
          <Users className="w-8 h-8 mx-auto text-secondary mb-2" />
          <p className="text-sm font-medium text-foreground">Usuários</p>
          <span className="text-xs text-destructive">Criar Admins</span>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-destructive/20">
          <Smartphone className="w-8 h-8 mx-auto text-warning mb-2" />
          <p className="text-sm font-medium text-foreground">Dispositivos</p>
          <span className="text-xs text-destructive">Acesso Total</span>
        </div>
        <div className="card-elevated p-4 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-destructive/20">
          <Shield className="w-8 h-8 mx-auto text-destructive mb-2" />
          <p className="text-sm font-medium text-foreground">Segurança</p>
          <span className="text-xs text-destructive">Acesso Total</span>
        </div>
      </div>

      <div className="card-elevated p-6 border-2 border-destructive/20">
        <div className="flex items-center gap-3 mb-6">
          <Code className="w-6 h-6 text-destructive" />
          <h2 className="text-xl font-display font-semibold text-foreground">
            Painel do Desenvolvedor
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Hierarquia de Cadastro</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-destructive" />
                Desenvolvedor → Cadastra Administradores
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-warning" />
                Administrador → Cadastra Diretores, Professores, etc.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary" />
                Diretor → Visualiza funcionários da unidade
              </li>
            </ul>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Permissões Exclusivas</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-destructive" />
                Criar/Editar Administradores
              </li>
              <li className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-destructive" />
                Configurações Avançadas do Sistema
              </li>
              <li className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-destructive" />
                Logs e Auditoria Completa
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SchoolCalendar />
        </div>
        
        <div className="card-elevated p-6">
          <h2 className="text-xl font-display font-semibold text-foreground mb-6">
            Status por Unidade
          </h2>
          <div className="space-y-4">
            {[
              { nome: 'E.M. Dom Pedro II', taxa: 94, status: 'online' },
              { nome: 'E.M. Santos Dumont', taxa: 91, status: 'online' },
              { nome: 'E.M. Tiradentes', taxa: 88, status: 'warning' },
              { nome: 'E.M. Castro Alves', taxa: 96, status: 'online' },
            ].map((unidade, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    unidade.status === 'online' ? 'bg-success' : 'bg-warning'
                  }`} />
                  <span className="text-sm font-medium text-foreground">
                    {unidade.nome}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {unidade.taxa}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoView() {
  const { role } = useParams<{ role: string }>();
  
  if (!role || !['professor', 'diretor', 'administrador', 'desenvolvedor'].includes(role)) {
    return <Navigate to="/demo" replace />;
  }

  const config = roleConfig[role as DemoRole];

  const demoComponents: Record<DemoRole, React.ReactNode> = {
    professor: <DemoProfessor />,
    diretor: <DemoDiretor />,
    administrador: <DemoAdmin />,
    desenvolvedor: <DemoDesenvolvedor />,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/demo">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className={`font-display font-bold text-lg ${config.color}`}>
                  {config.title}
                </h1>
                <span className="text-xs text-muted-foreground">{config.subtitle}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              Modo Demonstração
            </span>
            <Link to="/login">
              <Button variant="gradient" size="sm">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {demoComponents[role as DemoRole]}
      </main>
    </div>
  );
}
