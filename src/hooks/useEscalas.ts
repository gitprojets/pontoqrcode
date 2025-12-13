import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EscalaTrabalho {
  id: string;
  professor_id: string;
  unidade_id: string;
  semana_inicio: string;
  dia_semana: number;
  hora_entrada: string | null;
  hora_saida: string | null;
  is_folga: boolean;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  professor?: {
    nome: string;
    matricula: string | null;
  };
}

export interface EscalaInput {
  professor_id: string;
  unidade_id: string;
  semana_inicio: string;
  dia_semana: number;
  hora_entrada?: string | null;
  hora_saida?: string | null;
  is_folga?: boolean;
  observacao?: string | null;
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function useEscalas(unidadeId?: string) {
  const [escalas, setEscalas] = useState<EscalaTrabalho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEscalas = async (semanaInicio?: string) => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('escalas_trabalho')
        .select(`
          id,
          professor_id,
          unidade_id,
          semana_inicio,
          dia_semana,
          hora_entrada,
          hora_saida,
          is_folga,
          observacao,
          created_at,
          updated_at,
          created_by,
          professor:profiles!professor_id(nome, matricula)
        `)
        .order('dia_semana');

      if (unidadeId) {
        query = query.eq('unidade_id', unidadeId);
      }

      if (semanaInicio) {
        query = query.eq('semana_inicio', semanaInicio);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform data to match interface
      const transformedData = (data || []).map(item => ({
        ...item,
        professor: Array.isArray(item.professor) ? item.professor[0] : item.professor
      }));
      
      setEscalas(transformedData as EscalaTrabalho[]);
    } catch (error: any) {
      console.error('Error fetching escalas:', error);
      toast({
        title: 'Erro ao carregar escalas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createEscala = async (input: EscalaInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('escalas_trabalho')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Escala criada',
        description: `Escala para ${DIAS_SEMANA[input.dia_semana]} adicionada com sucesso.`,
      });

      await fetchEscalas(input.semana_inicio);
      return data;
    } catch (error: any) {
      console.error('Error creating escala:', error);
      toast({
        title: 'Erro ao criar escala',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEscala = async (id: string, input: Partial<EscalaInput>) => {
    try {
      const { error } = await supabase
        .from('escalas_trabalho')
        .update(input)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Escala atualizada',
        description: 'Alterações salvas com sucesso.',
      });

      await fetchEscalas();
    } catch (error: any) {
      console.error('Error updating escala:', error);
      toast({
        title: 'Erro ao atualizar escala',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteEscala = async (id: string) => {
    try {
      const { error } = await supabase
        .from('escalas_trabalho')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Escala removida',
        description: 'Escala removida com sucesso.',
      });

      await fetchEscalas();
    } catch (error: any) {
      console.error('Error deleting escala:', error);
      toast({
        title: 'Erro ao remover escala',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const upsertEscalasSemana = async (
    professorId: string, 
    unidadeId: string, 
    semanaInicio: string, 
    escalas: Array<{
      dia_semana: number;
      hora_entrada: string | null;
      hora_saida: string | null;
      is_folga: boolean;
    }>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const records = escalas.map(e => ({
        professor_id: professorId,
        unidade_id: unidadeId,
        semana_inicio: semanaInicio,
        dia_semana: e.dia_semana,
        hora_entrada: e.hora_entrada,
        hora_saida: e.hora_saida,
        is_folga: e.is_folga,
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from('escalas_trabalho')
        .upsert(records, { 
          onConflict: 'professor_id,semana_inicio,dia_semana',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: 'Escala salva',
        description: 'Escala semanal salva com sucesso.',
      });

      await fetchEscalas(semanaInicio);
    } catch (error: any) {
      console.error('Error upserting escalas:', error);
      toast({
        title: 'Erro ao salvar escala',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchEscalas();
  }, [unidadeId]);

  return {
    escalas,
    isLoading,
    fetchEscalas,
    createEscala,
    updateEscala,
    deleteEscala,
    upsertEscalasSemana,
    DIAS_SEMANA,
  };
}
