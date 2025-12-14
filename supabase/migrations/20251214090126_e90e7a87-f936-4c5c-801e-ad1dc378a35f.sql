-- Enable realtime for dashboard-related tables
-- This allows the dashboard to update instantly when data changes

-- Add tables to realtime publication (excluding support_tickets which is already added)
DO $$
BEGIN
  -- Check and add profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  
  -- Check and add unidades
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'unidades'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.unidades;
  END IF;
  
  -- Check and add dispositivos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'dispositivos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dispositivos;
  END IF;
  
  -- Check and add registros_frequencia
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'registros_frequencia'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_frequencia;
  END IF;
  
  -- Check and add user_roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_roles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  END IF;
END $$;