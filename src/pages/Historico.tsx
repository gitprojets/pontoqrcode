import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory';
import { StatCard } from '@/components/dashboard/StatCard';
import { CheckCircle, Clock, XCircle, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface YearStats {
  total: number;
  presentes: number;
  atrasados: number;
  faltas: number;
  justificados: number;
  taxaPresenca: string;
}

export default function Historico() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState<YearStats>({
    total: 0,
    presentes: 0,
    atrasados: 0,
    faltas: 0,
    justificados: 0,
    taxaPresenca: '0',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get current year start and end
        const year = new Date().getFullYear();
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;

        let query = supabase
          .from('registros_frequencia')
          .select('status')
          .gte('data_registro', yearStart)
          .lte('data_registro', yearEnd);

        // For professors, only show their own stats
        if (role === 'professor') {
          query = query.eq('professor_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        const presentes = data?.filter(r => r.status === 'presente').length || 0;
        const atrasados = data?.filter(r => r.status === 'atrasado').length || 0;
        const faltas = data?.filter(r => r.status === 'falta').length || 0;
        const justificados = data?.filter(r => r.status === 'justificado').length || 0;
        const total = data?.length || 0;

        setStats({
          total,
          presentes,
          atrasados,
          faltas,
          justificados,
          taxaPresenca: total > 0 
            ? ((presentes + atrasados) / total * 100).toFixed(1)
            : '0',
        });
      } catch (error) {
        console.error('Error fetching yearly stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, role]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Histórico de Presença
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulte seu histórico completo de registros
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Presenças"
            value={String(stats.presentes + stats.atrasados)}
            subtitle="no ano letivo"
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Atrasos"
            value={String(stats.atrasados)}
            subtitle="no ano letivo"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Faltas"
            value={String(stats.faltas)}
            subtitle={`${stats.justificados} justificadas`}
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

        <AttendanceHistory />
      </div>
    </MainLayout>
  );
}