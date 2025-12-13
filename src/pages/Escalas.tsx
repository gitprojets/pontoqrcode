import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  Search, 
  Users, 
  Clock,
  Coffee,
  ChevronRight,
} from 'lucide-react';
import { EscalasSemanalEditor } from '@/components/escalas/EscalasSemanalEditor';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Professor {
  id: string;
  nome: string;
  matricula: string | null;
  foto: string | null;
}

export default function Escalas() {
  const { profile } = useAuth();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [escalasSemana, setEscalasSemana] = useState<Record<string, any[]>>({});

  const unidadeId = profile?.unidade_id;
  const currentWeek = startOfWeek(new Date(), { locale: ptBR });
  const semanaInicioStr = format(currentWeek, 'yyyy-MM-dd');

  useEffect(() => {
    const fetchProfessores = async () => {
      if (!unidadeId) return;
      
      setIsLoading(true);
      try {
        // Get all professors in the unit
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, nome, matricula, foto')
          .eq('unidade_id', unidadeId);

        if (error) throw error;

        // Filter to get only professors (by checking user_roles)
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'professor');

        const professorIds = new Set(roles?.map(r => r.user_id) || []);
        const filteredProfessores = (profiles || []).filter(p => professorIds.has(p.id));
        
        setProfessores(filteredProfessores);

        // Fetch current week's schedules
        const { data: escalas } = await supabase
          .from('escalas_trabalho')
          .select('*')
          .eq('unidade_id', unidadeId)
          .eq('semana_inicio', semanaInicioStr);

        const escalasByProfessor: Record<string, any[]> = {};
        (escalas || []).forEach(e => {
          if (!escalasByProfessor[e.professor_id]) {
            escalasByProfessor[e.professor_id] = [];
          }
          escalasByProfessor[e.professor_id].push(e);
        });
        setEscalasSemana(escalasByProfessor);

      } catch (error) {
        console.error('Error fetching professors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfessores();
  }, [unidadeId, semanaInicioStr]);

  const filteredProfessores = professores.filter(p =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.matricula?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEscalaResumo = (professorId: string) => {
    const escalas = escalasSemana[professorId] || [];
    if (escalas.length === 0) return 'Sem escala definida';

    const diasTrabalho = escalas.filter(e => !e.is_folga).length;
    const folgas = escalas.filter(e => e.is_folga).length;

    return `${diasTrabalho} dias de trabalho, ${folgas} folgas`;
  };

  const handleOpenEditor = (professor: Professor) => {
    setSelectedProfessor(professor);
    setIsDialogOpen(true);
  };

  const handleCloseEditor = () => {
    setIsDialogOpen(false);
    setSelectedProfessor(null);
    // Refresh data
    window.location.reload();
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Escalas de Trabalho
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os horários e dias de trabalho dos professores
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{professores.length}</p>
              <p className="text-sm text-muted-foreground">Professores</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {Object.keys(escalasSemana).length}
              </p>
              <p className="text-sm text-muted-foreground">Com escala definida</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Coffee className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {professores.length - Object.keys(escalasSemana).length}
              </p>
              <p className="text-sm text-muted-foreground">Sem escala</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar professor por nome ou matrícula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Week Info */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            Semana atual: <strong>{format(currentWeek, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
          </span>
        </div>

        {/* Professors List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredProfessores.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado nesta unidade'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProfessores.map((professor) => (
              <div
                key={professor.id}
                className="card-elevated p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleOpenEditor(professor)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {professor.foto ? (
                      <img 
                        src={professor.foto} 
                        alt={professor.nome}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{professor.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {professor.matricula || 'Sem matrícula'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {getEscalaResumo(professor.id)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Editor Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Escala de Trabalho</DialogTitle>
            </DialogHeader>
            {selectedProfessor && unidadeId && (
              <EscalasSemanalEditor
                professorId={selectedProfessor.id}
                professorNome={selectedProfessor.nome}
                unidadeId={unidadeId}
                onClose={handleCloseEditor}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
