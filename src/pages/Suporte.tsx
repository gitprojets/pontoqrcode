import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';
import {
  Headphones,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Send,
  HelpCircle,
  Mail,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusConfig = {
  aberto: { label: 'Aberto', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-primary/10 text-primary border-primary/20', icon: MessageSquare },
  resolvido: { label: 'Resolvido', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  fechado: { label: 'Fechado', color: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
};

const priorityConfig = {
  baixa: { label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', color: 'bg-primary/10 text-primary' },
  alta: { label: 'Alta', color: 'bg-warning/10 text-warning' },
  urgente: { label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
};

export default function Suporte() {
  const { tickets, isLoading, createTicket } = useSupportTickets();
  const { role, profile } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });
  const [formErrors, setFormErrors] = useState<{subject?: string; message?: string}>({});

  const validateForm = () => {
    const errors: {subject?: string; message?: string} = {};
    
    if (!formData.subject.trim()) {
      errors.subject = 'O assunto é obrigatório';
    } else if (formData.subject.trim().length < 5) {
      errors.subject = 'O assunto deve ter pelo menos 5 caracteres';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'A mensagem é obrigatória';
    } else if (formData.message.trim().length < 20) {
      errors.message = 'A mensagem deve ter pelo menos 20 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await createTicket(formData.subject.trim(), formData.message.trim(), formData.priority);
      setIsCreateOpen(false);
      setFormData({ subject: '', message: '', priority: 'normal' });
      setFormErrors({});
      toast.success('Seu ticket foi criado com sucesso! Nossa equipe responderá em breve.');
    } catch (error) {
      // Error is already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({ subject: '', message: '', priority: 'normal' });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const viewingTicket = selectedTicket ? tickets.find(t => t.id === selectedTicket) : null;

  const openTickets = tickets.filter(t => t.status === 'aberto').length;
  const inProgressTickets = tickets.filter(t => t.status === 'em_andamento').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolvido' || t.status === 'fechado').length;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground mt-1">
              Estamos aqui para ajudar. Abra um chamado e nossa equipe responderá em breve.
            </p>
          </div>
          <Button onClick={handleOpenDialog} className="gap-2" size="lg">
            <Plus className="w-5 h-5" />
            Abrir Chamado
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-elevated p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tickets.length}</p>
              <p className="text-sm text-muted-foreground">Total de Chamados</p>
            </div>
          </div>
          <div className="card-elevated p-5 flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-xl">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{openTickets}</p>
              <p className="text-sm text-muted-foreground">Aguardando Resposta</p>
            </div>
          </div>
          <div className="card-elevated p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inProgressTickets}</p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </div>
          </div>
          <div className="card-elevated p-5 flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{resolvedTickets}</p>
              <p className="text-sm text-muted-foreground">Resolvidos</p>
            </div>
          </div>
        </div>

        {/* Quick Help */}
        <div className="card-elevated p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Precisa de ajuda rápida?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Antes de abrir um chamado, verifique se sua dúvida não está nas perguntas frequentes ou tente estas soluções rápidas:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  Problemas com QR Code
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Registro de Frequência
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Justificativas
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Escalas de Trabalho
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Headphones className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum chamado ainda
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Você ainda não abriu nenhum chamado de suporte. Estamos aqui para ajudar com qualquer dúvida ou problema!
            </p>
            <Button onClick={handleOpenDialog} className="gap-2" size="lg">
              <Plus className="w-5 h-5" />
              Abrir Meu Primeiro Chamado
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Meus Chamados</h2>
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.aberto;
              const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.normal;
              const StatusIcon = status.icon;

              return (
                <div
                  key={ticket.id}
                  className={cn(
                    "card-elevated p-6 cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4",
                    status.color.includes('warning') && 'border-l-warning',
                    status.color.includes('primary') && 'border-l-primary',
                    status.color.includes('success') && 'border-l-success',
                    !status.color.includes('warning') && !status.color.includes('primary') && !status.color.includes('success') && 'border-l-border'
                  )}
                  onClick={() => setSelectedTicket(ticket.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{ticket.subject}</h3>
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', status.color)}>
                          {status.label}
                        </span>
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', priority.color)}>
                          {priority.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                      <p className="text-xs text-muted-foreground mt-3">
                        Aberto em {format(new Date(ticket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <StatusIcon className={cn('w-6 h-6 flex-shrink-0', status.color.split(' ')[1])} />
                  </div>
                  {ticket.response && (
                    <div className="mt-4 p-4 bg-success/5 border border-success/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-success" />
                        <p className="text-xs text-success font-medium">Resposta da equipe de suporte</p>
                      </div>
                      <p className="text-sm text-foreground">{ticket.response}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" />
              Abrir Novo Chamado
            </DialogTitle>
            <DialogDescription>
              Descreva seu problema ou dúvida e nossa equipe responderá o mais breve possível.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Assunto *</label>
              <Input
                value={formData.subject}
                onChange={(e) => {
                  setFormData({ ...formData, subject: e.target.value });
                  if (formErrors.subject) setFormErrors({ ...formErrors, subject: undefined });
                }}
                placeholder="Ex: Problema ao registrar entrada"
                className={cn(formErrors.subject && 'border-destructive')}
              />
              {formErrors.subject && (
                <p className="text-xs text-destructive mt-1">{formErrors.subject}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Prioridade</label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      Baixa - Dúvida geral
                    </span>
                  </SelectItem>
                  <SelectItem value="normal">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Normal - Problema comum
                    </span>
                  </SelectItem>
                  <SelectItem value="alta">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      Alta - Afeta meu trabalho
                    </span>
                  </SelectItem>
                  <SelectItem value="urgente">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      Urgente - Sistema parado
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descrição do problema *</label>
              <Textarea
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  if (formErrors.message) setFormErrors({ ...formErrors, message: undefined });
                }}
                placeholder="Descreva detalhadamente o que está acontecendo, incluindo passos para reproduzir o problema se possível..."
                rows={5}
                className={cn(formErrors.message && 'border-destructive')}
              />
              {formErrors.message && (
                <p className="text-xs text-destructive mt-1">{formErrors.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Quanto mais detalhes, mais rápido poderemos ajudar.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar Chamado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {viewingTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          {viewingTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', 
                  statusConfig[viewingTicket.status as keyof typeof statusConfig]?.color)}>
                  {statusConfig[viewingTicket.status as keyof typeof statusConfig]?.label}
                </span>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium',
                  priorityConfig[viewingTicket.priority as keyof typeof priorityConfig]?.color)}>
                  {priorityConfig[viewingTicket.priority as keyof typeof priorityConfig]?.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  #{viewingTicket.id.slice(0, 8)}
                </span>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Sua mensagem:</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{viewingTicket.message}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Enviado em {format(new Date(viewingTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {viewingTicket.response ? (
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <p className="text-xs text-success font-medium">Resposta da Equipe de Suporte</p>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{viewingTicket.response}</p>
                  {viewingTicket.responded_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Respondido em {format(new Date(viewingTicket.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <p className="text-sm text-warning font-medium">Aguardando resposta da equipe</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nossa equipe responderá em breve. Você receberá uma notificação quando houver novidades.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
