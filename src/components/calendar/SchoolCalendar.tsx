import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolEvents, SchoolEvent } from '@/hooks/useSchoolEvents';
import { EventDialog } from './EventDialog';
import { format, isSameDay, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface SchoolCalendarProps {
  onEventClick?: (event: SchoolEvent) => void;
}

export function SchoolCalendar({ onEventClick }: SchoolCalendarProps) {
  const { profile, role } = useAuth();
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useSchoolEvents(profile?.unidade_id);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const canEdit = role === 'diretor' || role === 'administrador' || role === 'desenvolvedor';
  const canManageGlobal = role === 'administrador' || role === 'desenvolvedor';

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDay = useMemo(() => {
    return (day: number): SchoolEvent[] => {
      const date = new Date(year, month, day);
      return events.filter(event => {
        const startDate = parseISO(event.data_inicio);
        const endDate = event.data_fim ? parseISO(event.data_fim) : startDate;
        
        return isWithinInterval(date, { 
          start: startOfDay(startDate), 
          end: endOfDay(endDate) 
        }) || isSameDay(date, startDate);
      });
    };
  }, [events, year, month]);

  const getDayType = (day: number): { type: SchoolEvent['tipo'] | 'letivo'; label?: string } => {
    const dayEvents = getEventsForDay(day);
    
    if (dayEvents.length > 0) {
      // Priority: feriado > recesso > folga > reposicao > evento
      const priority = ['feriado', 'recesso', 'folga', 'reposicao', 'evento'];
      const sortedEvents = [...dayEvents].sort((a, b) => 
        priority.indexOf(a.tipo) - priority.indexOf(b.tipo)
      );
      return { type: sortedEvents[0].tipo, label: sortedEvents[0].titulo };
    }

    const dayOfWeek = new Date(year, month, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { type: 'folga' };
    }

    return { type: 'letivo' };
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const typeStyles: Record<string, string> = {
    letivo: 'bg-card hover:bg-muted/50 text-foreground border border-border/50',
    folga: 'bg-muted/50 text-muted-foreground',
    feriado: 'bg-destructive/10 text-destructive border border-destructive/20',
    reposicao: 'bg-warning/10 text-warning border border-warning/20',
    evento: 'bg-primary/10 text-primary border border-primary/20',
    recesso: 'bg-secondary/10 text-secondary-foreground border border-secondary/20',
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDayClick = (day: number) => {
    if (!canEdit) return;
    
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setSelectedDate(null);
    } else {
      setSelectedEvent(null);
      setSelectedDate(new Date(year, month, day));
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (eventData: Omit<SchoolEvent, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedEvent) {
      await updateEvent(selectedEvent.id, eventData);
    } else {
      await createEvent(eventData);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEvent(id);
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="card-elevated p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Calendário Escolar
          </h2>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNewEvent}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Evento</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-lg font-medium min-w-[160px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-card border border-border" />
            <span className="text-muted-foreground">Letivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-muted-foreground">Folga</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive/50" />
            <span className="text-muted-foreground">Feriado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning/50" />
            <span className="text-muted-foreground">Reposição</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/50" />
            <span className="text-muted-foreground">Evento</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          /* Calendar Grid */
          <div className="grid grid-cols-7 gap-2">
            {/* Week days header */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}

            {/* Days */}
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />;
              }

              const { type, label } = getDayType(day);
              const dayEvents = getEventsForDay(day);
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200 text-sm',
                    typeStyles[type],
                    isToday(day) && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                    canEdit && 'cursor-pointer hover:scale-105',
                    !canEdit && 'cursor-default'
                  )}
                  title={label}
                  disabled={!canEdit}
                >
                  <span className="font-medium">{day}</span>
                  {hasEvents && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((_, i) => (
                        <span 
                          key={i}
                          className="w-1 h-1 rounded-full bg-current opacity-70" 
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        event={selectedEvent}
        selectedDate={selectedDate}
        onSave={handleSave}
        onDelete={handleDelete}
        unidadeId={profile?.unidade_id}
        canManageGlobal={canManageGlobal}
      />
    </>
  );
}
