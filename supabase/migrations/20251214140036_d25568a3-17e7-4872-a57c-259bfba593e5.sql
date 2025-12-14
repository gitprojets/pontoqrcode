-- Create storage bucket for justificativas attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('justificativas', 'justificativas', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for justificativas bucket
CREATE POLICY "Users can upload their own justificativas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'justificativas' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own justificativas"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'justificativas' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own justificativas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'justificativas' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Directors can view justificativas from their unit"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'justificativas' AND
  has_role(auth.uid(), 'diretor')
);

CREATE POLICY "Admins and developers can view all justificativas"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'justificativas' AND
  (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'desenvolvedor'))
);

-- Create justificativas table
CREATE TABLE public.justificativas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'outro',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  descricao TEXT,
  anexo_path TEXT,
  anexo_nome TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  aprovado_por UUID REFERENCES public.profiles(id),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.justificativas ENABLE ROW LEVEL SECURITY;

-- RLS policies for justificativas
CREATE POLICY "Professors can view their own justificativas"
ON public.justificativas FOR SELECT
USING (has_role(auth.uid(), 'professor') AND professor_id = auth.uid());

CREATE POLICY "Professors can create their own justificativas"
ON public.justificativas FOR INSERT
WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Directors can view justificativas from their unit"
ON public.justificativas FOR SELECT
USING (
  has_role(auth.uid(), 'diretor') AND
  unidade_id = get_user_unit_id(auth.uid())
);

CREATE POLICY "Directors can update justificativas from their unit"
ON public.justificativas FOR UPDATE
USING (
  has_role(auth.uid(), 'diretor') AND
  unidade_id = get_user_unit_id(auth.uid())
);

CREATE POLICY "Admins can view justificativas in their linked units"
ON public.justificativas FOR SELECT
USING (
  has_role(auth.uid(), 'administrador') AND
  unidade_id IN (SELECT get_admin_unit_ids(auth.uid()))
);

CREATE POLICY "Developers can manage all justificativas"
ON public.justificativas FOR ALL
USING (has_role(auth.uid(), 'desenvolvedor'))
WITH CHECK (has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Require authentication for justificativas"
ON public.justificativas FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_justificativas_updated_at
BEFORE UPDATE ON public.justificativas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();