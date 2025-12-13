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

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 50,
    total: 0,
    hasMore: true,
  });

  const fetchUsuarios = useCallback(async (page = 0, pageSize = 50, append = false) => {
    try {
      setIsLoading(true);
      
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      // Get total count
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get profiles with pagination - specify relationship to avoid ambiguity
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          unidade:unidades!profiles_unidade_id_fkey(nome)
        `)
        .order('nome')
        .range(from, to);

      if (profilesError) throw profilesError;

      // Get roles for fetched users only
      const userIds = (profiles || []).map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usuariosWithRoles = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role || 'professor') as AppRole,
        };
      });
      
      if (append) {
        setUsuarios(prev => [...prev, ...usuariosWithRoles as Usuario[]]);
      } else {
        setUsuarios(usuariosWithRoles as Usuario[]);
      }

      setPagination({
        page,
        pageSize,
        total: count || 0,
        hasMore: (from + (profiles?.length || 0)) < (count || 0),
      });
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isLoading) {
      fetchUsuarios(pagination.page + 1, pagination.pageSize, true);
    }
  }, [fetchUsuarios, pagination, isLoading]);

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
      await fetchUsuarios(0, pagination.pageSize);
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
        await fetchUsuarios(0, pagination.pageSize);
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
      await fetchUsuarios(0, pagination.pageSize);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  return {
    usuarios,
    isLoading,
    pagination,
    fetchUsuarios,
    loadMore,
    updateUsuario,
    updateUsuarioRole,
    deleteUsuario,
  };
}
