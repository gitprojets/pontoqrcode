import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Dispositivo {
  id: string;
  nome: string;
  unidade_id: string | null;
  local: string | null;
  status: 'online' | 'offline' | 'erro';
  ultima_leitura: string | null;
  leituras_hoje: number;
  created_at: string;
  updated_at: string;
  unidade?: {
    nome: string;
  } | null;
}

export interface DispositivoInput {
  nome: string;
  unidade_id?: string;
  local?: string;
  status?: 'online' | 'offline' | 'erro';
}

export function useDispositivos() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDispositivos = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use the safe view that excludes api_key for security
      const { data, error } = await supabase
        .from('dispositivos_safe')
        .select(`
          id,
          nome,
          unidade_id,
          local,
          status,
          ultima_leitura,
          leituras_hoje,
          created_at,
          updated_at
        `)
        .order('nome');
      
      if (error) throw error;
      
      // Fetch unidade names separately since views don't support joins directly
      if (data && data.length > 0) {
        const unidadeIds = [...new Set(data.filter(d => d.unidade_id).map(d => d.unidade_id))];
        if (unidadeIds.length > 0) {
          const { data: unidades } = await supabase
            .from('unidades')
            .select('id, nome')
            .in('id', unidadeIds);
          
          const unidadeMap = new Map(unidades?.map(u => [u.id, u.nome]) || []);
          
          const dataWithUnidades = data.map(d => ({
            ...d,
            unidade: d.unidade_id ? { nome: unidadeMap.get(d.unidade_id) || null } : null
          }));
          
          setDispositivos(dataWithUnidades as Dispositivo[]);
        } else {
          setDispositivos(data as Dispositivo[]);
        }
      } else {
        setDispositivos([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dispositivos:', error);
      toast.error('Erro ao carregar dispositivos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDispositivo = async (input: DispositivoInput) => {
    try {
      // Generate a simple API key for the device
      const api_key = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('dispositivos')
        .insert({ ...input, api_key })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Dispositivo criado com sucesso!');
      await fetchDispositivos();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar dispositivo:', error);
      toast.error('Erro ao criar dispositivo: ' + error.message);
      throw error;
    }
  };

  const updateDispositivo = async (id: string, input: Partial<DispositivoInput>) => {
    try {
      const { error } = await supabase
        .from('dispositivos')
        .update(input)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Dispositivo atualizado com sucesso!');
      await fetchDispositivos();
    } catch (error: any) {
      console.error('Erro ao atualizar dispositivo:', error);
      toast.error('Erro ao atualizar dispositivo: ' + error.message);
      throw error;
    }
  };

  const deleteDispositivo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dispositivos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Dispositivo excluído com sucesso!');
      await fetchDispositivos();
    } catch (error: any) {
      console.error('Erro ao excluir dispositivo:', error);
      toast.error('Erro ao excluir dispositivo: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchDispositivos();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('dispositivos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispositivos' }, () => {
        fetchDispositivos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDispositivos]);

  return {
    dispositivos,
    isLoading,
    fetchDispositivos,
    createDispositivo,
    updateDispositivo,
    deleteDispositivo,
  };
}
