-- ============================================
-- FrequênciaQR - Schema Consolidado
-- Gerado em: 2026-01-10
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para criar toda a estrutura do banco de dados
-- ============================================

-- ============================================
-- 1. EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TIPOS ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('professor', 'diretor', 'administrador', 'desenvolvedor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. TABELAS PRINCIPAIS
-- ============================================

-- Unidades (escolas)
CREATE TABLE IF NOT EXISTS public.unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles (perfis de usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  matricula TEXT,
  telefone TEXT,
  cargo TEXT,
  unidade_id UUID REFERENCES public.unidades(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Roles (papéis dos usuários)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'professor',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Admin Unidades (relação admin-unidade)
CREATE TABLE IF NOT EXISTS public.admin_unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, unidade_id)
);

-- Dispositivos (leitores QR)
CREATE TABLE IF NOT EXISTS public.dispositivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  unidade_id UUID REFERENCES public.unidades(id),
  local TEXT,
  status TEXT DEFAULT 'ativo',
  ultima_leitura TIMESTAMP WITH TIME ZONE,
  leituras_hoje INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dispositivo API Keys (chaves criptografadas)
CREATE TABLE IF NOT EXISTS public.dispositivo_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispositivo_id UUID NOT NULL UNIQUE REFERENCES public.dispositivos(id) ON DELETE CASCADE,
  encrypted_key BYTEA NOT NULL,
  key_hint TEXT,
  created_by UUID,
  rotated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  rotation_interval_days INTEGER DEFAULT 90,
  next_rotation_at TIMESTAMP WITH TIME ZONE,
  rotation_notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registros de Frequência
CREATE TABLE IF NOT EXISTS public.registros_frequencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  unidade_id UUID REFERENCES public.unidades(id),
  dispositivo_id UUID REFERENCES public.dispositivos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  localizacao_lat DECIMAL,
  localizacao_lng DECIMAL,
  ip_address TEXT,
  user_agent TEXT,
  metodo TEXT DEFAULT 'qrcode',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Escalas de Trabalho
CREATE TABLE IF NOT EXISTS public.escalas_trabalho (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  unidade_id UUID REFERENCES public.unidades(id),
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_entrada TIME NOT NULL,
  hora_saida TIME NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Justificativas
CREATE TABLE IF NOT EXISTS public.justificativas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  arquivo_url TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  aprovado_por UUID,
  aprovado_em TIMESTAMP WITH TIME ZONE,
  observacao_aprovador TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attendance Rules (regras de frequência)
CREATE TABLE IF NOT EXISTS public.attendance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES public.unidades(id),
  nome TEXT NOT NULL,
  tolerancia_minutos INTEGER DEFAULT 15,
  horas_trabalho_dia DECIMAL DEFAULT 8,
  permite_hora_extra BOOLEAN DEFAULT false,
  limite_hora_extra INTEGER DEFAULT 2,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- School Events (eventos escolares)
CREATE TABLE IF NOT EXISTS public.school_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES public.unidades(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('feriado', 'recesso', 'evento', 'reuniao', 'outro')),
  afeta_frequencia BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QR Nonces (tokens temporários)
CREATE TABLE IF NOT EXISTS public.qr_nonces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce TEXT NOT NULL UNIQUE,
  dispositivo_id UUID REFERENCES public.dispositivos(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Notification Logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  status TEXT DEFAULT 'enviado',
  erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Notifications
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email_to TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'pendente',
  sent_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  prioridade TEXT DEFAULT 'media',
  status TEXT DEFAULT 'aberto',
  resposta TEXT,
  respondido_por UUID,
  respondido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 4. ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_unidade ON public.profiles(unidade_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_usuario ON public.registros_frequencia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_registros_data ON public.registros_frequencia(data_hora);
CREATE INDEX IF NOT EXISTS idx_registros_unidade ON public.registros_frequencia(unidade_id);
CREATE INDEX IF NOT EXISTS idx_escalas_usuario ON public.escalas_trabalho(usuario_id);
CREATE INDEX IF NOT EXISTS idx_justificativas_usuario ON public.justificativas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_justificativas_data ON public.justificativas(data);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_qr_nonces_expires ON public.qr_nonces(expires_at);

-- ============================================
-- 5. FUNÇÕES DO BANCO
-- ============================================

-- Função: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função: get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'desenvolvedor' THEN 1
      WHEN 'administrador' THEN 2 
      WHEN 'diretor' THEN 3 
      WHEN 'professor' THEN 4 
    END
  LIMIT 1
$$;

-- Função: get_user_unit_id
CREATE OR REPLACE FUNCTION public.get_user_unit_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT unidade_id FROM profiles WHERE id = user_id;
$$;

-- Função: is_admin_for_unit
CREATE OR REPLACE FUNCTION public.is_admin_for_unit(_user_id uuid, _unidade_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_unidades
    WHERE admin_id = _user_id AND unidade_id = _unidade_id
  )
$$;

-- Função: get_admin_unit_ids
CREATE OR REPLACE FUNCTION public.get_admin_unit_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT unidade_id FROM public.admin_unidades WHERE admin_id = _user_id
$$;

-- Função: can_view_full_email
CREATE OR REPLACE FUNCTION public.can_view_full_email(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    _viewer_id = _profile_id
    OR has_role(_viewer_id, 'desenvolvedor')
    OR (
      has_role(_viewer_id, 'administrador') 
      AND (SELECT unidade_id FROM profiles WHERE id = _profile_id) IN (SELECT get_admin_unit_ids(_viewer_id))
    )
$$;

-- Função: log_audit_event
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text, 
  _table_name text DEFAULT NULL, 
  _record_id text DEFAULT NULL, 
  _old_data jsonb DEFAULT NULL, 
  _new_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    new_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), _action, _table_name, _record_id, _old_data, _new_data)
    RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$;

-- Função: mask_sensitive_data
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb := data;
  sensitive_keys text[] := ARRAY[
    'email', 'telefone', 'phone', 'password', 'senha', 
    'api_key', 'apikey', 'secret', 'token', 'matricula',
    'cpf', 'rg', 'endereco', 'address', 'credit_card',
    'auth', 'p256dh', 'endpoint'
  ];
  key_name text;
  key_value text;
BEGIN
  IF data IS NULL THEN
    RETURN NULL;
  END IF;
  
  FOR key_name IN SELECT jsonb_object_keys(data)
  LOOP
    IF key_name = ANY(sensitive_keys) THEN
      key_value := data->>key_name;
      IF key_value IS NOT NULL AND length(key_value) > 0 THEN
        IF key_name IN ('email') AND key_value LIKE '%@%' THEN
          result := jsonb_set(result, ARRAY[key_name], 
            to_jsonb(substring(key_value, 1, 2) || '***@***.***'));
        ELSIF key_name IN ('telefone', 'phone') THEN
          result := jsonb_set(result, ARRAY[key_name], 
            to_jsonb('***-' || right(regexp_replace(key_value, '[^0-9]', '', 'g'), 4)));
        ELSIF key_name IN ('matricula') THEN
          result := jsonb_set(result, ARRAY[key_name], 
            to_jsonb('***' || right(key_value, 3)));
        ELSE
          result := jsonb_set(result, ARRAY[key_name], to_jsonb('[MASKED]'));
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Função: get_audit_logs_masked
CREATE OR REPLACE FUNCTION public.get_audit_logs_masked(
  p_limit integer DEFAULT 100, 
  p_offset integer DEFAULT 0, 
  p_action_filter text DEFAULT NULL, 
  p_table_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  action text, 
  table_name text, 
  record_id text, 
  old_data jsonb, 
  new_data jsonb, 
  user_agent text, 
  ip_address text, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_developer boolean;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'administrador')) THEN
    RAISE EXCEPTION 'Acesso negado aos logs de auditoria';
  END IF;
  
  is_developer := public.has_role(auth.uid(), 'desenvolvedor');
  
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    al.action,
    al.table_name,
    al.record_id,
    CASE WHEN is_developer THEN al.old_data ELSE public.mask_sensitive_data(al.old_data) END,
    CASE WHEN is_developer THEN al.new_data ELSE public.mask_sensitive_data(al.new_data) END,
    al.user_agent,
    al.ip_address,
    al.created_at
  FROM public.audit_logs al
  WHERE 
    (p_action_filter IS NULL OR al.action ILIKE '%' || p_action_filter || '%')
    AND (p_table_filter IS NULL OR al.table_name ILIKE '%' || p_table_filter || '%')
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Função: count_audit_logs
CREATE OR REPLACE FUNCTION public.count_audit_logs(
  p_action_filter text DEFAULT NULL, 
  p_table_filter text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'desenvolvedor') OR public.has_role(auth.uid(), 'administrador')) THEN
    RAISE EXCEPTION 'Acesso negado aos logs de auditoria';
  END IF;
  
  RETURN (
    SELECT COUNT(*)
    FROM public.audit_logs al
    WHERE 
      (p_action_filter IS NULL OR al.action ILIKE '%' || p_action_filter || '%')
      AND (p_table_filter IS NULL OR al.table_name ILIKE '%' || p_table_filter || '%')
  );
END;
$$;

-- Função: cleanup_expired_nonces
CREATE OR REPLACE FUNCTION public.cleanup_expired_nonces()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.qr_nonces WHERE expires_at < now();
$$;

-- Função: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Função: handle_new_user (trigger para auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'professor');
  
  RETURN NEW;
END;
$$;

-- Função: get_dispositivos_safe
CREATE OR REPLACE FUNCTION public.get_dispositivos_safe()
RETURNS TABLE(
  id uuid, 
  nome text, 
  unidade_id uuid, 
  local text, 
  status text, 
  ultima_leitura timestamp with time zone, 
  leituras_hoje integer, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT id, nome, unidade_id, local, status, ultima_leitura, 
         leituras_hoje, created_at, updated_at
  FROM dispositivos;
$$;

-- Função: get_decrypted_api_key
CREATE OR REPLACE FUNCTION public.get_decrypted_api_key(p_dispositivo_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_encrypted_key bytea;
  v_encryption_key text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'desenvolvedor') THEN
    RAISE EXCEPTION 'Acesso negado: apenas desenvolvedores podem acessar API keys';
  END IF;
  
  v_encryption_key := current_setting('app.encryption_key', true);
  
  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    v_encryption_key := 'default_dev_key_change_in_production';
  END IF;
  
  SELECT encrypted_key INTO v_encrypted_key
  FROM public.dispositivo_api_keys
  WHERE dispositivo_id = p_dispositivo_id;
  
  IF v_encrypted_key IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(v_encrypted_key, v_encryption_key);
END;
$$;

-- Função: set_encrypted_api_key
CREATE OR REPLACE FUNCTION public.set_encrypted_api_key(p_dispositivo_id uuid, p_api_key text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_encryption_key text;
  v_key_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'desenvolvedor') THEN
    RAISE EXCEPTION 'Acesso negado: apenas desenvolvedores podem gerenciar API keys';
  END IF;
  
  v_encryption_key := current_setting('app.encryption_key', true);
  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    v_encryption_key := 'default_dev_key_change_in_production';
  END IF;
  
  INSERT INTO public.dispositivo_api_keys (dispositivo_id, encrypted_key, key_hint, created_by)
  VALUES (
    p_dispositivo_id,
    pgp_sym_encrypt(p_api_key, v_encryption_key),
    right(p_api_key, 4),
    auth.uid()
  )
  ON CONFLICT (dispositivo_id) DO UPDATE SET
    encrypted_key = pgp_sym_encrypt(p_api_key, v_encryption_key),
    key_hint = right(p_api_key, 4),
    rotated_at = now()
  RETURNING id INTO v_key_id;
  
  RETURN v_key_id;
END;
$$;

-- Função: rotate_api_key
CREATE OR REPLACE FUNCTION public.rotate_api_key(p_dispositivo_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_key TEXT;
  v_encryption_key TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'desenvolvedor') THEN
    RAISE EXCEPTION 'Apenas desenvolvedores podem rotacionar API keys';
  END IF;

  v_new_key := gen_random_uuid()::text;
  
  v_encryption_key := current_setting('app.encryption_key', true);
  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    v_encryption_key := 'default-dev-key-change-in-production';
  END IF;

  UPDATE public.dispositivo_api_keys
  SET 
    encrypted_key = pgp_sym_encrypt(v_new_key, v_encryption_key)::bytea,
    key_hint = substring(v_new_key from 1 for 8) || '...',
    rotated_at = now(),
    next_rotation_at = now() + (rotation_interval_days || ' days')::interval,
    rotation_notification_sent = false
  WHERE dispositivo_id = p_dispositivo_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispositivo não encontrado';
  END IF;

  RETURN v_new_key;
END;
$$;

-- Função: get_devices_pending_rotation
CREATE OR REPLACE FUNCTION public.get_devices_pending_rotation()
RETURNS TABLE(
  dispositivo_id uuid, 
  dispositivo_nome text, 
  unidade_id uuid, 
  next_rotation_at timestamp with time zone, 
  days_until_rotation integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'desenvolvedor') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT 
    dak.dispositivo_id,
    d.nome::text as dispositivo_nome,
    d.unidade_id,
    dak.next_rotation_at,
    EXTRACT(DAY FROM (dak.next_rotation_at - now()))::integer as days_until_rotation
  FROM public.dispositivo_api_keys dak
  JOIN public.dispositivos d ON d.id = dak.dispositivo_id
  WHERE dak.next_rotation_at IS NOT NULL
  ORDER BY dak.next_rotation_at ASC;
END;
$$;

-- Função: mark_rotation_notification_sent
CREATE OR REPLACE FUNCTION public.mark_rotation_notification_sent(p_dispositivo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.dispositivo_api_keys
  SET rotation_notification_sent = true
  WHERE dispositivo_id = p_dispositivo_id;
END;
$$;

-- Função: admin_create_user
CREATE OR REPLACE FUNCTION public.admin_create_user(
  _email text, 
  _password text, 
  _nome text, 
  _role app_role DEFAULT 'professor', 
  _unidade_id uuid DEFAULT NULL, 
  _matricula text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  IF NOT (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'desenvolvedor')) THEN
    RAISE EXCEPTION 'Apenas administradores e desenvolvedores podem criar usuários';
  END IF;

  new_user_id := gen_random_uuid();
  
  INSERT INTO public.profiles (id, nome, email, matricula, unidade_id)
  VALUES (new_user_id, _nome, _email, _matricula, _unidade_id);
  
  DELETE FROM public.user_roles WHERE user_id = new_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, _role);
  
  RETURN new_user_id;
END;
$$;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Trigger: update_updated_at para tabelas
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_unidades_updated_at
  BEFORE UPDATE ON public.unidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_dispositivos_updated_at
  BEFORE UPDATE ON public.dispositivos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_escalas_updated_at
  BEFORE UPDATE ON public.escalas_trabalho
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_justificativas_updated_at
  BEFORE UPDATE ON public.justificativas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_attendance_rules_updated_at
  BEFORE UPDATE ON public.attendance_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_school_events_updated_at
  BEFORE UPDATE ON public.school_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: handle_new_user (para auth.users)
-- NOTA: Este trigger deve ser criado manualmente após a migração
-- pois requer acesso ao schema auth
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. HABILITAR RLS
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivo_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_frequencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalas_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.justificativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. POLÍTICAS RLS
-- ============================================

-- PROFILES
CREATE POLICY "Profiles são visíveis para usuários autenticados"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins podem atualizar perfis da sua unidade"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    AND unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
  );

CREATE POLICY "Desenvolvedores podem gerenciar todos os perfis"
  ON public.profiles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- USER_ROLES
CREATE POLICY "Usuários podem ver seus próprios roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins e devs podem ver todos os roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    OR has_role(auth.uid(), 'desenvolvedor')
  );

