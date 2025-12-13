import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building, 
  Search, 
  Plus,
  Users,
  MapPin,
  Phone,
  Settings,
  Trash2,
  Edit,
  Loader2,
  Download,
  FileText,
  Clock,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnidades, UnidadeInput } from '@/hooks/useUnidades';
import { exportToPDF, exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const statusConfig = {
  online: { label: 'Online', color: 'bg-success' },
  offline: { label: 'Offline', color: 'bg-destructive' },
  manutencao: { label: 'Manutenção', color: 'bg-warning' },
};

const diasSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export default function Unidades() {
  const { unidades, isLoading, createUnidade, updateUnidade, deleteUnidade } = useUnidades();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<UnidadeInput>({
    nome: '',
    endereco: '',
    telefone: '',
    status: 'online',
    hora_abertura: '07:00',
    hora_fechamento: '17:00',
    dias_funcionamento: [1, 2, 3, 4, 5],
  });

  const filteredUnidades = unidades.filter(
    (u) => u.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await createUnidade(formData);
      setIsCreateOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUnidade) return;
    setIsSubmitting(true);
    try {
      await updateUnidade(selectedUnidade, formData);
      setIsEditOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUnidade) return;
    setIsSubmitting(true);
    try {
      await deleteUnidade(selectedUnidade);
      setIsDeleteOpen(false);
      setSelectedUnidade(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (unidade: typeof unidades[0]) => {
    setSelectedUnidade(unidade.id);
    setFormData({
      nome: unidade.nome,
      endereco: unidade.endereco || '',
      telefone: unidade.telefone || '',
      status: unidade.status,
      hora_abertura: unidade.hora_abertura || '07:00',
      hora_fechamento: unidade.hora_fechamento || '17:00',
      dias_funcionamento: unidade.dias_funcionamento || [1, 2, 3, 4, 5],
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setSelectedUnidade(id);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      endereco: '',
      telefone: '',
      status: 'online',
      hora_abertura: '07:00',
      hora_fechamento: '17:00',
      dias_funcionamento: [1, 2, 3, 4, 5],
    });
    setSelectedUnidade(null);
  };

  const toggleDia = (dia: number) => {
    const dias = formData.dias_funcionamento || [];
    if (dias.includes(dia)) {
      setFormData({ ...formData, dias_funcionamento: dias.filter(d => d !== dia) });
    } else {
      setFormData({ ...formData, dias_funcionamento: [...dias, dia].sort() });
    }
  };

  const formatDiasFuncionamento = (dias: number[] | null) => {
    if (!dias || dias.length === 0) return 'Não definido';
    if (dias.length === 7) return 'Todos os dias';
    if (JSON.stringify(dias) === JSON.stringify([1, 2, 3, 4, 5])) return 'Seg a Sex';
    if (JSON.stringify(dias) === JSON.stringify([0, 6])) return 'Fim de semana';
    return dias.map(d => diasSemana.find(ds => ds.value === d)?.label.slice(0, 3)).join(', ');
  };

  const handleExportPDF = () => {
    const dataToExport = filteredUnidades.map(u => ({
      nome: u.nome,
      endereco: u.endereco || '-',
      telefone: u.telefone || '-',
      status: statusConfig[u.status]?.label || u.status,
      diretor: u.diretor?.nome || '-',
    }));

    exportToPDF({
      title: 'Relatório de Unidades Escolares',
      subtitle: `Total: ${dataToExport.length} unidades`,
      columns: [
        { header: 'Nome', key: 'nome', width: 45 },
        { header: 'Endereço', key: 'endereco', width: 50 },
        { header: 'Telefone', key: 'telefone', width: 30 },
        { header: 'Status', key: 'status', width: 25 },
        { header: 'Diretor', key: 'diretor', width: 35 },
      ],
      data: dataToExport,
      filename: `unidades_${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape',
    });
    toast.success('PDF exportado com sucesso!');
  };

  const handleExportCSV = () => {
    const dataToExport = filteredUnidades.map(u => ({
      nome: u.nome,
      endereco: u.endereco || '',
      telefone: u.telefone || '',
      status: statusConfig[u.status]?.label || u.status,
      diretor: u.diretor?.nome || '',
    }));

    exportToCSV({
      columns: [
        { header: 'Nome', key: 'nome' },
        { header: 'Endereço', key: 'endereco' },
        { header: 'Telefone', key: 'telefone' },
        { header: 'Status', key: 'status' },
        { header: 'Diretor', key: 'diretor' },
      ],
      data: dataToExport,
      filename: `unidades_${new Date().toISOString().split('T')[0]}`,
    });
    toast.success('CSV exportado com sucesso!');
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Unidades Escolares
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as unidades do sistema
            </p>
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="gradient" className="gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Nova Unidade
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar unidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{unidades.length}</p>
              <p className="text-sm text-muted-foreground">Total de unidades</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Building className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {unidades.filter(u => u.status === 'online').length}
              </p>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Building className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {unidades.filter(u => u.status === 'manutencao').length}
              </p>
              <p className="text-sm text-muted-foreground">Manutenção</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Building className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {unidades.filter(u => u.status === 'offline').length}
              </p>
              <p className="text-sm text-muted-foreground">Offline</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredUnidades.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma unidade cadastrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Clique em "Nova Unidade" para adicionar a primeira unidade.
            </p>
          </div>
        ) : (
          /* Units Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredUnidades.map((unidade) => {
              const status = statusConfig[unidade.status];
              
              return (
                <div
                  key={unidade.id}
                  className="card-elevated p-6 animate-slide-up"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Building className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-semibold text-foreground">
                          {unidade.nome}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn('w-2 h-2 rounded-full', status.color)} />
                          <span className="text-sm text-muted-foreground">{status.label}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(unidade)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(unidade.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3 mb-4">
                    {unidade.endereco && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{unidade.endereco}</span>
                      </div>
                    )}
                    {unidade.telefone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{unidade.telefone}</span>
                      </div>
                    )}
                    {unidade.diretor && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Diretor: {unidade.diretor.nome}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {unidade.hora_abertura?.slice(0, 5) || '07:00'} - {unidade.hora_fechamento?.slice(0, 5) || '17:00'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDiasFuncionamento(unidade.dias_funcionamento)}</span>
                    </div>
                  </div>
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
            <DialogTitle>Nova Unidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da unidade"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Endereço</label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 0000-0000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value: 'online' | 'offline' | 'manutencao') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hora de Abertura</label>
                <Input
                  type="time"
                  value={formData.hora_abertura || '07:00'}
                  onChange={(e) => setFormData({ ...formData, hora_abertura: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hora de Fechamento</label>
                <Input
                  type="time"
                  value={formData.hora_fechamento || '17:00'}
                  onChange={(e) => setFormData({ ...formData, hora_fechamento: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Dias de Funcionamento</label>
              <div className="grid grid-cols-4 gap-2">
                {diasSemana.map((dia) => (
                  <div key={dia.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`create-dia-${dia.value}`}
                      checked={(formData.dias_funcionamento || []).includes(dia.value)}
                      onCheckedChange={() => toggleDia(dia.value)}
                    />
                    <Label htmlFor={`create-dia-${dia.value}`} className="text-sm">
                      {dia.label.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleCreate}
              disabled={!formData.nome || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da unidade"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Endereço</label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 0000-0000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value: 'online' | 'offline' | 'manutencao') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hora de Abertura</label>
                <Input
                  type="time"
                  value={formData.hora_abertura || '07:00'}
                  onChange={(e) => setFormData({ ...formData, hora_abertura: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hora de Fechamento</label>
                <Input
                  type="time"
                  value={formData.hora_fechamento || '17:00'}
                  onChange={(e) => setFormData({ ...formData, hora_fechamento: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Dias de Funcionamento</label>
              <div className="grid grid-cols-4 gap-2">
                {diasSemana.map((dia) => (
                  <div key={dia.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-dia-${dia.value}`}
                      checked={(formData.dias_funcionamento || []).includes(dia.value)}
                      onCheckedChange={() => toggleDia(dia.value)}
                    />
                    <Label htmlFor={`edit-dia-${dia.value}`} className="text-sm">
                      {dia.label.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleEdit}
              disabled={!formData.nome || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Unidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita.
              Todos os dispositivos associados também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
