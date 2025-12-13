import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyReportData {
  professor: {
    nome: string;
    matricula: string | null;
  };
  diasTrabalhados: number;
  diasAusentes: number;
  diasAtrasados: number;
  diasJustificados: number;
  horasTrabalhadas: string;
  taxaPresenca: string;
}

export function useMonthlyReport() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMonthlyReport = useCallback(async (
    month: Date,
    unidadeId?: string | null,
    unidadeNome?: string
  ) => {
    setIsGenerating(true);
    
    try {
      const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(month), 'yyyy-MM-dd');
      
      // Calculate working days in month (excluding weekends)
      const allDays = eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month)
      });
      const workingDays = allDays.filter(day => !isWeekend(day)).length;

      // Build query
      let query = supabase
        .from('registros_frequencia')
        .select(`
          professor_id,
          data_registro,
          hora_entrada,
          hora_saida,
          status,
          professor:profiles!professor_id(nome, matricula)
        `)
        .gte('data_registro', startDate)
        .lte('data_registro', endDate);

      if (unidadeId) {
        query = query.eq('unidade_id', unidadeId);
      }

      const { data: registros, error } = await query;

      if (error) throw error;

      // Group by professor
      const professorStats: Record<string, MonthlyReportData> = {};

      (registros || []).forEach((reg) => {
        const professorData = Array.isArray(reg.professor) 
          ? reg.professor[0] 
          : reg.professor;
        
        const professorId = reg.professor_id;
        
        if (!professorStats[professorId]) {
          professorStats[professorId] = {
            professor: {
              nome: professorData?.nome || 'Desconhecido',
              matricula: professorData?.matricula || null,
            },
            diasTrabalhados: 0,
            diasAusentes: 0,
            diasAtrasados: 0,
            diasJustificados: 0,
            horasTrabalhadas: '0:00',
            taxaPresenca: '0%',
          };
        }

        const stats = professorStats[professorId];
        
        switch (reg.status) {
          case 'presente':
            stats.diasTrabalhados++;
            break;
          case 'atrasado':
            stats.diasTrabalhados++;
            stats.diasAtrasados++;
            break;
          case 'ausente':
            stats.diasAusentes++;
            break;
          case 'justificado':
            stats.diasJustificados++;
            break;
        }

        // Calculate hours
        if (reg.hora_entrada && reg.hora_saida) {
          const [entradaH, entradaM] = reg.hora_entrada.split(':').map(Number);
          const [saidaH, saidaM] = reg.hora_saida.split(':').map(Number);
          const totalMinutes = (saidaH * 60 + saidaM) - (entradaH * 60 + entradaM);
          
          if (totalMinutes > 0) {
            const [currentH, currentM] = stats.horasTrabalhadas.split(':').map(Number);
            const newTotalMinutes = (currentH * 60 + currentM) + totalMinutes;
            const hours = Math.floor(newTotalMinutes / 60);
            const minutes = newTotalMinutes % 60;
            stats.horasTrabalhadas = `${hours}:${String(minutes).padStart(2, '0')}`;
          }
        }
      });

      // Calculate presence rate
      Object.values(professorStats).forEach(stats => {
        const totalDias = stats.diasTrabalhados + stats.diasAusentes;
        if (totalDias > 0) {
          stats.taxaPresenca = ((stats.diasTrabalhados / totalDias) * 100).toFixed(1) + '%';
        }
      });

      // Prepare data for PDF
      const reportData = Object.values(professorStats).map(stats => ({
        nome: stats.professor.nome,
        matricula: stats.professor.matricula || '-',
        diasTrabalhados: stats.diasTrabalhados,
        diasAusentes: stats.diasAusentes,
        diasAtrasados: stats.diasAtrasados,
        diasJustificados: stats.diasJustificados,
        horasTrabalhadas: stats.horasTrabalhadas,
        taxaPresenca: stats.taxaPresenca,
      }));

      // Add summary row
      const totals = {
        nome: 'TOTAL',
        matricula: '-',
        diasTrabalhados: reportData.reduce((sum, r) => sum + r.diasTrabalhados, 0),
        diasAusentes: reportData.reduce((sum, r) => sum + r.diasAusentes, 0),
        diasAtrasados: reportData.reduce((sum, r) => sum + r.diasAtrasados, 0),
        diasJustificados: reportData.reduce((sum, r) => sum + r.diasJustificados, 0),
        horasTrabalhadas: '-',
        taxaPresenca: '-',
      };

      const monthName = format(month, 'MMMM yyyy', { locale: ptBR });
      const subtitle = unidadeNome 
        ? `Unidade: ${unidadeNome} | Período: ${monthName} | Dias úteis: ${workingDays}`
        : `Período: ${monthName} | Dias úteis: ${workingDays}`;

      exportToPDF({
        title: 'Relatório Mensal de Frequência',
        subtitle,
        columns: [
          { header: 'Nome', key: 'nome', width: 45 },
          { header: 'Matrícula', key: 'matricula', width: 20 },
          { header: 'Presentes', key: 'diasTrabalhados', width: 18 },
          { header: 'Ausentes', key: 'diasAusentes', width: 18 },
          { header: 'Atrasos', key: 'diasAtrasados', width: 18 },
          { header: 'Justif.', key: 'diasJustificados', width: 18 },
          { header: 'Horas', key: 'horasTrabalhadas', width: 20 },
          { header: '% Presença', key: 'taxaPresenca', width: 20 },
        ],
        data: [...reportData, totals],
        filename: `relatorio_mensal_${format(month, 'yyyy_MM')}`,
        orientation: 'landscape',
      });

      toast.success('Relatório mensal gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório mensal:', error);
      toast.error('Erro ao gerar relatório mensal');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    generateMonthlyReport,
  };
}
