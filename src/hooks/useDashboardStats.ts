import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  // Professor stats
  presencasMes: number;
  diasLetivos: number;
  atrasos: number;
  faltas: number;
  taxaPresenca: string;
  
  // Director stats
  professoresPresentes: number;
  professoresEsperados: number;
  pendencias: number;
  taxaGeral: string;
  
  // Admin stats
  unidadesAtivas: number;
  totalUsuarios: number;
  leiturasHoje: number;
  dispositivosOnline: number;
  dispositivosTotal: number;
}

export function useDashboardStats() {
  const { user, role, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    presencasMes: 0,
    diasLetivos: 0,
    atrasos: 0,
    faltas: 0,
    taxaPresenca: '0',
    professoresPresentes: 0,
    professoresEsperados: 0,
    pendencias: 0,
    taxaGeral: '0',
    unidadesAtivas: 0,
    totalUsuarios: 0,
    leiturasHoje: 0,
    dispositivosOnline: 0,
    dispositivosTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const hoje = new Date().toISOString().split('T')[0];
      const inicioMes = new Date();
      inicioMes.setDate(1);
      const inicioMesStr = inicioMes.toISOString().split('T')[0];

      if (role === 'professor') {
        // Professor stats - own attendance
        const { data: registros } = await supabase
          .from('registros_frequencia')
          .select('status')
          .eq('professor_id', user.id)
          .gte('data_registro', inicioMesStr)
          .lte('data_registro', hoje);

        const presencas = registros?.filter(r => r.status === 'presente' || r.status === 'atrasado').length || 0;
        const atrasos = registros?.filter(r => r.status === 'atrasado').length || 0;
        const faltas = registros?.filter(r => r.status === 'falta').length || 0;
        const total = registros?.length || 1;

        // Calculate school days in month (roughly weekdays)
        const now = new Date();
        const diasNoMes = now.getDate();
        const diasLetivos = Math.round(diasNoMes * 5 / 7);

        setStats(prev => ({
          ...prev,
          presencasMes: presencas,
          diasLetivos,
          atrasos,
          faltas,
          taxaPresenca: total > 0 ? ((presencas / diasLetivos) * 100).toFixed(0) : '0',
        }));
      } else if (role === 'diretor' || role === 'coordenador' || role === 'secretario') {
        // Director/Coordinator/Secretary stats - unit attendance
        const unidadeId = profile?.unidade_id;
        
        if (unidadeId) {
          // Professors in unit
          const { count: professoresTotal } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('unidade_id', unidadeId);

          // Today's attendance
          const { data: registrosHoje } = await supabase
            .from('registros_frequencia')
            .select('professor_id, status')
            .eq('unidade_id', unidadeId)
            .eq('data_registro', hoje);

          const presentes = new Set(registrosHoje?.map(r => r.professor_id)).size;

          // Get month stats
          const { data: registrosMes } = await supabase
            .from('registros_frequencia')
            .select('status')
            .eq('unidade_id', unidadeId)
            .gte('data_registro', inicioMesStr);

          const totalMes = registrosMes?.length || 1;
          const presentesMes = registrosMes?.filter(r => r.status === 'presente' || r.status === 'atrasado').length || 0;

          // Calculate school days in month (roughly weekdays)
          const now = new Date();
          const diasNoMes = now.getDate();
          const diasLetivos = Math.round(diasNoMes * 5 / 7);

          setStats(prev => ({
            ...prev,
            professoresPresentes: presentes,
            professoresEsperados: professoresTotal || 0,
            pendencias: 0,
            taxaGeral: ((presentesMes / totalMes) * 100).toFixed(1),
            diasLetivos,
          }));
        } else {
          // No unit assigned - show zeros
          setStats(prev => ({
            ...prev,
            professoresPresentes: 0,
            professoresEsperados: 0,
            pendencias: 0,
            taxaGeral: '0',
            diasLetivos: 0,
          }));
        }
      } else if (role === 'administrador' || role === 'desenvolvedor') {
        // Admin stats - system-wide - fetch fresh data from database
        // Only count non-demo units (units with a diretor_id assigned)
        const { count: unidadesCount, error: unidadesError } = await supabase
          .from('unidades')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'online');

        if (unidadesError) {
          console.error('Error fetching unidades count:', unidadesError);
        }

        // Count only real users (exclude demo users with @prof.edu.br, @diretor.edu.br, @administrador.edu.br emails)
        const { data: allProfiles, error: usuariosError } = await supabase
          .from('profiles')
          .select('email');

        let realUsersCount = 0;
        if (!usuariosError && allProfiles) {
          // Filter out demo emails
          realUsersCount = allProfiles.filter(p => 
            !p.email.includes('@prof.edu.br') && 
            !p.email.includes('@diretor.edu.br') && 
            !p.email.includes('@administrador.edu.br')
          ).length;
        }

        if (usuariosError) {
          console.error('Error fetching usuarios count:', usuariosError);
        }

        const { count: leiturasCount, error: leiturasError } = await supabase
          .from('registros_frequencia')
          .select('*', { count: 'exact', head: true })
          .eq('data_registro', hoje);

        if (leiturasError) {
          console.error('Error fetching leituras count:', leiturasError);
        }

        // Use dispositivos_safe view to avoid exposing api_key
        const { data: dispositivos, error: dispositivosError } = await supabase
          .from('dispositivos_safe')
          .select('status');

        if (dispositivosError) {
          console.error('Error fetching dispositivos:', dispositivosError);
        }

        const dispositivosOnline = dispositivos?.filter(d => d.status === 'online').length || 0;

        setStats({
          // Reset all stats with fresh data to avoid stale values
          presencasMes: 0,
          diasLetivos: 0,
          atrasos: 0,
          faltas: 0,
          taxaPresenca: '0',
          professoresPresentes: 0,
          professoresEsperados: 0,
          pendencias: 0,
          taxaGeral: '0',
          unidadesAtivas: unidadesCount || 0,
          totalUsuarios: realUsersCount,
          leiturasHoje: leiturasCount || 0,
          dispositivosOnline,
          dispositivosTotal: dispositivos?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, profile]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refresh: fetchStats };
}
