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
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

const statusConfig = {
  aberto: { label: 'Aberto', color: 'bg-warning/10 text-warning', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-primary/10 text-primary', icon: MessageSquare },
  resolvido: { label: 'Resolvido', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  fechado: { label: 'Fechado', color: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
};

const priorityConfig = {
  baixa: { label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', color: 'bg-primary/10 text-primary' },
  alta: { label: 'Alta', color: 'bg-warning/10 text-warning' },
  urgente: { label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
};

export default function Suporte() {
  const { tickets, isLoading, createTicket } = useSupportTickets();
  const { role } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });

  const handleCreate = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createTicket(formData.subject, formData.message, formData.priority);
      setIsCreateOpen(false);
      setFormData({ subject: '', message: '', priority: 'normal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewingTicket = selectedTicket ? tickets.find(t => t.id === selectedTicket) : null;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Suporte
            </h1>
            <p className="text-muted-foreground mt-1">
              Entre em contato com nossa equipe de suporte
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Ticket
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tickets.length}</p>
              <p className="text-sm text-muted-foreground">Total de Tickets</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {tickets.filter(t => t.status === 'aberto').length}
              </p>
              <p className="text-sm text-muted-foreground">Abertos</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {tickets.filter(t => t.status === 'em_andamento').length}
              </p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {tickets.filter(t => t.status === 'resolvido' || t.status === 'fechado').length}
              </p>
              <p className="text-sm text-muted-foreground">Resolvidos</p>
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
            <Headphones className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum ticket ainda
            </h3>
            <p className="text-muted-foreground mb-4">
              Crie um ticket para entrar em contato com o suporte.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeiro Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.aberto;
              const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.normal;
              const StatusIcon = status.icon;

              return (
                <div
                  key={ticket.id}
                  className="card-elevated p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedTicket(ticket.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                          {status.label}
                        </span>
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', priority.color)}>
                          {priority.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Criado em {format(new Date(ticket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn('w-5 h-5', status.color.split(' ')[1])} />
                    </div>
                  </div>
                  {ticket.response && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Resposta do suporte:</p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Ticket de Suporte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assunto *</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Descreva brevemente o problema"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Prioridade</label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Mensagem *</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Descreva o problema em detalhes..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isSubmitting || !formData.subject.trim() || !formData.message.trim()}
              className="gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingTicket?.subject}</DialogTitle>
          </DialogHeader>
          {viewingTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium', 
                  statusConfig[viewingTicket.status as keyof typeof statusConfig]?.color)}>
                  {statusConfig[viewingTicket.status as keyof typeof statusConfig]?.label}
                </span>
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                  priorityConfig[viewingTicket.priority as keyof typeof priorityConfig]?.color)}>
                  {priorityConfig[viewingTicket.priority as keyof typeof priorityConfig]?.label}
                </span>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-foreground whitespace-pre-wrap">{viewingTicket.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(viewingTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {viewingTicket.response && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-primary font-medium mb-2">Resposta do Suporte</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{viewingTicket.response}</p>
                  {viewingTicket.responded_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(viewingTicket.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
