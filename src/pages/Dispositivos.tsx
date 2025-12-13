import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  QrCode, 
  Search, 
  Plus,
  Wifi,
  WifiOff,
  AlertTriangle,
  Settings,
  Activity,
  Trash2,
  Edit,
  Loader2,
  Download,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDispositivos, DispositivoInput } from '@/hooks/useDispositivos';
import { useUnidades } from '@/hooks/useUnidades';
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

const statusConfig = {
  online: { icon: Wifi, label: 'Online', color: 'text-success', bg: 'bg-success/10' },
  offline: { icon: WifiOff, label: 'Offline', color: 'text-muted-foreground', bg: 'bg-muted' },
  erro: { icon: AlertTriangle, label: 'Erro', color: 'text-destructive', bg: 'bg-destructive/10' },
};

export default function Dispositivos() {
  const { dispositivos, isLoading, createDispositivo, updateDispositivo, deleteDispositivo } = useDispositivos();
  const { unidades } = useUnidades();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDispositivo, setSelectedDispositivo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<DispositivoInput>({
    nome: '',
    unidade_id: '',
    local: '',
    status: 'offline',
  });

  const filteredDispositivos = dispositivos.filter(
    (d) => d.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        unidade_id: formData.unidade_id || undefined,
      };
      await createDispositivo(data);
      setIsCreateOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedDispositivo) return;
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        unidade_id: formData.unidade_id || undefined,
      };
      await updateDispositivo(selectedDispositivo, data);
      setIsEditOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDispositivo) return;
    setIsSubmitting(true);
    try {
      await deleteDispositivo(selectedDispositivo);
      setIsDeleteOpen(false);
      setSelectedDispositivo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (dispositivo: typeof dispositivos[0]) => {
    setSelectedDispositivo(dispositivo.id);
    setFormData({
      nome: dispositivo.nome,
      unidade_id: dispositivo.unidade_id || '',
      local: dispositivo.local || '',
      status: dispositivo.status,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setSelectedDispositivo(id);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      unidade_id: '',
      local: '',
      status: 'offline',
    });
    setSelectedDispositivo(null);
  };

  const handleExportPDF = () => {
    const dataToExport = filteredDispositivos.map(d => ({
      nome: d.nome,
      unidade: d.unidade?.nome || 'Não atribuída',
      local: d.local || '-',
      status: statusConfig[d.status]?.label || d.status,
      leituras_hoje: d.leituras_hoje.toString(),
      ultima_leitura: d.ultima_leitura 
        ? new Date(d.ultima_leitura).toLocaleString('pt-BR')
        : 'Nunca',
    }));

    exportToPDF({
      title: 'Relatório de Dispositivos',
      subtitle: `Total: ${dataToExport.length} dispositivos`,
      columns: [
        { header: 'Nome', key: 'nome', width: 35 },
        { header: 'Unidade', key: 'unidade', width: 35 },
        { header: 'Local', key: 'local', width: 30 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Leituras Hoje', key: 'leituras_hoje', width: 25 },
        { header: 'Última Leitura', key: 'ultima_leitura', width: 35 },
      ],
      data: dataToExport,
      filename: `dispositivos_${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape',
    });
    toast.success('PDF exportado com sucesso!');
  };

  const handleExportCSV = () => {
    const dataToExport = filteredDispositivos.map(d => ({
      nome: d.nome,
      unidade: d.unidade?.nome || '',
      local: d.local || '',
      status: statusConfig[d.status]?.label || d.status,
      leituras_hoje: d.leituras_hoje.toString(),
      ultima_leitura: d.ultima_leitura 
        ? new Date(d.ultima_leitura).toLocaleString('pt-BR')
        : '',
    }));

    exportToCSV({
      columns: [
        { header: 'Nome', key: 'nome' },
        { header: 'Unidade', key: 'unidade' },
        { header: 'Local', key: 'local' },
        { header: 'Status', key: 'status' },
        { header: 'Leituras Hoje', key: 'leituras_hoje' },
        { header: 'Última Leitura', key: 'ultima_leitura' },
      ],
      data: dataToExport,
      filename: `dispositivos_${new Date().toISOString().split('T')[0]}`,
    });
    toast.success('CSV exportado com sucesso!');
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Dispositivos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os leitores de QR Code
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
              Novo Dispositivo
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar dispositivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{dispositivos.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Wifi className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {dispositivos.filter(d => d.status === 'online').length}
              </p>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {dispositivos.filter(d => d.status === 'erro').length}
              </p>
              <p className="text-sm text-muted-foreground">Com erro</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Activity className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {dispositivos.reduce((acc, d) => acc + d.leituras_hoje, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Leituras hoje</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDispositivos.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum dispositivo cadastrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Clique em "Novo Dispositivo" para adicionar o primeiro leitor QR.
            </p>
          </div>
        ) : (
          /* Devices Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDispositivos.map((dispositivo) => {
              const status = statusConfig[dispositivo.status];
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={dispositivo.id}
                  className="card-elevated p-6 animate-slide-up"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-3 rounded-xl', status.bg)}>
                        <QrCode className={cn('w-6 h-6', status.color)} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground">
                          {dispositivo.nome}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon className={cn('w-3 h-3', status.color)} />
                          <span className={cn('text-sm', status.color)}>{status.label}</span>
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
                        <DropdownMenuItem onClick={() => openEditDialog(dispositivo)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(dispositivo.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unidade</span>
                      <span className="font-medium text-foreground">
                        {dispositivo.unidade?.nome || 'Não atribuída'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Local</span>
                      <span className="font-medium text-foreground">
                        {dispositivo.local || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última leitura</span>
                      <span className="font-medium text-foreground">
                        {dispositivo.ultima_leitura 
                          ? new Date(dispositivo.ultima_leitura).toLocaleString('pt-BR')
                          : 'Nunca'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{dispositivo.leituras_hoje}</p>
                      <p className="text-xs text-muted-foreground">leituras hoje</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver logs
                    </Button>
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
            <DialogTitle>Novo Dispositivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do dispositivo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unidade</label>
              <Select
                value={formData.unidade_id}
                onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Local</label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Ex: Portaria Principal"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value: 'online' | 'offline' | 'erro') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
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
            <DialogTitle>Editar Dispositivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do dispositivo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unidade</label>
              <Select
                value={formData.unidade_id}
                onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Local</label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Ex: Portaria Principal"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value: 'online' | 'offline' | 'erro') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>Excluir Dispositivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este dispositivo? Esta ação não pode ser desfeita.
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
