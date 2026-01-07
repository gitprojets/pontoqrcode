-- Add rotation tracking columns to dispositivo_api_keys
ALTER TABLE public.dispositivo_api_keys 
ADD COLUMN IF NOT EXISTS rotation_interval_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS next_rotation_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rotation_notification_sent BOOLEAN DEFAULT false;

-- Update existing records to have a rotation schedule
UPDATE public.dispositivo_api_keys 
SET next_rotation_at = COALESCE(rotated_at, created_at) + INTERVAL '90 days'
WHERE next_rotation_at IS NULL;

-- Function to rotate an API key
CREATE OR REPLACE FUNCTION public.rotate_api_key(p_dispositivo_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_key TEXT;
  v_encryption_key TEXT;
BEGIN
  -- Only developers can rotate keys
  IF NOT public.has_role('desenvolvedor', auth.uid()) THEN
    RAISE EXCEPTION 'Apenas desenvolvedores podem rotacionar API keys';
  END IF;

  -- Generate new API key
  v_new_key := gen_random_uuid()::text;
  
  -- Get encryption key
  v_encryption_key := current_setting('app.encryption_key', true);
  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    v_encryption_key := 'default-dev-key-change-in-production';
  END IF;

  -- Update the encrypted key
  UPDATE public.dispositivo_api_keys
  SET 
    encrypted_key = encode(pgp_sym_encrypt(v_new_key, v_encryption_key), 'base64'),
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

-- Function to get devices needing rotation
CREATE OR REPLACE FUNCTION public.get_devices_pending_rotation()
RETURNS TABLE (
  dispositivo_id UUID,
  dispositivo_nome TEXT,
  unidade_id UUID,
  next_rotation_at TIMESTAMP WITH TIME ZONE,
  days_until_rotation INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only developers can view this
  IF NOT public.has_role('desenvolvedor', auth.uid()) THEN
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

-- Function to mark rotation notification as sent
CREATE OR REPLACE FUNCTION public.mark_rotation_notification_sent(p_dispositivo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dispositivo_api_keys
  SET rotation_notification_sent = true
  WHERE dispositivo_id = p_dispositivo_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.rotate_api_key(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_devices_pending_rotation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_rotation_notification_sent(UUID) TO authenticated;