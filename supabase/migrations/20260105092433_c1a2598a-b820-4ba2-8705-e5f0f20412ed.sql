-- Corrigir Security Definer View issue
-- Remover a view e criar uma abordagem baseada em função

-- Dropar a view problemática
DROP VIEW IF EXISTS public.audit_logs_masked;

-- Criar uma função que retorna os logs mascarados
-- Esta abordagem é mais segura que uma view SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_audit_logs_masked(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_action_filter text DEFAULT NULL,
  p_table_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  action text,
  table_name text,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  user_agent text,
  ip_address text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_developer boolean;
BEGIN
  -- Verificar se o usuário pode acessar audit logs
  IF NOT (public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'administrador')) THEN
    RAISE EXCEPTION 'Acesso negado aos logs de auditoria';
  END IF;
  
  -- Verificar se é desenvolvedor (tem acesso completo)
  is_developer := public.has_role(auth.uid(), 'desenvolvedor');
  
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    al.action,
    al.table_name,
    al.record_id,
    -- Aplicar máscara se não for desenvolvedor
    CASE 
      WHEN is_developer THEN al.old_data
      ELSE public.mask_sensitive_data(al.old_data)
    END,
    CASE 
      WHEN is_developer THEN al.new_data
      ELSE public.mask_sensitive_data(al.new_data)
    END,
    al.user_agent,
    al.ip_address,
    al.created_at
  FROM public.audit_logs al
  WHERE 
    (p_action_filter IS NULL OR al.action ILIKE '%' || p_action_filter || '%')
    AND (p_table_filter IS NULL OR al.table_name ILIKE '%' || p_table_filter || '%')
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Função para contar total de logs (para paginação)
CREATE OR REPLACE FUNCTION public.count_audit_logs(
  p_action_filter text DEFAULT NULL,
  p_table_filter text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário pode acessar audit logs
  IF NOT (public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'administrador')) THEN
    RAISE EXCEPTION 'Acesso negado aos logs de auditoria';
  END IF;
  
  RETURN (
    SELECT COUNT(*)
    FROM public.audit_logs al
    WHERE 
      (p_action_filter IS NULL OR al.action ILIKE '%' || p_action_filter || '%')
      AND (p_table_filter IS NULL OR al.table_name ILIKE '%' || p_table_filter || '%')
  );
END;
$$;