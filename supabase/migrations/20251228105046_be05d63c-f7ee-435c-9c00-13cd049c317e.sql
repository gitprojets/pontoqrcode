-- Índices para otimizar consultas frequentes

-- Índice para busca de registros por data (muito usado em relatórios)
CREATE INDEX IF NOT EXISTS idx_registros_frequencia_data_registro 
ON public.registros_frequencia (data_registro DESC);

-- Índice composto para busca de registros por professor e data
CREATE INDEX IF NOT EXISTS idx_registros_frequencia_professor_data 
ON public.registros_frequencia (professor_id, data_registro DESC);

-- Índice composto para busca de registros por unidade e data
CREATE INDEX IF NOT EXISTS idx_registros_frequencia_unidade_data 
ON public.registros_frequencia (unidade_id, data_registro DESC);

-- Índice para busca de escalas por semana
CREATE INDEX IF NOT EXISTS idx_escalas_trabalho_semana 
ON public.escalas_trabalho (semana_inicio DESC);

-- Índice composto para busca de escalas por professor e semana
CREATE INDEX IF NOT EXISTS idx_escalas_trabalho_professor_semana 
ON public.escalas_trabalho (professor_id, semana_inicio DESC);

-- Índice para busca de justificativas por status
CREATE INDEX IF NOT EXISTS idx_justificativas_status 
ON public.justificativas (status);

-- Índice composto para busca de justificativas por professor e data
CREATE INDEX IF NOT EXISTS idx_justificativas_professor_data 
ON public.justificativas (professor_id, data_inicio DESC);

-- Índice para busca de eventos por data
CREATE INDEX IF NOT EXISTS idx_school_events_data 
ON public.school_events (data_inicio DESC);

-- Índice para busca de tickets por status
CREATE INDEX IF NOT EXISTS idx_support_tickets_status 
ON public.support_tickets (status, created_at DESC);

-- Índice para busca de audit logs por data
CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
ON public.audit_logs (created_at DESC);

-- Índice para busca de audit logs por ação
CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON public.audit_logs (action, created_at DESC);

-- Índice para busca de profiles por unidade
CREATE INDEX IF NOT EXISTS idx_profiles_unidade 
ON public.profiles (unidade_id);

-- Habilitar Realtime para tabelas que ainda não estão
DO $$
BEGIN
  -- Apenas adiciona se ainda não estiver na publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'justificativas'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.justificativas';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'school_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.school_events';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'support_tickets'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets';
  END IF;
END $$;