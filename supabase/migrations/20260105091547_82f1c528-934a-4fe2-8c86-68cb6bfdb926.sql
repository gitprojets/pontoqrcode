-- Corrigir políticas RLS da tabela qr_nonces para maior segurança
-- Nonces devem ser visíveis apenas para o próprio professor ou para validação

-- Remover políticas existentes para recriar com restrições adequadas
DROP POLICY IF EXISTS "Professors can view their own nonces" ON public.qr_nonces;
DROP POLICY IF EXISTS "Professors can create their own nonces" ON public.qr_nonces;
DROP POLICY IF EXISTS "Admins can view all nonces" ON public.qr_nonces;
DROP POLICY IF EXISTS "Directors can view unit nonces" ON public.qr_nonces;
DROP POLICY IF EXISTS "Service role can manage nonces" ON public.qr_nonces;

-- Professores podem apenas ver seus próprios nonces
CREATE POLICY "Professors can view own nonces only"
ON public.qr_nonces
FOR SELECT
USING (auth.uid() = professor_id);

-- Professores podem criar apenas seus próprios nonces
CREATE POLICY "Professors can create own nonces"
ON public.qr_nonces
FOR INSERT
WITH CHECK (auth.uid() = professor_id);

-- Apenas desenvolvedores podem ver todos os nonces (para auditoria)
CREATE POLICY "Developers can view all nonces for audit"
ON public.qr_nonces
FOR SELECT
USING (public.has_role(auth.uid(), 'desenvolvedor'));

-- Permitir update para marcar como usado (validação via edge function)
CREATE POLICY "Allow nonce update for validation"
ON public.qr_nonces
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Criar índice para limpeza mais eficiente de nonces expirados
CREATE INDEX IF NOT EXISTS idx_qr_nonces_expires_at ON public.qr_nonces(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_nonces_professor_used ON public.qr_nonces(professor_id, used_at);

-- Agendar limpeza automática de nonces expirados (via pg_cron se disponível)
-- Como pg_cron pode não estar disponível, a limpeza será feita via aplicação