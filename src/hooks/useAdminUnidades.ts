import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminUnidade {
  id: string;
  unidade_id: string;
  unidade?: {
    id: string;
    nome: string;
  };
}

export function useAdminUnidades() {
  const { profile, role } = useAuth();
  const [adminUnidades, setAdminUnidades] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminUnidades = useCallback(async () => {
    if (role !== 'administrador' || !profile?.id) {
      setAdminUnidades([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('admin_unidades')
        .select('unidade_id')
        .eq('admin_id', profile.id);

      if (error) throw error;

      setAdminUnidades((data || []).map(d => d.unidade_id));
    } catch (error) {
      console.error('Error fetching admin unidades:', error);
      setAdminUnidades([]);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, role]);

  useEffect(() => {
    fetchAdminUnidades();
  }, [fetchAdminUnidades]);

  return { adminUnidades, isLoading, refetch: fetchAdminUnidades };
}