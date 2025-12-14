-- Additional Security Fixes
-- 1. Fix dispositivos RLS to only allow developers to see API keys (directors use the safe view)
-- 2. Add more restrictive policies for qr_nonces to limit directors to their unit
-- 3. Limit professors to view only their assigned unit

-- Update directors policy on dispositivos to restrict to their unit only
DROP POLICY IF EXISTS "Directors can view dispositivos in their unit" ON public.dispositivos;
CREATE POLICY "Directors can view dispositivos in their unit"
ON public.dispositivos
FOR SELECT
USING (
  has_role(auth.uid(), 'diretor') AND 
  unidade_id = get_user_unit_id(auth.uid())
);

-- Update qr_nonces policies for directors - restrict to their unit
DROP POLICY IF EXISTS "Directors can manage nonces" ON public.qr_nonces;
CREATE POLICY "Directors can manage nonces in their unit"
ON public.qr_nonces
FOR ALL
USING (
  has_role(auth.uid(), 'diretor') AND 
  professor_id IN (
    SELECT id FROM public.profiles 
    WHERE unidade_id = get_user_unit_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'diretor') AND 
  professor_id IN (
    SELECT id FROM public.profiles 
    WHERE unidade_id = get_user_unit_id(auth.uid())
  )
);

-- Update professors policy on unidades - they can only view their own unit
DROP POLICY IF EXISTS "Professors can view unidades" ON public.unidades;
CREATE POLICY "Professors can view their unit"
ON public.unidades
FOR SELECT
USING (
  has_role(auth.uid(), 'professor') AND 
  id = get_user_unit_id(auth.uid())
);