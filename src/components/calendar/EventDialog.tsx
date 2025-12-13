import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { SchoolEvent } from '@/hooks/useSchoolEvents';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: SchoolEvent | null;
  selectedDate?: Date | null;
  onSave: (event: Omit<SchoolEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  unidadeId?: string | null;
  canManageGlobal?: boolean;
}

const tipoOptions = [
  { value: 'feriado', label: 'Feriado' },
  { value: 'folga', label: 'Folga' },
  { value: 'reposicao', label: 'Reposição' },
  { value: 'evento', label: 'Evento' },
  { value: 'recesso', label: 'Recesso' },
];

export function EventDialog({
  open,
  onOpenChange,
  event,
  selectedDate,
  onSave,
  onDelete,
  unidadeId,
  canManageGlobal = false,
}: EventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    tipo: 'evento' as SchoolEvent['tipo'],
    is_global: false,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        titulo: event.titulo,
        descricao: event.descricao || '',
        data_inicio: event.data_inicio,
        data_fim: event.data_fim || '',
        tipo: event.tipo,
        is_global: event.is_global,
      });
    } else if (selectedDate) {
      setFormData({
        titulo: '',
        descricao: '',
        data_inicio: format(selectedDate, 'yyyy-MM-dd'),
        data_fim: '',
        tipo: 'evento',
        is_global: false,
      });
    } else {
      setFormData({
        titulo: '',
        descricao: '',
        data_inicio: format(new Date(), 'yyyy-MM-dd'),
        data_fim: '',
        tipo: 'evento',
        is_global: false,
      });
    }
  }, [event, selectedDate, open]);

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.data_inicio) return;
    
    setIsSubmitting(true);
    try {
      await onSave({
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || null,
        tipo: formData.tipo,
        is_global: formData.is_global,
        unidade_id: formData.is_global ? null : unidadeId || null,
        created_by: null, // Will be set by the hook
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id || !onDelete) return;
    
    setIsSubmitting(true);
    try {
      await onDelete(event.id);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {event ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título *</label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Nome do evento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data Início *</label>
              <Input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data Fim</label>
              <Input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Tipo *</label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value as SchoolEvent['tipo'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Descrição</label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição opcional do evento"
              rows={3}
            />
          </div>

          {canManageGlobal && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="is_global"
                checked={formData.is_global}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_global: checked as boolean })
                }
              />
              <label htmlFor="is_global" className="text-sm cursor-pointer">
                Evento global (visível em todas as unidades)
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {event && onDelete && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting || !formData.titulo.trim() || !formData.data_inicio}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              event ? 'Salvar' : 'Criar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
