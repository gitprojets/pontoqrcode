import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, format } from 'date-fns';

interface ChartData {
  date: string;
  presentes: number;
  atrasados: number;
  faltas: number;
}

export function useAttendanceChart(days: number = 14) {
  const { user, role, profile } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChartData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);
      
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      let query = supabase
        .from('registros_frequencia')
        .select('data_registro, status')
        .gte('data_registro', startDateStr)
        .lte('data_registro', endDateStr)
        .order('data_registro', { ascending: true });

      // Filter by unit for directors/coordinators
      if ((role === 'diretor' || role === 'coordenador' || role === 'secretario') && profile?.unidade_id) {
        query = query.eq('unidade_id', profile.unidade_id);
      }
      
      // Filter by professor for professors
      if (role === 'professor') {
        query = query.eq('professor_id', user.id);
      }

      const { data: registros, error } = await query;

      if (error) {
        console.error('Error fetching chart data:', error);
        return;
      }

      // Group by date and count statuses
      const groupedData: Record<string, { presentes: number; atrasados: number; faltas: number }> = {};
      
      // Initialize all dates with zero values
      for (let i = 0; i < days; i++) {
        const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd');
        groupedData[date] = { presentes: 0, atrasados: 0, faltas: 0 };
      }

      // Count registros
      registros?.forEach(r => {
        if (!groupedData[r.data_registro]) {
          groupedData[r.data_registro] = { presentes: 0, atrasados: 0, faltas: 0 };
        }
        
        if (r.status === 'presente') {
          groupedData[r.data_registro].presentes++;
        } else if (r.status === 'atrasado') {
          groupedData[r.data_registro].atrasados++;
        } else if (r.status === 'falta') {
          groupedData[r.data_registro].faltas++;
        }
      });

      // Convert to array
      const chartData = Object.entries(groupedData)
        .map(([date, counts]) => ({
          date,
          ...counts,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setData(chartData);
    } catch (error) {
      console.error('Error in fetchChartData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, profile, days]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  return { data, isLoading, refresh: fetchChartData };
}