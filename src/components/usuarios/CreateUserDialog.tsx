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
const rolePermissions: Record<AppRole, AppRole[]> = {
  desenvolvedor: ['administrador', 'diretor', 'coordenador', 'professor', 'secretario', 'outro'],
  administrador: ['diretor', 'coordenador', 'professor', 'secretario', 'outro'],
  diretor: ['coordenador', 'professor', 'secretario'],
  coordenador: [],
  professor: [],
  secretario: [],
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

  const allowedRoles = currentUserRole ? rolePermissions[currentUserRole] : [];

  const canCreateUsers = allowedRoles.length > 0;

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      password: '',
      matricula: '',
      unidade_id: '',
      role: 'professor',
    });
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
    if (currentUserRole === 'diretor') {
      return 'Como diretor, você pode criar Coordenadores, Professores e Secretários';
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
      <DialogContent>
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
            <label className="text-sm font-medium">Cargo *</label>
            <Select
              value={formData.role}
              onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
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
