import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  MoreVertical,
  Mail,
  Shield,
  Building,
  Trash2,
  Edit,
  Loader2,
  Download,
  FileText,
  GraduationCap,
  UserCog,
  ClipboardList,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsuarios, AppRole } from '@/hooks/useUsuarios';
import { useUnidades } from '@/hooks/useUnidades';
import { useAuth } from '@/contexts/AuthContext';
import { CreateUserDialog } from '@/components/usuarios/CreateUserDialog';
import { exportToPDF, exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

const cargoConfig: Record<AppRole, { label: string; color: string; icon: typeof Users }> = {
  professor: { label: 'Professor', color: 'bg-primary/10 text-primary', icon: GraduationCap },
  diretor: { label: 'Diretor', color: 'bg-secondary/10 text-secondary', icon: Shield },
  administrador: { label: 'Administrador', color: 'bg-warning/10 text-warning', icon: UserCog },
  desenvolvedor: { label: 'Desenvolvedor', color: 'bg-destructive/10 text-destructive', icon: UserCog },
  coordenador: { label: 'Coordenador', color: 'bg-blue-500/10 text-blue-500', icon: ClipboardList },
  secretario: { label: 'Secretário', color: 'bg-purple-500/10 text-purple-500', icon: ClipboardList },
  outro: { label: 'Outro', color: 'bg-muted text-muted-foreground', icon: UserCircle },
};

// Categorias de usuários para as abas
type UserCategory = 'todos' | 'administradores' | 'diretores' | 'coordenadores' | 'professores' | 'secretarios' | 'outros';

const categoryConfig: Record<UserCategory, { label: string; shortLabel: string; roles: AppRole[] }> = {
  todos: { label: 'Todos', shortLabel: 'Todos', roles: ['administrador', 'diretor', 'coordenador', 'professor', 'secretario', 'outro'] },
  administradores: { label: 'Administradores', shortLabel: 'Adm', roles: ['administrador'] },
  diretores: { label: 'Diretores', shortLabel: 'Dir', roles: ['diretor'] },
  coordenadores: { label: 'Coordenadores', shortLabel: 'Coord', roles: ['coordenador'] },
  professores: { label: 'Professores', shortLabel: 'Prof', roles: ['professor'] },
  secretarios: { label: 'Secretários', shortLabel: 'Sec', roles: ['secretario'] },
  outros: { label: 'Outros', shortLabel: 'Out', roles: ['outro'] },
};

// Define quais roles cada role pode editar/excluir
const canEditRole = (currentRole: AppRole | null, targetRole: AppRole): boolean => {
  if (!currentRole) return false;
  if (currentRole === 'desenvolvedor') return targetRole !== 'desenvolvedor';
  if (currentRole === 'administrador') return ['diretor', 'coordenador', 'professor', 'secretario', 'outro'].includes(targetRole);
  if (currentRole === 'diretor') return ['coordenador', 'professor', 'secretario'].includes(targetRole);
  return false;
};

// Define se um usuário deve ser visível na lista
const isUserVisible = (currentRole: AppRole | null, targetRole: AppRole, currentUnidadeId: string | null, targetUnidadeId: string | null): boolean => {
  if (!currentRole) return false;
  if (targetRole === 'desenvolvedor') return false;
  if (currentRole === 'desenvolvedor' || currentRole === 'administrador') return true;
  // Directors can only see users from their own unit
  if (currentRole === 'diretor') {
    if (!currentUnidadeId) return false;
    return targetUnidadeId === currentUnidadeId && ['coordenador', 'professor', 'secretario'].includes(targetRole);
  }
  return false;
};

// Define se o email do usuário deve ser exibido (segurança)
const shouldShowEmail = (currentRole: AppRole | null): boolean => {
  // Apenas desenvolvedores veem emails diretamente na listagem
  return currentRole === 'desenvolvedor';
};

// Mascara o email para exibição
const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedLocal = local.length > 2 
    ? local[0] + '***' + local[local.length - 1]
    : '***';
  return `${maskedLocal}@${domain}`;
};

