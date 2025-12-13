import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OperatingHours {
  hora_abertura: string | null;
  hora_fechamento: string | null;
  dias_funcionamento: number[] | null;
}

export function useOperatingHours() {
  const validateOperatingHours = useCallback(async (
    unidadeId: string,
    timestamp: Date = new Date()
  ): Promise<{ isValid: boolean; message: string }> => {
    try {
      const { data: unidade, error } = await supabase
        .from('unidades')
        .select('nome, hora_abertura, hora_fechamento, dias_funcionamento')
        .eq('id', unidadeId)
        .maybeSingle();

      if (error) throw error;
      
      if (!unidade) {
        return { isValid: false, message: 'Unidade não encontrada' };
      }

      const currentDay = timestamp.getDay(); // 0 = Sunday, 6 = Saturday
      const currentTime = timestamp.toTimeString().slice(0, 5); // HH:MM format

      // Check if current day is in operating days
      const operatingDays = unidade.dias_funcionamento || [1, 2, 3, 4, 5];
      if (!operatingDays.includes(currentDay)) {
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return { 
          isValid: false, 
          message: `${unidade.nome} não funciona às ${dayNames[currentDay]}s` 
        };
      }

      // Check operating hours
      const openTime = unidade.hora_abertura?.slice(0, 5) || '07:00';
      const closeTime = unidade.hora_fechamento?.slice(0, 5) || '17:00';

      if (currentTime < openTime) {
        return { 
          isValid: false, 
          message: `${unidade.nome} ainda não abriu. Horário de abertura: ${openTime}` 
        };
      }

      if (currentTime > closeTime) {
        return { 
          isValid: false, 
          message: `${unidade.nome} já fechou. Horário de fechamento: ${closeTime}` 
        };
      }

      return { isValid: true, message: 'Dentro do horário de funcionamento' };
    } catch (error: any) {
      console.error('Erro ao validar horário de funcionamento:', error);
      return { isValid: false, message: 'Erro ao validar horário de funcionamento' };
    }
  }, []);

  const checkAndNotify = useCallback(async (unidadeId: string): Promise<boolean> => {
    const result = await validateOperatingHours(unidadeId);
    
    if (!result.isValid) {
      toast.warning(result.message);
    }
    
    return result.isValid;
  }, [validateOperatingHours]);

  return {
    validateOperatingHours,
    checkAndNotify,
  };
}
