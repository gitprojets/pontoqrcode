import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import {
  Headphones,
  Clock,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  User,
  Mail,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

export default function SuporteAdmin() {
  const { tickets, isLoading, updateTicket, deleteTicket } = useSupportTickets(true);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [filter, setFilter] = useState('todos');

  const viewingTicket = selectedTicket ? tickets.find(t => t.id === selectedTicket) : null;

  const filteredTickets = tickets.filter(t => {
    if (filter === 'todos') return true;
    if (filter === 'urgente') return t.priority === 'urgente' && t.status !== 'resolvido' && t.status !== 'fechado';
    return t.status === filter;
  });

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateTicket(selectedTicket, {
        response,
        status: (newStatus || 'em_andamento') as 'aberto' | 'em_andamento' | 'resolvido' | 'fechado',
      });
      setSelectedTicket(null);
      setResponse('');
      setNewStatus('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    await updateTicket(ticketId, { status: status as 'aberto' | 'em_andamento' | 'resolvido' | 'fechado' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await deleteTicket(deleteId);
      setDeleteId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os tickets de suporte do sistema
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div 
            className={cn("card-elevated p-4 flex items-center gap-3 cursor-pointer transition-all", filter === 'todos' && 'ring-2 ring-primary')}
            onClick={() => setFilter('todos')}
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tickets.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
          <div 
            className={cn("card-elevated p-4 flex items-center gap-3 cursor-pointer transition-all", filter === 'aberto' && 'ring-2 ring-warning')}
            onClick={() => setFilter('aberto')}
          >
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
          <div 
            className={cn("card-elevated p-4 flex items-center gap-3 cursor-pointer transition-all", filter === 'em_andamento' && 'ring-2 ring-primary')}
            onClick={() => setFilter('em_andamento')}
          >
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
          <div 
            className={cn("card-elevated p-4 flex items-center gap-3 cursor-pointer transition-all", filter === 'resolvido' && 'ring-2 ring-success')}
            onClick={() => setFilter('resolvido')}
          >
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {tickets.filter(t => t.status === 'resolvido').length}
              </p>
              <p className="text-sm text-muted-foreground">Resolvidos</p>
            </div>
          </div>
          <div 
            className={cn("card-elevated p-4 flex items-center gap-3 cursor-pointer transition-all", filter === 'urgente' && 'ring-2 ring-destructive')}
            onClick={() => setFilter('urgente')}
          >
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {tickets.filter(t => t.priority === 'urgente' && t.status !== 'resolvido' && t.status !== 'fechado').length}
              </p>
              <p className="text-sm text-muted-foreground">Urgentes</p>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Headphones className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum ticket encontrado
            </h3>
            <p className="text-muted-foreground">
              {filter === 'todos' ? 'Não há tickets de suporte no momento.' : 'Nenhum ticket com este filtro.'}
            </p>
          </div>
        ) : (
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Usuário</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Assunto</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Prioridade</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.aberto;
                    const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.normal;

                    return (
                      <tr
                        key={ticket.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{ticket.user?.nome || 'Usuário'}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {ticket.user?.email || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-foreground text-sm truncate max-w-[200px]">{ticket.subject}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', priority.color)}>
                            {priority.label}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <Select
                            value={ticket.status}
                            onValueChange={(value) => handleStatusChange(ticket.id, value)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aberto">Aberto</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="resolvido">Resolvido</SelectItem>
                              <SelectItem value="fechado">Fechado</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ticket.created_at), 'dd/MM/yyyy')}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket.id);
                                setResponse(ticket.response || '');
                                setNewStatus(ticket.status);
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteId(ticket.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Respond Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Ticket</DialogTitle>
          </DialogHeader>
          {viewingTicket && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{viewingTicket.user?.nome}</span>
                  <span className="text-xs text-muted-foreground">({viewingTicket.user?.email})</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">{viewingTicket.subject}</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{viewingTicket.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(viewingTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Alterar Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Resposta</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Digite sua resposta..."
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRespond} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este ticket? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