CREATE POLICY "Desenvolvedores podem gerenciar roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- UNIDADES
CREATE POLICY "Unidades são visíveis para autenticados"
  ON public.unidades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar suas unidades"
  ON public.unidades FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    AND id IN (SELECT get_admin_unit_ids(auth.uid()))
  );

CREATE POLICY "Desenvolvedores podem gerenciar todas unidades"
  ON public.unidades FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- ADMIN_UNIDADES
CREATE POLICY "Admins podem ver suas associações"
  ON public.admin_unidades FOR SELECT
  TO authenticated
  USING (admin_id = auth.uid());

CREATE POLICY "Desenvolvedores podem gerenciar admin_unidades"
  ON public.admin_unidades FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- DISPOSITIVOS
CREATE POLICY "Dispositivos visíveis para autenticados"
  ON public.dispositivos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar dispositivos da unidade"
  ON public.dispositivos FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    AND unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
  );

CREATE POLICY "Desenvolvedores podem gerenciar todos dispositivos"
  ON public.dispositivos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- DISPOSITIVO_API_KEYS
CREATE POLICY "Apenas desenvolvedores podem ver API keys"
  ON public.dispositivo_api_keys FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Apenas desenvolvedores podem gerenciar API keys"
  ON public.dispositivo_api_keys FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- REGISTROS_FREQUENCIA
