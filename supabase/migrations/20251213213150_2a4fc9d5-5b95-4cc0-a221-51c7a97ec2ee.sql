-- Create school_events table for calendar management
CREATE TABLE public.school_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo TEXT NOT NULL DEFAULT 'feriado' CHECK (tipo IN ('feriado', 'folga', 'reposicao', 'evento', 'recesso')),
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;

-- Policies for school_events
CREATE POLICY "Authenticated users can view school events" 
ON public.school_events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all school events" 
ON public.school_events 
FOR ALL 
USING (has_role(auth.uid(), 'administrador'))
WITH CHECK (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Developers can manage all school events" 
ON public.school_events 
FOR ALL 
USING (has_role(auth.uid(), 'desenvolvedor'))
WITH CHECK (has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Directors can manage school events in their unit" 
ON public.school_events 
FOR ALL 
USING (has_role(auth.uid(), 'diretor') AND (unidade_id = get_user_unit_id(auth.uid()) OR is_global = true))
WITH CHECK (has_role(auth.uid(), 'diretor') AND unidade_id = get_user_unit_id(auth.uid()));

-- Create email_notifications table for tracking sent emails
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  assunto TEXT NOT NULL,
  conteudo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'erro')),
  erro_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for email_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.email_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" 
ON public.email_notifications 
FOR SELECT 
USING (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Developers can manage all notifications" 
ON public.email_notifications 
FOR ALL 
USING (has_role(auth.uid(), 'desenvolvedor'))
WITH CHECK (has_role(auth.uid(), 'desenvolvedor'));

-- Create trigger for school_events updated_at
CREATE TRIGGER update_school_events_updated_at
BEFORE UPDATE ON public.school_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default holidays
INSERT INTO public.school_events (titulo, data_inicio, tipo, is_global, created_by) VALUES
('Natal', '2024-12-25', 'feriado', true, NULL),
('Ano Novo', '2025-01-01', 'feriado', true, NULL),
('Carnaval', '2025-03-03', 'feriado', true, NULL),
('Carnaval', '2025-03-04', 'feriado', true, NULL),
('Quarta-feira de Cinzas', '2025-03-05', 'folga', true, NULL),
('Sexta-feira Santa', '2025-04-18', 'feriado', true, NULL),
('Tiradentes', '2025-04-21', 'feriado', true, NULL),
('Dia do Trabalho', '2025-05-01', 'feriado', true, NULL),
('Corpus Christi', '2025-06-19', 'feriado', true, NULL),
('Independência do Brasil', '2025-09-07', 'feriado', true, NULL),
('Nossa Senhora Aparecida', '2025-10-12', 'feriado', true, NULL),
('Finados', '2025-11-02', 'feriado', true, NULL),
('Proclamação da República', '2025-11-15', 'feriado', true, NULL),
('Consciência Negra', '2025-11-20', 'feriado', true, NULL),
('Natal', '2025-12-25', 'feriado', true, NULL);