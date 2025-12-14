-- Security Improvements Migration
-- 1. Protect API keys in dispositivos table - only developers can see them
-- 2. Restrict email visibility in profiles table
-- 3. Add SELECT policy for qr_nonces to prevent enumeration

-- Drop the existing unsafe view and recreate it with NO api_key column
DROP VIEW IF EXISTS public.dispositivos_safe;

CREATE VIEW public.dispositivos_safe AS
SELECT 
  id,
  nome,
  unidade_id,
  local,
  status,
  ultima_leitura,
  leituras_hoje,
  created_at,
  updated_at
FROM public.dispositivos;

-- Enable RLS on the view (views inherit the underlying table's RLS)
-- Note: Views automatically respect the RLS of the underlying table

-- Create a secure function to get API key - only for developers
CREATE OR REPLACE FUNCTION public.get_dispositivo_api_key(dispositivo_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT api_key 
  FROM public.dispositivos 
  WHERE id = dispositivo_id
    AND has_role(auth.uid(), 'desenvolvedor')
$$;

-- Add policy for professors to view only their own nonces (prevent enumeration)
DROP POLICY IF EXISTS "Professors can view their own nonces" ON public.qr_nonces;
CREATE POLICY "Professors can view their own nonces"
ON public.qr_nonces
FOR SELECT
USING (
  has_role(auth.uid(), 'professor') AND professor_id = auth.uid()
);

-- Create a secure view for profiles that hides email for non-privileged users
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  id,
  nome,
  CASE 
    WHEN has_role(auth.uid(), 'desenvolvedor') THEN email
    WHEN auth.uid() = id THEN email
    ELSE '***@***'
  END as email,
  matricula,
  unidade,
  unidade_id,
  foto,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the views
GRANT SELECT ON public.dispositivos_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO authenticated;