import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppRole } from '@/hooks/useUsuarios';

interface Unidade {
  id: string;
  nome: string;
}

interface CreateUserDialogProps {
  unidades: Unidade[];
  onSuccess: () => void;
}

// Define quais roles cada role pode criar
// Diretor, Coordenador e Secretário não podem criar usuários
const rolePermissions: Record<AppRole, AppRole[]> = {
  desenvolvedor: ['administrador', 'diretor', 'coordenador', 'professor', 'secretario', 'outro'],
  administrador: ['diretor', 'coordenador', 'professor', 'secretario', 'outro'],
  diretor: [], // Diretor não pode criar usuários
  coordenador: [], // Coordenador não pode criar usuários
  professor: [],
  secretario: [], // Secretário não pode criar usuários
  outro: [],
};

const roleLabels: Record<AppRole, string> = {
  professor: 'Professor',
  diretor: 'Diretor',
  administrador: 'Administrador',
  desenvolvedor: 'Desenvolvedor',
  coordenador: 'Coordenador',
  secretario: 'Secretário',
  outro: 'Outro',
};

export function CreateUserDialog({ unidades, onSuccess }: CreateUserDialogProps) {
  const { role: currentUserRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    matricula: '',
    unidade_id: '',
    role: 'professor' as AppRole,
  });
  const [selectedAdminUnidades, setSelectedAdminUnidades] = useState<string[]>([]);

  const allowedRoles = currentUserRole ? rolePermissions[currentUserRole] : [];
  const canCreateUsers = allowedRoles.length > 0;
  const isCreatingAdmin = formData.role === 'administrador';
  const isDev = currentUserRole === 'desenvolvedor';

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      password: '',
      matricula: '',
      unidade_id: '',
      role: 'professor',
    });
    setSelectedAdminUnidades([]);
  };

  const toggleUnidade = (unidadeId: string) => {
    setSelectedAdminUnidades(prev => 
      prev.includes(unidadeId) 
        ? prev.filter(id => id !== unidadeId)
        : [...prev, unidadeId]
    );
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.email || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Client-side check for UX only - server validates permissions
    if (!allowedRoles.includes(formData.role)) {
      toast.error('Você não tem permissão para criar usuários com este cargo');
      return;
    }

    // Validar que ao criar administrador, ao menos uma unidade está selecionada
    if (isCreatingAdmin && isDev && selectedAdminUnidades.length === 0) {
      toast.error('Selecione ao menos uma unidade para o administrador');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call Edge Function for server-side validated user creation
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          nome: formData.nome,
          role: formData.role,
          unidade_id: formData.unidade_id || null,
          matricula: formData.matricula || null,
          admin_unidades: isCreatingAdmin && isDev ? selectedAdminUnidades : null,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar usuário');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Usuário criado com sucesso!');
      setIsOpen(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreateUsers) {
    return null;
  }

  const getRoleDescription = () => {
    if (currentUserRole === 'desenvolvedor') {
      return 'Como desenvolvedor, você pode criar todos os tipos de usuários';
    }
    if (currentUserRole === 'administrador') {
      return 'Como administrador, você pode criar Diretores, Coordenadores, Professores, Secretários e Outros';
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome *</label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="text-sm font-medium">E-mail *</label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              type="email"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Senha *</label>
            <Input
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              type="password"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Matrícula</label>
            <Input
              value={formData.matricula}
              onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
              placeholder="Número de matrícula"
            />
          </div>
          
          {/* Unidade para usuários não-administradores */}
          {!isCreatingAdmin && (
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
          )}

          <div>
            <label className="text-sm font-medium">Cargo *</label>
            <Select
              value={formData.role}
              onValueChange={(value: AppRole) => {
                setFormData({ ...formData, role: value });
                if (value !== 'administrador') {
                  setSelectedAdminUnidades([]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {getRoleDescription()}
            </p>
          </div>

          {/* Seleção de múltiplas unidades para Administrador (apenas desenvolvedor pode ver) */}
          {isCreatingAdmin && isDev && (
            <div>
              <label className="text-sm font-medium">Unidades do Administrador *</label>
              <p className="text-xs text-muted-foreground mb-2">
                Selecione as escolas que este administrador poderá gerenciar
              </p>
              <ScrollArea className="h-48 rounded-md border p-3">
                <div className="space-y-2">
                  {unidades.map((unidade) => (
                    <div key={unidade.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`unidade-${unidade.id}`}
                        checked={selectedAdminUnidades.includes(unidade.id)}
                        onCheckedChange={() => toggleUnidade(unidade.id)}
                      />
                      <Label 
                        htmlFor={`unidade-${unidade.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {unidade.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedAdminUnidades.length} unidade(s) selecionada(s)
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="gradient" 
            onClick={handleSubmit}
            disabled={!formData.nome || !formData.email || !formData.password || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}