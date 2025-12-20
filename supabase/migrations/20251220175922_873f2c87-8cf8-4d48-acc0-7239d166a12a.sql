-- Create audit_logs table to track all administrative actions
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only developers and admins can view audit logs
CREATE POLICY "Developers and admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'desenvolvedor') OR
    public.has_role(auth.uid(), 'administrador')
);

-- Only the system (via security definer functions) can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    _action TEXT,
    _table_name TEXT DEFAULT NULL,
    _record_id TEXT DEFAULT NULL,
    _old_data JSONB DEFAULT NULL,
    _new_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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