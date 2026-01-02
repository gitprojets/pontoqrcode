-- =====================================================
-- CORREÇÃO 1: AUDIT_LOGS - Remover INSERT irrestrito
-- O INSERT só deve ser feito via função SECURITY DEFINER
-- =====================================================

-- Remover a policy problemática que permite INSERT para qualquer usuário
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Criar nova policy que só permite INSERT via service role (funções do sistema)
-- Como log_audit_event é SECURITY DEFINER, ela já bypassa RLS
-- Então precisamos de uma policy que não permite INSERT direto de usuários
CREATE POLICY "Only system functions can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (false);

-- =====================================================
-- CORREÇÃO 2: PROFILES - Criar função para retornar dados seguros
-- Mascarar email para roles não-privilegiados
-- =====================================================

-- Função para verificar se o usuário pode ver emails completos
CREATE OR REPLACE FUNCTION public.can_view_full_email(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- O próprio usuário
    _viewer_id = _profile_id
    -- Ou desenvolvedores
    OR has_role(_viewer_id, 'desenvolvedor')
    -- Ou administradores visualizando usuários de suas unidades
    OR (
      has_role(_viewer_id, 'administrador') 
      AND (SELECT unidade_id FROM profiles WHERE id = _profile_id) IN (SELECT get_admin_unit_ids(_viewer_id))
    )
$$;

-- =====================================================
-- CORREÇÃO 3: PUSH_SUBSCRIPTIONS - Adicionar UPDATE
-- =====================================================

CREATE POLICY "Users can update their own subscriptions" 
ON public.push_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CORREÇÃO 4: NOTIFICATION_LOGS - Permitir INSERT via sistema
-- =====================================================

CREATE POLICY "System can insert notification logs" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (false);

-- =====================================================
-- CORREÇÃO 5: Criar tabela para configurações do usuário
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configurações de notificações
  push_enabled boolean NOT NULL DEFAULT true,
  presence_alerts boolean NOT NULL DEFAULT true,
  reminders boolean NOT NULL DEFAULT true,
  email_summary boolean NOT NULL DEFAULT false,
  
  -- Configurações de aparência
  theme text DEFAULT 'system',
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- CORREÇÃO 6: Criar tabela para regras de presença por unidade
-- =====================================================

CREATE TABLE IF NOT EXISTS public.attendance_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id uuid NOT NULL UNIQUE REFERENCES public.unidades(id) ON DELETE CASCADE,
  
  -- Tolerâncias em minutos
  tolerancia_entrada integer NOT NULL DEFAULT 15,
  tolerancia_saida integer NOT NULL DEFAULT 10,
  
  -- Limites de correções
  max_correcoes_mes integer NOT NULL DEFAULT 3,
  prazo_correcao_dias integer NOT NULL DEFAULT 5,
  
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS para user_settings
-- =====================================================

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Developers can manage all settings" 
ON public.user_settings 
FOR ALL 
USING (has_role(auth.uid(), 'desenvolvedor'))
WITH CHECK (has_role(auth.uid(), 'desenvolvedor'));

-- =====================================================
-- RLS para attendance_rules
-- =====================================================

ALTER TABLE public.attendance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors can view their unit rules" 
ON public.attendance_rules 
FOR SELECT 
USING (
  has_role(auth.uid(), 'diretor') AND unidade_id = get_user_unit_id(auth.uid())
);

CREATE POLICY "Directors can manage their unit rules" 
ON public.attendance_rules 
FOR ALL 
USING (
  has_role(auth.uid(), 'diretor') AND unidade_id = get_user_unit_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'diretor') AND unidade_id = get_user_unit_id(auth.uid())
);

CREATE POLICY "Admins can view rules in their linked units" 
ON public.attendance_rules 
FOR SELECT 
USING (
  has_role(auth.uid(), 'administrador') AND unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
);

CREATE POLICY "Admins can manage rules in their linked units" 
ON public.attendance_rules 
FOR ALL 
USING (
  has_role(auth.uid(), 'administrador') AND unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'administrador') AND unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
);

CREATE POLICY "Developers can manage all rules" 
ON public.attendance_rules 
FOR ALL 
USING (has_role(auth.uid(), 'desenvolvedor'))
WITH CHECK (has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Professors can view their unit rules" 
ON public.attendance_rules 
FOR SELECT 
USING (unidade_id = get_user_unit_id(auth.uid()));

-- =====================================================
-- Triggers para updated_at
-- =====================================================

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_rules_updated_at
BEFORE UPDATE ON public.attendance_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Índices para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_rules_unidade_id ON public.attendance_rules(unidade_id);
CREATE INDEX IF NOT EXISTS idx_registros_frequencia_data ON public.registros_frequencia(data_registro);
CREATE INDEX IF NOT EXISTS idx_registros_frequencia_professor ON public.registros_frequencia(professor_id);
CREATE INDEX IF NOT EXISTS idx_registros_frequencia_unidade ON public.registros_frequencia(unidade_id);