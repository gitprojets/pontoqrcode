import { MainLayout } from '@/components/layout/MainLayout';
import { SchoolCalendar } from '@/components/calendar/SchoolCalendar';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Calendario() {
  const { role } = useAuth();
  const canEdit = role === 'diretor' || role === 'administrador';

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Calendário Escolar
            </h1>
            <p className="text-muted-foreground mt-1">
              {canEdit 
                ? 'Gerencie dias letivos, folgas e feriados'
                : 'Visualize os dias letivos e folgas'
              }
            </p>
          </div>
          
          {canEdit && (
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Importar
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Evento
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SchoolCalendar />
          </div>
          
          <div className="space-y-6">
            <div className="card-elevated p-6 animate-slide-up">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                Próximos Eventos
              </h2>
              <div className="space-y-3">
                {[
                  { data: '24 Dez', evento: 'Véspera de Natal', tipo: 'folga' },
                  { data: '25 Dez', evento: 'Natal', tipo: 'feriado' },
                  { data: '31 Dez', evento: 'Réveillon', tipo: 'folga' },
                  { data: '01 Jan', evento: 'Ano Novo', tipo: 'feriado' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs text-muted-foreground">
                        {item.data.split(' ')[1]}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {item.data.split(' ')[0]}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.evento}</p>
                      <p className={`text-xs ${
                        item.tipo === 'feriado' ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {item.tipo === 'feriado' ? 'Feriado' : 'Folga'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                Resumo do Mês
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Dias letivos</span>
                  <span className="font-semibold text-foreground">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Folgas</span>
                  <span className="font-semibold text-foreground">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Feriados</span>
                  <span className="font-semibold text-foreground">5</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-muted-foreground">Total de dias</span>
                  <span className="font-semibold text-foreground">31</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
