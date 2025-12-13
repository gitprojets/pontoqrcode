import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SchoolCalendar } from '@/components/calendar/SchoolCalendar';
import { Button } from '@/components/ui/button';
import { Download, Upload, CalendarDays, Clock, Calendar as CalendarIcon, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolEvents } from '@/hooks/useSchoolEvents';
import { format, isThisMonth, parseISO, isAfter, startOfToday, endOfMonth, isWithinInterval, startOfMonth, eachDayOfInterval, isWeekend, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';

export default function Calendario() {
  const { role, profile } = useAuth();
  const { events, isLoading } = useSchoolEvents(profile?.unidade_id);
  const canEdit = role === 'diretor' || role === 'administrador' || role === 'desenvolvedor';

  const today = startOfToday();
  const currentMonth = new Date();

  const upcomingEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = parseISO(event.data_inicio);
        return isAfter(eventDate, today) || format(eventDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      })
      .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
      .slice(0, 5);
  }, [events, today]);

  const monthSummary = useMemo(() => {
    const allDaysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });

    let diasLetivos = 0;
    let folgas = 0;
    let feriados = 0;

    allDaysInMonth.forEach(day => {
      const dayEvents = events.filter(event => {
        const startDate = parseISO(event.data_inicio);
        const endDate = event.data_fim ? parseISO(event.data_fim) : startDate;
        return isWithinInterval(day, { start: startDate, end: endDate }) || 
               format(day, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd');
      });

      if (dayEvents.some(e => e.tipo === 'feriado')) {
        feriados++;
      } else if (dayEvents.some(e => e.tipo === 'folga' || e.tipo === 'recesso')) {
        folgas++;
      } else if (isWeekend(day)) {
        folgas++;
      } else {
        diasLetivos++;
      }
    });

    return { diasLetivos, folgas, feriados, total: allDaysInMonth.length };
  }, [events, currentMonth]);

  const handleExportCalendar = () => {
    const calendarData = events
      .filter(event => isSameMonth(parseISO(event.data_inicio), currentMonth) || 
                       (event.data_fim && isSameMonth(parseISO(event.data_fim), currentMonth)))
      .map(event => ({
        data: format(parseISO(event.data_inicio), 'dd/MM/yyyy'),
        dataFim: event.data_fim ? format(parseISO(event.data_fim), 'dd/MM/yyyy') : '-',
        titulo: event.titulo,
        tipo: event.tipo.charAt(0).toUpperCase() + event.tipo.slice(1),
        descricao: event.descricao || '-',
      }));

    exportToPDF({
      title: 'Calendário Escolar',
      subtitle: `Período: ${format(currentMonth, 'MMMM yyyy', { locale: ptBR })}`,
      columns: [
        { header: 'Data Início', key: 'data', width: 25 },
        { header: 'Data Fim', key: 'dataFim', width: 25 },
        { header: 'Evento', key: 'titulo', width: 50 },
        { header: 'Tipo', key: 'tipo', width: 25 },
        { header: 'Descrição', key: 'descricao', width: 60 },
      ],
      data: calendarData,
      filename: `calendario_${format(currentMonth, 'yyyy_MM')}`,
      orientation: 'landscape',
    });

    toast.success('Calendário exportado com sucesso!');
  };

  const tipoColors: Record<string, string> = {
    feriado: 'text-destructive',
    folga: 'text-muted-foreground',
    reposicao: 'text-warning',
    evento: 'text-primary',
    recesso: 'text-secondary-foreground',
  };

  const tipoLabels: Record<string, string> = {
    feriado: 'Feriado',
    folga: 'Folga',
    reposicao: 'Reposição',
    evento: 'Evento',
    recesso: 'Recesso',
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
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
              <Button variant="outline" className="gap-2" onClick={handleExportCalendar}>
                <Download className="w-4 h-4" />
                Exportar
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
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Próximos Eventos
                </h2>
              </div>
              
              {upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum evento próximo</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="text-center min-w-[50px]">
                        <p className="text-xs text-muted-foreground uppercase">
                          {format(parseISO(event.data_inicio), 'MMM', { locale: ptBR })}
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {format(parseISO(event.data_inicio), 'dd')}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{event.titulo}</p>
                        <p className={`text-xs ${tipoColors[event.tipo]}`}>
                          {tipoLabels[event.tipo]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Resumo do Mês
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-success/5 rounded">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-success" />
                    Dias letivos
                  </span>
                  <span className="font-semibold text-foreground">{monthSummary.diasLetivos}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Folgas/Finais de semana
                  </span>
                  <span className="font-semibold text-foreground">{monthSummary.folgas}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-destructive/5 rounded">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-destructive" />
                    Feriados
                  </span>
                  <span className="font-semibold text-foreground">{monthSummary.feriados}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-muted-foreground font-medium">Total de dias</span>
                  <span className="font-bold text-foreground">{monthSummary.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
