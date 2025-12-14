import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  MoreVertical,
  Mail,
  Building,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  unidade_id: string | null;
  unidade_nome: string | null;
  role: string;
}

const roleLabels: Record<string, string> = {
  professor: 'Professor',
  diretor: 'Diretor',
  administrador: 'Administrador',
  desenvolvedor: 'Desenvolvedor',
  coordenador: 'Coordenador',
  secretario: 'Secretário',
  outro: 'Outro',
};

export default function Funcionarios() {
  const { profile, role } = useAuth();
  const [search, setSearch] = useState('');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFuncionarios();
  }, [profile, role]);

  const fetchFuncionarios = async () => {
    try {
      setIsLoading(true);
      
      // Buscar profiles com suas roles
      let query = supabase
        .from('profiles')
        .select(`
          id,
          nome,
          email,
          matricula,
          unidade_id,
          unidades:unidade_id(nome)
        `)
        .order('nome');

      // Para diretor, coordenador e secretário, filtrar apenas funcionários da sua unidade
      if ((role === 'diretor' || role === 'coordenador' || role === 'secretario') && profile?.unidade_id) {
        query = query.eq('unidade_id', profile.unidade_id);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      // Buscar roles separadamente
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      const formattedData: Funcionario[] = (profiles || []).map(p => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        matricula: p.matricula,
        unidade_id: p.unidade_id,
        unidade_nome: Array.isArray(p.unidades) ? p.unidades[0]?.nome : (p.unidades as any)?.nome || null,
        role: rolesMap.get(p.id) || 'professor',
      }));

      setFuncionarios(formattedData);
    } catch (error) {
      console.error('Error fetching funcionarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = funcionarios.filter(
    (f) =>
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      (f.matricula && f.matricula.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: funcionarios.length,
    ativos: funcionarios.length,
    professores: funcionarios.filter(f => f.role === 'professor').length,
    outros: funcionarios.filter(f => f.role !== 'professor').length,
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Funcionários
            </h1>
            <p className="text-muted-foreground mt-1">
              {role === 'diretor' || role === 'coordenador' || role === 'secretario' 
                ? 'Funcionários da sua unidade'
                : 'Visualize os funcionários do sistema'
              }
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.ativos}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Building className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.professores}</p>
              <p className="text-sm text-muted-foreground">Professores</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Users className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.outros}</p>
              <p className="text-sm text-muted-foreground">Outros</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          /* List */
          <div className="card-elevated overflow-hidden animate-slide-up">
            {/* Mobile Cards */}
            <div className="block md:hidden">
              <ScrollArea className="h-[60vh]">
                <div className="divide-y divide-border">
                  {filteredData.map((funcionario) => (
                    <div key={funcionario.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {funcionario.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{funcionario.nome}</p>
                            <p className="text-xs text-muted-foreground">{funcionario.email}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {roleLabels[funcionario.role] || funcionario.role}
                        </span>
                        {funcionario.matricula && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full">
                            {funcionario.matricula}
                          </span>
                        )}
                        {funcionario.unidade_nome && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full">
                            {funcionario.unidade_nome}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Funcionário
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Matrícula
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Cargo
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Unidade
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((funcionario) => (
                    <tr
                      key={funcionario.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {funcionario.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{funcionario.nome}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {funcionario.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-foreground">{funcionario.matricula || '-'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                          'bg-primary/10 text-primary'
                        )}>
                          {roleLabels[funcionario.role] || funcionario.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-foreground">{funcionario.unidade_nome || '-'}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && !isLoading && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum funcionário encontrado
                </h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros de busca
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}