-- Fix: Remove direct SELECT access for directors on dispositivos table
-- Directors should use get_dispositivos_safe() RPC which excludes api_key column

DROP POLICY IF EXISTS "Directors can view dispositivos in their unit" ON public.dispositivos;