CREATE POLICY "Usuários podem ver seus próprios registros"
  ON public.registros_frequencia FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Admins podem ver registros da sua unidade"
  ON public.registros_frequencia FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    AND unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
  );

CREATE POLICY "Diretores podem ver registros da sua unidade"
  ON public.registros_frequencia FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'diretor') 
    AND unidade_id = get_user_unit_id(auth.uid())
  );

CREATE POLICY "Desenvolvedores podem ver todos registros"
  ON public.registros_frequencia FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Usuários podem inserir seus registros"
  ON public.registros_frequencia FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- ESCALAS_TRABALHO
CREATE POLICY "Usuários podem ver suas escalas"
  ON public.escalas_trabalho FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Admins podem gerenciar escalas da unidade"
  ON public.escalas_trabalho FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    AND unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
  );

CREATE POLICY "Diretores podem gerenciar escalas da unidade"
  ON public.escalas_trabalho FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'diretor') 
    AND unidade_id = get_user_unit_id(auth.uid())
  );

CREATE POLICY "Desenvolvedores podem gerenciar todas escalas"
  ON public.escalas_trabalho FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- JUSTIFICATIVAS
CREATE POLICY "Usuários podem ver suas justificativas"
  ON public.justificativas FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem criar justificativas"
  ON public.justificativas FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admins podem ver justificativas da unidade"
  ON public.justificativas FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    AND usuario_id IN (
      SELECT id FROM profiles 
      WHERE unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins podem aprovar justificativas"
  ON public.justificativas FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    AND usuario_id IN (
      SELECT id FROM profiles 
      WHERE unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
    )
  );

