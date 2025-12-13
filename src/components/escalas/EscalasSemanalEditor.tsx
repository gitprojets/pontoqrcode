import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, Calendar, Clock, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useEscalas } from '@/hooks/useEscalas';

interface EscalaDia {
  dia_semana: number;
  hora_entrada: string;
  hora_saida: string;
  is_folga: boolean;
}

interface Props {
  professorId: string;
  professorNome: string;
  unidadeId: string;
  onClose: () => void;
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function EscalasSemanalEditor({ professorId, professorNome, unidadeId, onClose }: Props) {
  const [currentWeek, setCurrentWeek] = useState(() => 
    startOfWeek(new Date(), { locale: ptBR })
  );
  const [escalas, setEscalas] = useState<EscalaDia[]>(() => 
    DIAS_SEMANA.map((_, index) => ({
      dia_semana: index,
      hora_entrada: index === 0 || index === 6 ? '' : '08:00',
      hora_saida: index === 0 || index === 6 ? '' : '17:00',
      is_folga: index === 0 || index === 6,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  
  const { fetchEscalas, upsertEscalasSemana, escalas: existingEscalas } = useEscalas(unidadeId);

  const semanaInicioStr = format(currentWeek, 'yyyy-MM-dd');

  useEffect(() => {
    fetchEscalas(semanaInicioStr);
  }, [semanaInicioStr]);

  useEffect(() => {
    // Load existing escalas for this professor and week
    const professorEscalas = existingEscalas.filter(
      e => e.professor_id === professorId && e.semana_inicio === semanaInicioStr
    );

    if (professorEscalas.length > 0) {
      const loadedEscalas = DIAS_SEMANA.map((_, index) => {
        const existing = professorEscalas.find(e => e.dia_semana === index);
        if (existing) {
          return {
            dia_semana: index,
            hora_entrada: existing.hora_entrada || '',
            hora_saida: existing.hora_saida || '',
            is_folga: existing.is_folga,
          };
        }
        return {
          dia_semana: index,
          hora_entrada: index === 0 || index === 6 ? '' : '08:00',
          hora_saida: index === 0 || index === 6 ? '' : '17:00',
          is_folga: index === 0 || index === 6,
        };
      });
      setEscalas(loadedEscalas);
    }
  }, [existingEscalas, professorId, semanaInicioStr]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const escalaData = escalas.map(e => ({
        dia_semana: e.dia_semana,
        hora_entrada: e.is_folga ? null : e.hora_entrada || null,
        hora_saida: e.is_folga ? null : e.hora_saida || null,
        is_folga: e.is_folga,
      }));

      await upsertEscalasSemana(professorId, unidadeId, semanaInicioStr, escalaData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const updateEscala = (index: number, field: keyof EscalaDia, value: any) => {
    setEscalas(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const getDayDate = (dayIndex: number) => {
    return addDays(currentWeek, dayIndex);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">
            Escala de Trabalho
          </h3>
          <p className="text-sm text-muted-foreground">{professorNome}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(prev => subWeeks(prev, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Semana de {format(currentWeek, "d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(prev => addWeeks(prev, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid gap-3">
        {escalas.map((escala, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border transition-all ${
              escala.is_folga 
                ? 'bg-muted/50 border-border' 
                : 'bg-card border-primary/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  escala.is_folga ? 'bg-warning/10' : 'bg-primary/10'
                }`}>
                  {escala.is_folga ? (
                    <Coffee className="w-5 h-5 text-warning" />
                  ) : (
                    <Clock className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{DIAS_SEMANA[index]}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(getDayDate(index), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {!escala.is_folga && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Entrada</Label>
                      <Input
                        type="time"
                        value={escala.hora_entrada}
                        onChange={(e) => updateEscala(index, 'hora_entrada', e.target.value)}
                        className="w-28"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Saída</Label>
                      <Input
                        type="time"
                        value={escala.hora_saida}
                        onChange={(e) => updateEscala(index, 'hora_saida', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Switch
                    checked={escala.is_folga}
                    onCheckedChange={(checked) => updateEscala(index, 'is_folga', checked)}
                  />
                  <Label className="text-sm text-muted-foreground">Folga</Label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="gradient" onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar Escala'}
        </Button>
      </div>
    </div>
  );
}
