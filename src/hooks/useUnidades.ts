import { useState, useEffect } from 'react';
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

  const fetchUnidades = async () => {
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
  };

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
  }, []);

  return {
    unidades,
    isLoading,
    fetchUnidades,
    createUnidade,
    updateUnidade,
    deleteUnidade,
  };
}
