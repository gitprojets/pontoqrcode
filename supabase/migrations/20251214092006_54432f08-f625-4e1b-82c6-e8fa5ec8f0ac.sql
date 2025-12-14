-- Fix: Replace dispositivos_safe view with a SECURITY INVOKER function
-- This ensures RLS policies on the underlying dispositivos table are respected

-- Drop the existing view
DROP VIEW IF EXISTS public.dispositivos_safe;

-- Create a function that respects RLS (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.get_dispositivos_safe()
RETURNS TABLE (
  id uuid,
  nome text,
  unidade_id uuid,
  local text,
  status text,
  ultima_leitura timestamptz,
  leituras_hoje int,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id, nome, unidade_id, local, status, ultima_leitura, 
         leituras_hoje, created_at, updated_at
  FROM dispositivos;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dispositivos_safe() TO authenticated;