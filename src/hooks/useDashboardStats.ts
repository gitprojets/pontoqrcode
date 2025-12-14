import { useState, useEffect, useCallback, useRef } from 'react';
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

const initialStats: DashboardStats = {
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
};

export function useDashboardStats() {
  const { user, role, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!user || !isMountedRef.current) return;

    try {
      setIsLoading(true);
      const hoje = new Date().toISOString().split('T')[0];
      const inicioMes = new Date();
      inicioMes.setDate(1);
      const inicioMesStr = inicioMes.toISOString().split('T')[0];

      if (role === 'professor') {
        const { data: registros } = await supabase
          .from('registros_frequencia')
          .select('status')
          .eq('professor_id', user.id)
          .gte('data_registro', inicioMesStr)
          .lte('data_registro', hoje);

        const presencas = registros?.filter(r => r.status === 'presente' || r.status === 'atrasado').length || 0;
        const atrasos = registros?.filter(r => r.status === 'atrasado').length || 0;
        const faltas = registros?.filter(r => r.status === 'falta').length || 0;

        const now = new Date();
        const diasNoMes = now.getDate();
        const diasLetivos = Math.round(diasNoMes * 5 / 7);

        if (isMountedRef.current) {
          setStats(prev => ({
            ...prev,
            presencasMes: presencas,
            diasLetivos,
            atrasos,
            faltas,
            taxaPresenca: diasLetivos > 0 ? ((presencas / diasLetivos) * 100).toFixed(0) : '0',
          }));
        }
      } else if (role === 'diretor' || role === 'coordenador' || role === 'secretario') {
        const unidadeId = profile?.unidade_id;
        
        if (unidadeId) {
          const [professoresRes, registrosHojeRes, registrosMesRes] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('unidade_id', unidadeId),
            supabase.from('registros_frequencia').select('professor_id, status').eq('unidade_id', unidadeId).eq('data_registro', hoje),
            supabase.from('registros_frequencia').select('status').eq('unidade_id', unidadeId).gte('data_registro', inicioMesStr),
          ]);

          const presentes = new Set(registrosHojeRes.data?.map(r => r.professor_id)).size;
          const totalMes = registrosMesRes.data?.length || 1;
          const presentesMes = registrosMesRes.data?.filter(r => r.status === 'presente' || r.status === 'atrasado').length || 0;
          const diasNoMes = new Date().getDate();
          const diasLetivos = Math.round(diasNoMes * 5 / 7);

          if (isMountedRef.current) {
            setStats(prev => ({
              ...prev,
              professoresPresentes: presentes,
              professoresEsperados: professoresRes.count || 0,
              pendencias: 0,
              taxaGeral: ((presentesMes / totalMes) * 100).toFixed(1),
              diasLetivos,
            }));
          }
        } else if (isMountedRef.current) {
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
        // Fetch all counts in parallel for speed
        const [unidadesRes, usuariosRes, leiturasRes, dispositivosRes] = await Promise.all([
          supabase.from('unidades').select('*', { count: 'exact', head: true }).eq('status', 'online'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('registros_frequencia').select('*', { count: 'exact', head: true }).eq('data_registro', hoje),
          supabase.rpc('get_dispositivos_safe'),
        ]);

        const dispositivosOnline = (dispositivosRes.data as Array<{ status: string }> | null)?.filter(d => d.status === 'online').length || 0;

        if (isMountedRef.current) {
          setStats({
            presencasMes: 0,
            diasLetivos: 0,
            atrasos: 0,
            faltas: 0,
            taxaPresenca: '0',
            professoresPresentes: 0,
            professoresEsperados: 0,
            pendencias: 0,
            taxaGeral: '0',
            unidadesAtivas: unidadesRes.count || 0,
            totalUsuarios: usuariosRes.count || 0,
            leiturasHoje: leiturasRes.count || 0,
            dispositivosOnline,
            dispositivosTotal: dispositivosRes.data?.length || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, role, profile]);

  // Setup realtime subscriptions for instant updates
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!user || !role) return;

    // Initial fetch
    fetchStats();

    // Only setup realtime for admin/developer roles
    if (role === 'administrador' || role === 'desenvolvedor') {
      // Create a single channel for multiple table subscriptions
      const channel = supabase
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          if (isMountedRef.current) fetchStats();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'unidades' }, () => {
          if (isMountedRef.current) fetchStats();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dispositivos' }, () => {
          if (isMountedRef.current) fetchStats();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_frequencia' }, () => {
          if (isMountedRef.current) fetchStats();
        })
        .subscribe();

      channelRef.current = channel;
    }

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, role, fetchStats]);

  return { stats, isLoading, refresh: fetchStats };
}
