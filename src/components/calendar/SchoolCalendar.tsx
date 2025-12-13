import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DayInfo {
  date: number;
  type: 'letivo' | 'folga' | 'feriado' | 'reposicao';
  label?: string;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Sample special days
const specialDays: Record<string, DayInfo['type'] | { type: DayInfo['type']; label: string }> = {
  '2024-12-25': { type: 'feriado', label: 'Natal' },
  '2024-12-31': { type: 'folga', label: 'Recesso' },
  '2024-12-24': { type: 'folga', label: 'Véspera de Natal' },
  '2024-11-15': { type: 'feriado', label: 'Proclamação da República' },
  '2024-11-20': { type: 'feriado', label: 'Consciência Negra' },
};

export function SchoolCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDayType = (day: number): { type: DayInfo['type']; label?: string } => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const special = specialDays[dateStr];
    
    if (special) {
      return typeof special === 'string' ? { type: special } : special;
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

  const typeStyles = {
    letivo: 'bg-card hover:bg-muted/50 text-foreground',
    folga: 'bg-muted/50 text-muted-foreground',
    feriado: 'bg-destructive/10 text-destructive',
    reposicao: 'bg-warning/10 text-warning',
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="card-elevated p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-semibold text-foreground">
          Calendário Escolar
        </h2>
        <div className="flex items-center gap-2">
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
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-card border" />
          <span>Dia Letivo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <span>Folga</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/50" />
          <span>Feriado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning/50" />
          <span>Reposição</span>
        </div>
      </div>

      {/* Calendar Grid */}
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

          return (
            <button
              key={day}
              className={cn(
                'relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200 text-sm',
                typeStyles[type],
                isToday(day) && 'ring-2 ring-primary ring-offset-2'
              )}
              title={label}
            >
              <span className="font-medium">{day}</span>
              {label && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
