import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AttendanceRules {
  id: string;
  unidade_id: string;
  tolerancia_entrada: number;
  tolerancia_saida: number;
  max_correcoes_mes: number;
  prazo_correcao_dias: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const defaultRules: Omit<AttendanceRules, 'id' | 'unidade_id' | 'created_by' | 'created_at' | 'updated_at'> = {
  tolerancia_entrada: 15,
  tolerancia_saida: 10,
  max_correcoes_mes: 3,
  prazo_correcao_dias: 5,
};

export function useAttendanceRules(unidadeId?: string) {
  const { user, profile, role } = useAuth();
  const [rules, setRules] = useState<AttendanceRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const targetUnidadeId = unidadeId || profile?.unidade_id;
  const canEdit = role === 'desenvolvedor' || role === 'administrador' || role === 'diretor';

  const fetchRules = useCallback(async () => {
    if (!user || !targetUnidadeId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('attendance_rules')
        .select('*')
        .eq('unidade_id', targetUnidadeId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRules(data as AttendanceRules);
      } else if (canEdit) {
        // Create default rules if none exist and user can edit
        const { data: newRules, error: insertError } = await supabase
          .from('attendance_rules')
          .insert({ 
            unidade_id: targetUnidadeId, 
            created_by: user.id,
            ...defaultRules 
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default rules:', insertError);
          // Use local defaults
          setRules({
            id: '',
            unidade_id: targetUnidadeId,
            created_by: user.id,
            ...defaultRules,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          setRules(newRules as AttendanceRules);
        }
      } else {
        // Non-editable users get defaults
        setRules({
          id: '',
          unidade_id: targetUnidadeId,
          created_by: null,
          ...defaultRules,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching attendance rules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, targetUnidadeId, canEdit]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const updateRules = useCallback(async (updates: Partial<Omit<AttendanceRules, 'id' | 'unidade_id' | 'created_by' | 'created_at' | 'updated_at'>>) => {
    if (!user || !targetUnidadeId || !canEdit) {
      toast.error('Sem permissão para editar regras');
      return false;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('attendance_rules')
        .update(updates)
        .eq('unidade_id', targetUnidadeId);

      if (error) throw error;

      setRules(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Regras de presença salvas!');
      return true;
    } catch (error) {
      console.error('Error updating rules:', error);
      toast.error('Erro ao salvar regras');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, targetUnidadeId, canEdit]);

  return {
    rules,
    isLoading,
    isSaving,
    canEdit,
    updateRules,
    refresh: fetchRules,
    defaultRules,
  };
}
