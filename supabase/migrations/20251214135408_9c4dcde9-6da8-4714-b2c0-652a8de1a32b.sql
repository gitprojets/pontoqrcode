-- Create junction table for admin-unidades relationship
CREATE TABLE public.admin_unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, unidade_id)
);

-- Enable RLS
ALTER TABLE public.admin_unidades ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin for a specific unit
CREATE OR REPLACE FUNCTION public.is_admin_for_unit(_user_id UUID, _unidade_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_unidades
    WHERE admin_id = _user_id AND unidade_id = _unidade_id
  )
$$;

-- Create function to get all units an admin has access to
CREATE OR REPLACE FUNCTION public.get_admin_unit_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unidade_id FROM public.admin_unidades WHERE admin_id = _user_id
$$;

-- RLS policies for admin_unidades
CREATE POLICY "Developers can manage all admin_unidades"
ON public.admin_unidades FOR ALL
USING (has_role(auth.uid(), 'desenvolvedor'))
WITH CHECK (has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Admins can view their own unit assignments"
ON public.admin_unidades FOR SELECT
USING (has_role(auth.uid(), 'administrador') AND admin_id = auth.uid());

CREATE POLICY "Require authentication for admin_unidades"
ON public.admin_unidades FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Update profiles policy for admins to only see users in their linked units
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view profiles in their linked units"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'administrador') AND (
    id = auth.uid() OR
    unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
  )
);

-- Update registros_frequencia for admins
DROP POLICY IF EXISTS "Admins can manage all registros" ON public.registros_frequencia;
CREATE POLICY "Admins can view registros in their linked units"
ON public.registros_frequencia FOR SELECT
USING (
  has_role(auth.uid(), 'administrador') AND
  unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
);

-- Update escalas_trabalho - remove director access, admin only
DROP POLICY IF EXISTS "Directors can manage escalas in their unit" ON public.escalas_trabalho;
CREATE POLICY "Admins can manage escalas in their linked units"
ON public.escalas_trabalho FOR ALL
USING (
  has_role(auth.uid(), 'administrador') AND
  unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'administrador') AND
  unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
);

-- Update unidades policy for admins
DROP POLICY IF EXISTS "Admins can manage all unidades" ON public.unidades;
CREATE POLICY "Admins can view their linked units"
ON public.unidades FOR SELECT
USING (
  has_role(auth.uid(), 'administrador') AND
  id IN (SELECT get_admin_unit_ids(auth.uid()))
);

-- Admins can update profiles in their linked units
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles in their linked units"
ON public.profiles FOR UPDATE
USING (
  has_role(auth.uid(), 'administrador') AND
  unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
);

-- Directors can only view registros (not manage)
DROP POLICY IF EXISTS "Directors can manage registros in their unit" ON public.registros_frequencia;
CREATE POLICY "Directors can manage registros in their unit"
ON public.registros_frequencia FOR ALL
USING (
  has_role(auth.uid(), 'diretor') AND
  unidade_id = get_user_unit_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'diretor') AND
  unidade_id = get_user_unit_id(auth.uid())
);