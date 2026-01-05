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
      // Use the RPC function that respects RLS and excludes api_key for security
      const { data, error } = await supabase
        .rpc('get_dispositivos_safe');
      
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
      // Generate a secure API key for the device
      const api_key = crypto.randomUUID();
      
      // Primeiro criar o dispositivo (sem api_key no campo direto - vai para tabela criptografada)
      const { data, error } = await supabase
        .from('dispositivos')
        .insert({ ...input })
        .select()
        .single();

      if (error) throw error;
      
      // Agora salvar a API key criptografada usando a função RPC
      const { error: keyError } = await supabase.rpc('set_encrypted_api_key', {
        p_dispositivo_id: data.id,
        p_api_key: api_key
      });
      
      if (keyError) {
        console.warn('Não foi possível salvar API key criptografada:', keyError);
        // Fallback: salvar no campo legado (se ainda existir)
        await supabase
          .from('dispositivos')
          .update({ api_key })
          .eq('id', data.id);
      }
      
      toast.success('Dispositivo criado com sucesso!');
      await fetchDispositivos();
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao criar dispositivo:', error);
      toast.error('Erro ao criar dispositivo: ' + errorMessage);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao atualizar dispositivo:', error);
      toast.error('Erro ao atualizar dispositivo: ' + errorMessage);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao excluir dispositivo:', error);
      toast.error('Erro ao excluir dispositivo: ' + errorMessage);
      throw error;
    }
  };

  // Função para obter API key descriptografada (apenas para desenvolvedores)
  const getApiKey = async (dispositivoId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('get_decrypted_api_key', {
        p_dispositivo_id: dispositivoId
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter API key:', error);
      return null;
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
    getApiKey,
  };
}
