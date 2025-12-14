import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Unidade {
  id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  diretor_id: string | null;
  status: 'online' | 'offline' | 'manutencao';
  hora_abertura: string | null;
  hora_fechamento: string | null;
  dias_funcionamento: number[] | null;
  created_at: string;
  updated_at: string;
  diretor?: {
    nome: string;
  } | null;
}

export interface UnidadeInput {
  nome: string;
  endereco?: string;
  telefone?: string;
  diretor_id?: string;
  status?: 'online' | 'offline' | 'manutencao';
  hora_abertura?: string;
  hora_fechamento?: string;
  dias_funcionamento?: number[];
}

export function useUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnidades = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('unidades')
        .select(`
          *,
          diretor:profiles!unidades_diretor_id_fkey(nome)
        `)
        .order('nome');

      if (error) throw error;
      
      setUnidades((data || []) as Unidade[]);
    } catch (error: any) {
      console.error('Erro ao carregar unidades:', error);
      toast.error('Erro ao carregar unidades');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUnidade = async (input: UnidadeInput) => {
    try {
      const { data, error } = await supabase
        .from('unidades')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Unidade criada com sucesso!');
      await fetchUnidades();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar unidade:', error);
      toast.error('Erro ao criar unidade: ' + error.message);
      throw error;
    }
  };

  const updateUnidade = async (id: string, input: Partial<UnidadeInput>) => {
    try {
      const { error } = await supabase
        .from('unidades')
        .update(input)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Unidade atualizada com sucesso!');
      await fetchUnidades();
    } catch (error: any) {
      console.error('Erro ao atualizar unidade:', error);
      toast.error('Erro ao atualizar unidade: ' + error.message);
      throw error;
    }
  };

  const deleteUnidade = async (id: string) => {
    try {
      // First, check for profiles linked to this unit and clear their unidade_id
      const { error: profilesError } = await supabase
        .from('profiles')
        .update({ unidade_id: null })
        .eq('unidade_id', id);

      if (profilesError) {
        console.warn('Could not clear profiles unidade_id:', profilesError);
        // Continue anyway - RLS may prevent this update for some users
      }

      // Clear diretor_id reference in the unit itself to avoid any issues
      const { error: updateError } = await supabase
        .from('unidades')
        .update({ diretor_id: null })
        .eq('id', id);

      if (updateError) {
        console.warn('Could not clear diretor_id:', updateError);
      }

      // Also clear escalas_trabalho linked to this unit
      const { error: escalasError } = await supabase
        .from('escalas_trabalho')
        .delete()
        .eq('unidade_id', id);

      if (escalasError) {
        console.warn('Could not delete escalas:', escalasError);
      }

      // Delete registros_frequencia linked to this unit
      const { error: registrosError } = await supabase
        .from('registros_frequencia')
        .delete()
        .eq('unidade_id', id);

      if (registrosError) {
        console.warn('Could not delete registros:', registrosError);
      }

      // Delete dispositivos linked to this unit
      const { error: dispositivosError } = await supabase
        .from('dispositivos')
        .delete()
        .eq('unidade_id', id);

      if (dispositivosError) {
        console.warn('Could not delete dispositivos:', dispositivosError);
      }

      // Delete school_events linked to this unit
      const { error: eventsError } = await supabase
        .from('school_events')
        .delete()
        .eq('unidade_id', id);

      if (eventsError) {
        console.warn('Could not delete school events:', eventsError);
      }

      // Now delete the unit
      const { error } = await supabase
        .from('unidades')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Unidade excluída com sucesso!');
      await fetchUnidades();
    } catch (error: any) {
      console.error('Erro ao excluir unidade:', error);
      toast.error('Erro ao excluir unidade: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchUnidades();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('unidades-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unidades' }, () => {
        fetchUnidades();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnidades]);

  return {
    unidades,
    isLoading,
    fetchUnidades,
    createUnidade,
    updateUnidade,
    deleteUnidade,
  };
}
