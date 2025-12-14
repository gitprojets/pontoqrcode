-- Fix Security Definer View warnings by dropping the problematic view
-- and using a different approach with RLS policies

-- Drop the profiles_safe view that has security definer issues
DROP VIEW IF EXISTS public.profiles_safe;

-- The dispositivos_safe view is simpler and doesn't use security definer functions
-- It just omits the api_key column, which is the correct approach

-- Recreate dispositivos_safe as a simple view without security definer
DROP VIEW IF EXISTS public.dispositivos_safe;
CREATE VIEW public.dispositivos_safe 
WITH (security_invoker = true) AS
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

-- Grant select on the view to authenticated users
GRANT SELECT ON public.dispositivos_safe TO authenticated;