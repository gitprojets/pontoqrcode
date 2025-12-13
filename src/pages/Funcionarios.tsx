import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical,
  Mail,
  Phone,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  cargo: string;
  turno: string;
  status: 'ativo' | 'inativo';
  telefone?: string;
}

const mockFuncionarios: Funcionario[] = [
  {
    id: '1',
    nome: 'Maria Silva Santos',
    email: 'maria.silva@escola.edu.br',
    matricula: 'PROF-2024-001',
    cargo: 'Professor',
    turno: 'Matutino',
    status: 'ativo',
    telefone: '(11) 99999-0001',
  },
  {
    id: '2',
    nome: 'José Carlos Oliveira',
    email: 'jose.oliveira@escola.edu.br',
    matricula: 'PROF-2024-002',
    cargo: 'Professor',
    turno: 'Vespertino',
    status: 'ativo',
    telefone: '(11) 99999-0002',
  },
  {
    id: '3',
    nome: 'Ana Paula Lima',
    email: 'ana.lima@escola.edu.br',
    matricula: 'COORD-2024-001',
    cargo: 'Coordenador',
    turno: 'Integral',
    status: 'ativo',
    telefone: '(11) 99999-0003',
  },
  {
    id: '4',
    nome: 'Roberto Mendes',
    email: 'roberto.mendes@escola.edu.br',
    matricula: 'PROF-2024-003',
    cargo: 'Professor',
    turno: 'Matutino',
    status: 'inativo',
    telefone: '(11) 99999-0004',
  },
  {
    id: '5',
    nome: 'Patricia Costa',
    email: 'patricia.costa@escola.edu.br',
    matricula: 'ADM-2024-001',
    cargo: 'Administrativo',
    turno: 'Matutino',
    status: 'ativo',
    telefone: '(11) 99999-0005',
  },
];

export default function Funcionarios() {
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState(mockFuncionarios);

  const handleSearch = (value: string) => {
    setSearch(value);
    const filtered = mockFuncionarios.filter(
      (f) =>
        f.nome.toLowerCase().includes(value.toLowerCase()) ||
        f.email.toLowerCase().includes(value.toLowerCase()) ||
        f.matricula.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Funcionários
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os funcionários da unidade
            </p>
          </div>
          
          <Button variant="gradient" className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Funcionário
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou matrícula..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">Filtros</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">45</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">42</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Building className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">32</p>
              <p className="text-sm text-muted-foreground">Professores</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">13</p>
              <p className="text-sm text-muted-foreground">Outros</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="card-elevated overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
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
                    Turno
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Status
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
                      <span className="text-foreground">{funcionario.matricula}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-foreground">{funcionario.cargo}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-foreground">{funcionario.turno}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        funcionario.status === 'ativo'
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {funcionario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
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
        </div>
      </div>
    </MainLayout>
  );
}