CREATE POLICY "Desenvolvedores podem gerenciar justificativas"
  ON public.justificativas FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- ATTENDANCE_RULES
CREATE POLICY "Regras visíveis para autenticados"
  ON public.attendance_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar regras da unidade"
  ON public.attendance_rules FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    AND unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
  );

CREATE POLICY "Desenvolvedores podem gerenciar todas regras"
  ON public.attendance_rules FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- SCHOOL_EVENTS
CREATE POLICY "Eventos visíveis para autenticados"
  ON public.school_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar eventos da unidade"
  ON public.school_events FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    AND unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
  );

CREATE POLICY "Diretores podem gerenciar eventos da unidade"
  ON public.school_events FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'diretor') 
    AND unidade_id = get_user_unit_id(auth.uid())
  );

CREATE POLICY "Desenvolvedores podem gerenciar todos eventos"
  ON public.school_events FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'desenvolvedor'));

-- QR_NONCES
CREATE POLICY "Nonces acessíveis para autenticados"
  ON public.qr_nonces FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sistema pode criar nonces"
  ON public.qr_nonces FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar nonces"
  ON public.qr_nonces FOR UPDATE
  TO authenticated
  USING (true);

-- PUSH_SUBSCRIPTIONS
CREATE POLICY "Usuários podem ver suas subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem gerenciar suas subscriptions"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- NOTIFICATION_LOGS
CREATE POLICY "Usuários podem ver suas notificações"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins e devs podem ver todas notificações"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    OR has_role(auth.uid(), 'desenvolvedor')
  );