export default function Usuarios() {
  const { usuarios, isLoading, updateUsuario, deleteUsuario, fetchUsuarios } = useUsuarios();
  const { unidades } = useUnidades();
  const { role: currentUserRole, profile: currentProfile } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<UserCategory>('todos');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    matricula: '',
    unidade_id: '',
    role: 'professor' as AppRole,
  });

  const currentUnidadeId = currentProfile?.unidade_id || null;

  // Filtrar usuários baseado na role, categoria e busca
  const filteredUsuarios = usuarios
    .filter((u) => isUserVisible(currentUserRole, u.role, currentUnidadeId, u.unidade_id))
    .filter((u) => categoryConfig[activeTab].roles.includes(u.role))
    .filter(
      (u) =>
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

  // Contagens por categoria (excluindo desenvolvedores e filtrando por visibilidade)
  const getCategoryCount = (category: UserCategory) => {
    return usuarios
      .filter((u) => isUserVisible(currentUserRole, u.role, currentUnidadeId, u.unidade_id))
      .filter((u) => categoryConfig[category].roles.includes(u.role))
      .length;
  };

  const handleEdit = async () => {
    if (!selectedUsuario) return;
    setIsSubmitting(true);
    try {
      await updateUsuario(selectedUsuario, {
        nome: formData.nome,
        email: formData.email,
        matricula: formData.matricula || undefined,
        unidade_id: formData.unidade_id || undefined,
        role: formData.role,
      });
      setIsEditOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUsuario) return;
    setIsSubmitting(true);
    try {
      await deleteUsuario(selectedUsuario);
      setIsDeleteOpen(false);
      setSelectedUsuario(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (usuario: typeof usuarios[0]) => {
    setSelectedUsuario(usuario.id);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      matricula: usuario.matricula || '',
      unidade_id: usuario.unidade_id || '',
      role: usuario.role,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setSelectedUsuario(id);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      matricula: '',
      unidade_id: '',
      role: 'professor',
    });
    setSelectedUsuario(null);
  };

  const handleExportPDF = () => {
    const dataToExport = filteredUsuarios.map(u => ({
      nome: u.nome,
      email: shouldShowEmail(currentUserRole) ? u.email : maskEmail(u.email),
      cargo: cargoConfig[u.role]?.label || u.role,
      unidade: u.unidade?.nome || 'Não atribuída',
      matricula: u.matricula || '-',
    }));

    exportToPDF({
      title: 'Relatório de Usuários',
      subtitle: `Total: ${dataToExport.length} usuários`,
      columns: [
        { header: 'Nome', key: 'nome', width: 50 },
        { header: 'E-mail', key: 'email', width: 50 },
        { header: 'Cargo', key: 'cargo', width: 25 },
        { header: 'Unidade', key: 'unidade', width: 35 },
        { header: 'Matrícula', key: 'matricula', width: 25 },
      ],
      data: dataToExport,
      filename: `usuarios_${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape',
    });
    toast.success('PDF exportado com sucesso!');
  };

  const handleExportCSV = () => {
    const dataToExport = filteredUsuarios.map(u => ({
      nome: u.nome,
      email: shouldShowEmail(currentUserRole) ? u.email : maskEmail(u.email),
      cargo: cargoConfig[u.role]?.label || u.role,
      unidade: u.unidade?.nome || 'Não atribuída',
      matricula: u.matricula || '-',
    }));

    exportToCSV({
      columns: [
        { header: 'Nome', key: 'nome' },
        { header: 'E-mail', key: 'email' },
        { header: 'Cargo', key: 'cargo' },
        { header: 'Unidade', key: 'unidade' },
        { header: 'Matrícula', key: 'matricula' },
      ],
      data: dataToExport,
      filename: `usuarios_${new Date().toISOString().split('T')[0]}`,
    });
    toast.success('CSV exportado com sucesso!');
  };

  // Roles que o usuário pode atribuir ao editar
  const getEditableRoles = (): AppRole[] => {
    if (currentUserRole === 'desenvolvedor') {
      return ['administrador', 'diretor', 'coordenador', 'professor', 'secretario', 'outro'];
    }
    if (currentUserRole === 'administrador') {
      return ['diretor', 'coordenador', 'professor', 'secretario', 'outro'];
    }
    if (currentUserRole === 'diretor') {
      return ['coordenador', 'professor', 'secretario'];
    }
    return [];
  };

  const editableRoles = getEditableRoles();

  // Filter unidades for directors - they can only assign to their own unit
  const availableUnidades = currentUserRole === 'diretor' && currentUnidadeId
    ? unidades.filter(u => u.id === currentUnidadeId)
    : unidades;

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">
              Usuários do Sistema
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gerencie usuários e permissões de acesso
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
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
            <CreateUserDialog unidades={availableUnidades} onSuccess={fetchUsuarios} />
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 sm:pl-10 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Tabs de Navegação */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserCategory)} className="w-full flex-1 flex flex-col min-h-0">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:grid-cols-7 gap-1">
              {(Object.keys(categoryConfig) as UserCategory[]).map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                  <span className="hidden md:inline">{categoryConfig[category].label}</span>
                  <span className="md:hidden">{categoryConfig[category].shortLabel}</span>
                  <span className="ml-1 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                    {getCategoryCount(category)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Content for all tabs */}
          {(Object.keys(categoryConfig) as UserCategory[]).map((category) => (
            <TabsContent key={category} value={category} className="mt-4 flex-1 min-h-0">
              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredUsuarios.length === 0 ? (
                <div className="card-elevated p-8 sm:p-12 text-center">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Não há usuários nesta categoria que correspondam à sua busca.
                  </p>
                </div>
              ) : (
                <div className="card-elevated overflow-hidden animate-slide-up h-full flex flex-col">
                  <ScrollArea className="flex-1 h-[calc(100vh-400px)] min-h-[300px]">
                    {/* Mobile Card View */}
                    <div className="block lg:hidden p-4 space-y-3">
                      {filteredUsuarios.map((usuario) => (
                        <div
                          key={usuario.id}
                          className="bg-muted/30 rounded-lg p-4 border border-border/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                {usuario.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground truncate">{usuario.nome}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {shouldShowEmail(currentUserRole) ? usuario.email : maskEmail(usuario.email)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {canEditRole(currentUserRole, usuario.role) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(usuario)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteDialog(usuario.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full font-medium',
                              cargoConfig[usuario.role]?.color || 'bg-muted text-muted-foreground'
                            )}>
                              {cargoConfig[usuario.role]?.label || usuario.role}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Building className="w-3 h-3" />
                              {usuario.unidade?.nome || 'Não atribuída'}
                            </span>
                            {usuario.matricula && (
                              <span className="text-muted-foreground">
                                Mat: {usuario.matricula}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 xl:px-6 text-sm font-medium text-muted-foreground">
                              Usuário
                            </th>
                            <th className="text-left py-3 px-4 xl:px-6 text-sm font-medium text-muted-foreground">
                              Cargo
                            </th>
                            <th className="text-left py-3 px-4 xl:px-6 text-sm font-medium text-muted-foreground">
                              Unidade
                            </th>
                            <th className="text-left py-3 px-4 xl:px-6 text-sm font-medium text-muted-foreground">
                              Matrícula
                            </th>
                            <th className="text-right py-3 px-4 xl:px-6 text-sm font-medium text-muted-foreground">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsuarios.map((usuario) => (
                            <tr
                              key={usuario.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-3 px-4 xl:px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                    {usuario.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground text-sm truncate max-w-[200px] xl:max-w-none">{usuario.nome}</p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Mail className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate max-w-[180px] xl:max-w-none">
                                        {shouldShowEmail(currentUserRole) ? usuario.email : maskEmail(usuario.email)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 xl:px-6">
                                <span className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                  cargoConfig[usuario.role]?.color || 'bg-muted text-muted-foreground'
                                )}>
                                  {cargoConfig[usuario.role]?.label || usuario.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 xl:px-6">
                                <div className="flex items-center gap-1 text-foreground text-sm">
                                  <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate max-w-[150px] xl:max-w-none">
                                    {usuario.unidade?.nome || 'Não atribuída'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 xl:px-6">
                                <span className="text-sm text-muted-foreground">
                                  {usuario.matricula || '-'}
                                </span>
                              </td>
                              <td className="py-3 px-4 xl:px-6 text-right">
                                {canEditRole(currentUserRole, usuario.role) ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openEditDialog(usuario)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => openDeleteDialog(usuario.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                  
                  {/* Footer with count */}
                  <div className="border-t border-border p-3 text-center text-sm text-muted-foreground bg-muted/30">
                    Exibindo {filteredUsuarios.length} usuário{filteredUsuarios.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) { setIsEditOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-matricula">Matrícula</Label>
              <Input
                id="edit-matricula"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unidade">Unidade</Label>
              <Select
                value={formData.unidade_id}
                onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
              >
                <SelectTrigger id="edit-unidade">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {availableUnidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Cargo</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as AppRole })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {cargoConfig[role].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}