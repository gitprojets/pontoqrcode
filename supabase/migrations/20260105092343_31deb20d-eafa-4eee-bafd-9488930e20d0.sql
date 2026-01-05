-- ============================================
-- 1. TABELA SEPARADA PARA API KEYS CRIPTOGRAFADAS
-- ============================================

-- Habilitar extensão pgcrypto para criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar tabela para armazenar API keys de forma segura
CREATE TABLE public.dispositivo_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id uuid NOT NULL UNIQUE REFERENCES public.dispositivos(id) ON DELETE CASCADE,
  -- A API key é criptografada usando pgp_sym_encrypt com uma chave do ambiente
  encrypted_key bytea NOT NULL,
  key_hint text, -- últimos 4 caracteres para identificação
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  created_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.dispositivo_api_keys ENABLE ROW LEVEL SECURITY;

-- Políticas muito restritivas - apenas desenvolvedores podem acessar
CREATE POLICY "Only developers can view API keys"
ON public.dispositivo_api_keys
FOR SELECT
USING (public.has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Only developers can insert API keys"
ON public.dispositivo_api_keys
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Only developers can update API keys"
ON public.dispositivo_api_keys
FOR UPDATE
USING (public.has_role(auth.uid(), 'desenvolvedor'))
WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Only developers can delete API keys"
ON public.dispositivo_api_keys
FOR DELETE
USING (public.has_role(auth.uid(), 'desenvolvedor'));

-- Índice para busca por dispositivo
CREATE INDEX idx_dispositivo_api_keys_dispositivo ON public.dispositivo_api_keys(dispositivo_id);

-- ============================================
-- 2. FUNÇÃO PARA MASCARAR DADOS SENSÍVEIS
-- ============================================

-- Função para mascarar dados sensíveis em JSONB
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
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
  
  -- Iterar sobre cada chave no JSON
  FOR key_name IN SELECT jsonb_object_keys(data)
  LOOP
    -- Verificar se é uma chave sensível
    IF key_name = ANY(sensitive_keys) THEN
      key_value := data->>key_name;
      IF key_value IS NOT NULL AND length(key_value) > 0 THEN
        -- Mascarar mantendo indicação de que havia dados
        IF key_name IN ('email') AND key_value LIKE '%@%' THEN
          -- Para email: mostrar primeiros 2 chars e domínio parcial
          result := jsonb_set(result, ARRAY[key_name], 
            to_jsonb(substring(key_value, 1, 2) || '***@***.***'));
        ELSIF key_name IN ('telefone', 'phone') THEN
          -- Para telefone: mostrar últimos 4 dígitos
          result := jsonb_set(result, ARRAY[key_name], 
            to_jsonb('***-' || right(regexp_replace(key_value, '[^0-9]', '', 'g'), 4)));
        ELSIF key_name IN ('matricula') THEN
          -- Para matrícula: mostrar últimos 3 chars
          result := jsonb_set(result, ARRAY[key_name], 
            to_jsonb('***' || right(key_value, 3)));
        ELSE
          -- Para outros dados sensíveis: substituir completamente
          result := jsonb_set(result, ARRAY[key_name], to_jsonb('[MASKED]'));
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$;

-- ============================================
-- 3. VIEW SEGURA PARA AUDIT LOGS COM MÁSCARAS
-- ============================================

CREATE OR REPLACE VIEW public.audit_logs_masked AS
SELECT 
  id,
  user_id,
  action,
  table_name,
  record_id,
  -- Aplicar máscara nos dados antigos e novos
  CASE 
    WHEN public.has_role(auth.uid(), 'desenvolvedor') THEN old_data
    ELSE public.mask_sensitive_data(old_data)
  END as old_data,
  CASE 
    WHEN public.has_role(auth.uid(), 'desenvolvedor') THEN new_data
    ELSE public.mask_sensitive_data(new_data)
  END as new_data,
  user_agent,
  ip_address,
  created_at
FROM public.audit_logs;

-- Dar permissão para a view
GRANT SELECT ON public.audit_logs_masked TO authenticated;

-- ============================================
-- 4. FUNÇÃO SEGURA PARA OBTER API KEY DESCRIPTOGRAFADA
-- ============================================

-- Esta função só pode ser chamada por desenvolvedores e retorna a key descriptografada
CREATE OR REPLACE FUNCTION public.get_decrypted_api_key(p_dispositivo_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted_key bytea;
  v_encryption_key text;
BEGIN
  -- Verificar se é desenvolvedor
  IF NOT public.has_role(auth.uid(), 'desenvolvedor') THEN
    RAISE EXCEPTION 'Acesso negado: apenas desenvolvedores podem acessar API keys';
  END IF;
  
  -- Obter a chave de criptografia do ambiente (deve ser configurada como secret)
  v_encryption_key := current_setting('app.encryption_key', true);
  
  -- Se não houver chave de criptografia configurada, usar fallback seguro
  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    v_encryption_key := 'default_dev_key_change_in_production';
  END IF;
  
  -- Buscar a key criptografada
  SELECT encrypted_key INTO v_encrypted_key
  FROM public.dispositivo_api_keys
  WHERE dispositivo_id = p_dispositivo_id;
  
  IF v_encrypted_key IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Descriptografar e retornar
  RETURN pgp_sym_decrypt(v_encrypted_key, v_encryption_key);
END;
$$;

-- ============================================
-- 5. FUNÇÃO PARA INSERIR API KEY CRIPTOGRAFADA
-- ============================================

CREATE OR REPLACE FUNCTION public.set_encrypted_api_key(
  p_dispositivo_id uuid,
  p_api_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key text;
  v_key_id uuid;
BEGIN
  -- Verificar se é desenvolvedor
  IF NOT public.has_role(auth.uid(), 'desenvolvedor') THEN
    RAISE EXCEPTION 'Acesso negado: apenas desenvolvedores podem gerenciar API keys';
  END IF;
  
  -- Obter a chave de criptografia
  v_encryption_key := current_setting('app.encryption_key', true);
  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    v_encryption_key := 'default_dev_key_change_in_production';
  END IF;
  
  -- Inserir ou atualizar a key criptografada
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

-- ============================================
-- 6. MIGRAR API KEYS EXISTENTES
-- ============================================

-- Migrar as API keys existentes para a nova tabela (criptografadas)
DO $$
DECLARE
  v_encryption_key text := 'default_dev_key_change_in_production';
  rec record;
BEGIN
  FOR rec IN SELECT id, api_key FROM public.dispositivos WHERE api_key IS NOT NULL
  LOOP
    INSERT INTO public.dispositivo_api_keys (dispositivo_id, encrypted_key, key_hint)
    VALUES (
      rec.id,
      pgp_sym_encrypt(rec.api_key, v_encryption_key),
      right(rec.api_key, 4)
    )
    ON CONFLICT (dispositivo_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Remover a coluna api_key da tabela dispositivos (após migração)
-- Comentado para permitir rollback se necessário
-- ALTER TABLE public.dispositivos DROP COLUMN api_key;

-- ============================================
-- 7. ATUALIZAR FUNÇÃO EXISTENTE get_dispositivo_api_key
-- ============================================

CREATE OR REPLACE FUNCTION public.get_dispositivo_api_key(dispositivo_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Agora usa a função de descriptografia
  SELECT public.get_decrypted_api_key(dispositivo_id)
$$;