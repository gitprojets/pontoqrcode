import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { SchoolCalendar } from '@/components/calendar/SchoolCalendar';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAttendanceChart } from '@/hooks/useAttendanceChart';
import { Button } from '@/components/ui/button';
import { DashboardStatsSkeleton } from '@/components/ui/enhanced-skeleton';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Building,
  Loader2,
  RefreshCw,
} from 'lucide-react';

function ProfessorDashboard() {
  const { stats, isLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useAttendanceChart(14);

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <div className="h-8 w-40 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-60 bg-muted/50 rounded animate-pulse" />
        </div>
        <DashboardStatsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Meu Painel
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Acompanhe sua frequência e agenda
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Presenças no Mês"
          value={String(stats.presencasMes)}
          subtitle={`de ${stats.diasLetivos} dias letivos`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Atrasos"
          value={String(stats.atrasos)}
          subtitle="no mês atual"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Faltas"
          value={String(stats.faltas)}
          subtitle="no mês"
          icon={XCircle}
          variant="default"
        />
        <StatCard
          title="Taxa de Presença"
          value={`${stats.taxaPresenca}%`}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      <AttendanceChart 
        data={chartData} 
        isLoading={chartLoading}
        title="Minha Frequência - Últimos 14 dias"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <SchoolCalendar />
        <AttendanceHistory />
      </div>
    </div>
  );
}

function DiretorDashboard() {
  const { stats, isLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useAttendanceChart(14);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Painel do Diretor
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Visão geral da frequência da unidade
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Professores Presentes"
          value={String(stats.professoresPresentes)}
          subtitle={`de ${stats.professoresEsperados} esperados`}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Taxa Geral"
          value={`${stats.taxaGeral}%`}
          subtitle="presença no mês"
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Pendências"
          value={String(stats.pendencias)}
          subtitle="justificativas para aprovar"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Dias Letivos"
          value={String(stats.diasLetivos || new Date().getDate())}
          subtitle="no mês atual"
          icon={Calendar}
          variant="secondary"
        />
      </div>

      <AttendanceChart 
        data={chartData} 
        isLoading={chartLoading}
        title="Frequência da Unidade - Últimos 14 dias"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <SchoolCalendar />
        <AttendanceHistory />
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { stats, isLoading, refresh } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading, refresh: refreshChart } = useAttendanceChart(14);

  const handleRefresh = () => {
    refresh();
    refreshChart();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Visão geral de todas as unidades
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 w-full sm:w-auto">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Unidades Ativas"
          value={String(stats.unidadesAtivas)}
          subtitle="escolas online"
          icon={Building}
          variant="primary"
        />
        <StatCard
          title="Total de Usuários"
          value={stats.totalUsuarios.toLocaleString('pt-BR')}
          subtitle="ativos no sistema"
          icon={Users}
          variant="secondary"
        />
        <StatCard
          title="Leituras Hoje"
          value={stats.leiturasHoje.toLocaleString('pt-BR')}
          subtitle="registros de presença"
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="Dispositivos Online"
          value={String(stats.dispositivosOnline)}
          subtitle={`de ${stats.dispositivosTotal} instalados`}
          icon={CheckCircle}
          variant="default"
        />
      </div>

      <AttendanceChart 
        data={chartData} 
        isLoading={chartLoading}
        title="Frequência Geral - Últimos 14 dias"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <SchoolCalendar />
        <AttendanceHistory />
      </div>
    </div>
  );
}

// Coordenador/Secretario Dashboard - similar to director but limited
function CoordenadorDashboard() {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Painel de Gestão
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Acompanhe a frequência da unidade
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Professores Presentes"
          value={String(stats.professoresPresentes)}
          subtitle={`de ${stats.professoresEsperados} esperados`}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Taxa Geral"
          value={`${stats.taxaGeral}%`}
          subtitle="presença no mês"
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Dias Letivos"
          value={String(stats.diasLetivos || new Date().getDate())}
          subtitle="no mês atual"
          icon={Calendar}
          variant="secondary"
        />
        <StatCard
          title="Pendências"
          value={String(stats.pendencias)}
          subtitle="a serem tratadas"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <SchoolCalendar />
        <AttendanceHistory />
      </div>
    </div>
  );
}

// Simple dashboard for "outro" role
function SimpleDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Bem-vindo ao Sistema
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Sistema de Gestão de Frequência Escolar
        </p>
      </div>

      <div className="card-elevated p-8 text-center">
        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-display font-semibold mb-2">Acesso Limitado</h2>
        <p className="text-muted-foreground">
          Seu perfil possui acesso limitado ao sistema. Entre em contato com o administrador 
          para solicitar mais permissões ou acesse o suporte se precisar de ajuda.
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { role, isLoading } = useAuth();

  if (isLoading || !role) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const getDashboard = () => {
    switch (role) {
      case 'professor':
        return <ProfessorDashboard />;
      case 'diretor':
        return <DiretorDashboard />;
      case 'coordenador':
      case 'secretario':
        return <CoordenadorDashboard />;
      case 'administrador':
      case 'desenvolvedor':
        return <AdminDashboard />;
      case 'outro':
      default:
        return <SimpleDashboard />;
    }
  };

  return (
    <MainLayout>
      {getDashboard()}
    </MainLayout>
  );
}
