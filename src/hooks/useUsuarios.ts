import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'professor' | 'diretor' | 'administrador' | 'desenvolvedor' | 'coordenador' | 'secretario' | 'outro';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  foto: string | null;
  unidade_id: string | null;
  created_at: string;
  updated_at: string;
  role: AppRole;
  unidade?: {
    nome: string;
  } | null;
}

export interface UsuarioInput {
  nome: string;
  email: string;
  matricula?: string;
  unidade_id?: string;
  role: AppRole;
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsuarios = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch ALL profiles without pagination limit
      // Use multiple queries if needed to bypass 1000 row limit
      let allProfiles: any[] = [];
      let hasMore = true;
      let offset = 0;
      const batchSize = 1000;

      while (hasMore) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            *,
            unidade:unidades!profiles_unidade_id_fkey(nome)
          `)
          .order('nome')
          .range(offset, offset + batchSize - 1);

        if (profilesError) throw profilesError;

        if (profiles && profiles.length > 0) {
          allProfiles = [...allProfiles, ...profiles];
          offset += batchSize;
          hasMore = profiles.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      if (allProfiles.length === 0) {
        setUsuarios([]);
        return;
      }

      // Get roles for all fetched users (also handle batching for roles)
      const userIds = allProfiles.map(p => p.id);
      let allRoles: any[] = [];
      
      // Batch the role queries to avoid URL length limits
      const roleBatchSize = 100;
      for (let i = 0; i < userIds.length; i += roleBatchSize) {
        const batchIds = userIds.slice(i, i + roleBatchSize);
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', batchIds);

        if (rolesError) throw rolesError;
        if (roles) {
          allRoles = [...allRoles, ...roles];
        }
      }

      // Combine profiles with roles
      const usuariosWithRoles = allProfiles.map(profile => {
        const userRole = allRoles.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role || 'professor') as AppRole,
        };
      });
      
      setUsuarios(usuariosWithRoles as Usuario[]);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUsuarioRole = async (userId: string, role: AppRole) => {
    try {
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
      }
      
      toast.success('Role atualizada com sucesso!');
      await fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role: ' + error.message);
      throw error;
    }
  };

  const updateUsuario = async (id: string, input: Partial<UsuarioInput>) => {
    try {
      const { role, ...profileData } = input;
      
      if (Object.keys(profileData).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', id);

        if (error) throw error;
      }

      if (role) {
        await updateUsuarioRole(id, role);
      } else {
        toast.success('Usuário atualizado com sucesso!');
        await fetchUsuarios();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário: ' + error.message);
      throw error;
    }
  };

  const deleteUsuario = async (id: string) => {
    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Usuário excluído com sucesso!');
      await fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsuarios();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('usuarios-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsuarios();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        fetchUsuarios();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsuarios]);

  return {
    usuarios,
    isLoading,
    fetchUsuarios,
    updateUsuario,
    updateUsuarioRole,
    deleteUsuario,
  };
}