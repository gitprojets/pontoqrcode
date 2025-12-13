import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RegistroFrequencia {
  id: string;
  professor_id: string;
  unidade_id: string;
  dispositivo_id: string | null;
  data_registro: string;
  hora_entrada: string | null;
  hora_saida: string | null;
  status: 'presente' | 'atrasado' | 'falta' | 'justificado' | 'folga';
  lido_por: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  professor?: {
    id: string;
    nome: string;
    matricula: string | null;
    foto: string | null;
  };
  leitor?: {
    nome: string;
  };
}

export interface RegistroInput {
  professor_id: string;
  unidade_id: string;
  dispositivo_id?: string | null;
  data_registro?: string;
  hora_entrada?: string | null;
  hora_saida?: string | null;
  status?: 'presente' | 'atrasado' | 'falta' | 'justificado' | 'folga';
  lido_por?: string | null;
  observacao?: string | null;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export function useRegistrosFrequencia(unidadeId?: string) {
  const [registros, setRegistros] = useState<RegistroFrequencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 50,
    total: 0,
    hasMore: true,
  });
  const { toast } = useToast();

  const fetchRegistros = useCallback(async (
    dataInicio?: string, 
    dataFim?: string, 
    page = 0, 
    pageSize = 50,
    append = false
  ) => {
    try {
      setIsLoading(true);
      
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Build count query
      let countQuery = supabase
        .from('registros_frequencia')
        .select('*', { count: 'exact', head: true });

      if (unidadeId) {
        countQuery = countQuery.eq('unidade_id', unidadeId);
      }
      if (dataInicio) {
        countQuery = countQuery.gte('data_registro', dataInicio);
      }
      if (dataFim) {
        countQuery = countQuery.lte('data_registro', dataFim);
      }

      const { count } = await countQuery;

      // Build data query
      let query = supabase
        .from('registros_frequencia')
        .select(`
          id,
          professor_id,
          unidade_id,
          dispositivo_id,
          data_registro,
          hora_entrada,
          hora_saida,
          status,
          lido_por,
          observacao,
          created_at,
          updated_at,
          professor:profiles!professor_id(id, nome, matricula, foto),
          leitor:profiles!lido_por(nome)
        `)
        .order('data_registro', { ascending: false })
        .order('hora_entrada', { ascending: false })
        .range(from, to);

      if (unidadeId) {
        query = query.eq('unidade_id', unidadeId);
      }

      if (dataInicio) {
        query = query.gte('data_registro', dataInicio);
      }

      if (dataFim) {
        query = query.lte('data_registro', dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        professor: Array.isArray(item.professor) ? item.professor[0] : item.professor,
        leitor: Array.isArray(item.leitor) ? item.leitor[0] : item.leitor
      }));
      
      if (append) {
        setRegistros(prev => [...prev, ...transformedData as RegistroFrequencia[]]);
      } else {
        setRegistros(transformedData as RegistroFrequencia[]);
      }

      setPagination({
        page,
        pageSize,
        total: count || 0,
        hasMore: (from + (data?.length || 0)) < (count || 0),
      });
    } catch (error: any) {
      console.error('Error fetching registros:', error);
      toast({
        title: 'Erro ao carregar registros',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId, toast]);

  const loadMore = useCallback((dataInicio?: string, dataFim?: string) => {
    if (pagination.hasMore && !isLoading) {
      fetchRegistros(dataInicio, dataFim, pagination.page + 1, pagination.pageSize, true);
    }
  }, [fetchRegistros, pagination, isLoading]);

  const registrarPresenca = async (
    professorId: string, 
    unidadeId: string, 
    horaEscalaEntrada?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const hoje = new Date().toISOString().split('T')[0];
      const agora = new Date().toTimeString().split(' ')[0].substring(0, 5);

      const { data: existing } = await supabase
        .from('registros_frequencia')
        .select('id, hora_entrada, hora_saida')
        .eq('professor_id', professorId)
        .eq('data_registro', hoje)
        .maybeSingle();

      let status: 'presente' | 'atrasado' = 'presente';
      
      if (horaEscalaEntrada && agora > horaEscalaEntrada) {
        status = 'atrasado';
      }

      if (existing) {
        if (!existing.hora_saida) {
          const { error } = await supabase
            .from('registros_frequencia')
            .update({ 
              hora_saida: agora,
              lido_por: user?.id 
            })
            .eq('id', existing.id);

          if (error) throw error;

          toast({
            title: 'Saída registrada',
            description: `Saída às ${agora} registrada com sucesso.`,
          });
        } else {
          toast({
            title: 'Já registrado',
            description: 'Este professor já tem entrada e saída registradas hoje.',
            variant: 'destructive',
          });
          return null;
        }
      } else {
        const { data, error } = await supabase
          .from('registros_frequencia')
          .insert({
            professor_id: professorId,
            unidade_id: unidadeId,
            data_registro: hoje,
            hora_entrada: agora,
            status,
            lido_por: user?.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: status === 'atrasado' ? 'Entrada com atraso' : 'Entrada registrada',
          description: `Entrada às ${agora} registrada ${status === 'atrasado' ? 'com atraso' : 'com sucesso'}.`,
          variant: status === 'atrasado' ? 'destructive' : 'default',
        });

        await fetchRegistros();
        return data;
      }

      await fetchRegistros();
    } catch (error: any) {
      console.error('Error registering presence:', error);
      toast({
        title: 'Erro ao registrar presença',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getEstatisticas = async (dataInicio: string, dataFim: string) => {
    try {
      let query = supabase
        .from('registros_frequencia')
        .select('status')
        .gte('data_registro', dataInicio)
        .lte('data_registro', dataFim);

      if (unidadeId) {
        query = query.eq('unidade_id', unidadeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        presentes: data?.filter(r => r.status === 'presente').length || 0,
        atrasados: data?.filter(r => r.status === 'atrasado').length || 0,
        faltas: data?.filter(r => r.status === 'falta').length || 0,
        justificados: data?.filter(r => r.status === 'justificado').length || 0,
        folgas: data?.filter(r => r.status === 'folga').length || 0,
      };

      return {
        ...stats,
        taxaPresenca: stats.total > 0 
          ? ((stats.presentes + stats.atrasados) / stats.total * 100).toFixed(1) 
          : '0',
        taxaAtraso: stats.total > 0 
          ? (stats.atrasados / stats.total * 100).toFixed(1) 
          : '0',
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  return {
    registros,
    isLoading,
    pagination,
    fetchRegistros,
    loadMore,
    registrarPresenca,
    getEstatisticas,
  };
}
