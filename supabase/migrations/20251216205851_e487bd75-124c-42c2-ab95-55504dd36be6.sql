-- Add policy for coordinators to update justificativas in their unit
CREATE POLICY "Coordinators can update justificativas from their unit" 
ON public.justificativas 
FOR UPDATE 
USING (has_role(auth.uid(), 'coordenador'::app_role) AND unidade_id = get_user_unit_id(auth.uid()));