-- EMAIL_NOTIFICATIONS
CREATE POLICY "Admins e devs podem ver emails"
  ON public.email_notifications FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    OR has_role(auth.uid(), 'desenvolvedor')
  );

-- SUPPORT_TICKETS
CREATE POLICY "Usuários podem ver seus tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins e devs podem ver todos tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    OR has_role(auth.uid(), 'desenvolvedor')
  );

CREATE POLICY "Admins e devs podem gerenciar tickets"
  ON public.support_tickets FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    OR has_role(auth.uid(), 'desenvolvedor')
  );

-- AUDIT_LOGS
CREATE POLICY "Admins e devs podem ver audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'administrador') 
    OR has_role(auth.uid(), 'desenvolvedor')
  );

CREATE POLICY "Sistema pode inserir audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- USER_SETTINGS
CREATE POLICY "Usuários podem ver suas configurações"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem gerenciar suas configurações"
  ON public.user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 9. STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('justificativas', 'justificativas', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Usuários podem upload de justificativas"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'justificativas' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem ver suas justificativas"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'justificativas' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins podem ver justificativas da unidade"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'justificativas' 
    AND (
      has_role(auth.uid(), 'administrador') 
      OR has_role(auth.uid(), 'desenvolvedor')
    )
  );

-- ============================================
-- 10. TRIGGER PARA NOVOS USUÁRIOS
-- ============================================
-- Execute este comando separadamente após verificar
-- que o trigger não existe:
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FIM DO SCRIPT
-- ============================================
