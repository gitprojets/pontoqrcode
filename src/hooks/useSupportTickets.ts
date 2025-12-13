import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    nome: string;
    email: string;
  };
  responder?: {
    nome: string;
  };
}

export function useSupportTickets(isAdmin = false) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(nome, email),
          responder:profiles!support_tickets_responded_by_fkey(nome)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error: unknown) {
      console.error('Erro ao carregar tickets:', error);
      toast.error('Erro ao carregar tickets de suporte');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTicket = async (subject: string, message: string, priority: string = 'normal') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject,
          message,
          priority,
        });

      if (error) throw error;
      
      toast.success('Ticket criado com sucesso!');
      await fetchTickets();
    } catch (error: unknown) {
      console.error('Erro ao criar ticket:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao criar ticket: ' + message);
      throw error;
    }
  };

  const updateTicket = async (id: string, updates: Partial<Pick<SupportTicket, 'status' | 'response' | 'priority'>>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: Record<string, unknown> = { ...updates };
      
      if (updates.response) {
        updateData.responded_by = user?.id;
        updateData.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Ticket atualizado com sucesso!');
      await fetchTickets();
    } catch (error: unknown) {
      console.error('Erro ao atualizar ticket:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar ticket: ' + message);
      throw error;
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Ticket excluído com sucesso!');
      await fetchTickets();
    } catch (error: unknown) {
      console.error('Erro ao excluir ticket:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao excluir ticket: ' + message);
      throw error;
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    isLoading,
    fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket,
  };
}
