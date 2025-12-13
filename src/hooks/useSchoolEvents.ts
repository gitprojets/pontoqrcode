import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SchoolEvent {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  tipo: 'feriado' | 'folga' | 'reposicao' | 'evento' | 'recesso';
  unidade_id: string | null;
  is_global: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useSchoolEvents(unidadeId?: string | null) {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('school_events')
        .select('*')
        .order('data_inicio', { ascending: true });

      // If unidade_id is provided, fetch events for that unit OR global events
      if (unidadeId) {
        query = query.or(`unidade_id.eq.${unidadeId},is_global.eq.true`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents((data || []) as SchoolEvent[]);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos do calendário');
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  const createEvent = async (event: Omit<SchoolEvent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('school_events')
        .insert({
          ...event,
          created_by: user?.id,
        });

      if (error) throw error;
      
      toast.success('Evento criado com sucesso!');
      await fetchEvents();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento');
      throw error;
    }
  };

  const updateEvent = async (id: string, updates: Partial<SchoolEvent>) => {
    try {
      const { error } = await supabase
        .from('school_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Evento atualizado com sucesso!');
      await fetchEvents();
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast.error('Erro ao atualizar evento');
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('school_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Evento excluído com sucesso!');
      await fetchEvents();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
      throw error;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
