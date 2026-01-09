/**
 * Utilitários centralizados para manipulação de datas
 * Elimina duplicação de código em todo o projeto
 */

/**
 * Retorna a data atual no formato ISO (YYYY-MM-DD)
 */
export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Retorna o horário atual no formato HH:MM
 */
export const getCurrentTime = (): string => {
  return new Date().toTimeString().slice(0, 5);
};

/**
 * Retorna o horário atual no formato HH:MM:SS
 */
export const getCurrentTimeWithSeconds = (): string => {
  return new Date().toTimeString().split(' ')[0];
};

/**
 * Calcula uma estimativa de dias úteis baseado no total de dias
 * Assume uma semana de 5 dias úteis (seg-sex)
 */
export const calculateWorkingDays = (totalDays: number): number => {
  return Math.round(totalDays * 5 / 7);
};

/**
 * Retorna a data de início da semana atual (domingo)
 */
export const getWeekStartISO = (date: Date = new Date()): string => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
};

/**
 * Retorna a data de início do mês atual
 */
export const getMonthStartISO = (date: Date = new Date()): string => {
  const d = new Date(date);
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

/**
 * Retorna o dia da semana (0 = Domingo, 6 = Sábado)
 */
export const getDayOfWeek = (date: Date = new Date()): number => {
  return date.getDay();
};

/**
 * Retorna o número de dias no mês atual até hoje
 */
export const getDaysInCurrentMonth = (): number => {
  return new Date().getDate();
};

/**
 * Formata uma data para exibição em português
 */
export const formatDateBR = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
};

/**
 * Formata uma data e hora para exibição em português
 */
export const formatDateTimeBR = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
};

/**
 * Verifica se uma data é hoje
 */
export const isToday = (dateString: string): boolean => {
  return dateString === getTodayISO();
};

/**
 * Nomes dos dias da semana em português
 */
export const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Retorna o nome do dia da semana
 */
export const getDayName = (dayIndex: number): string => {
  return dayNames[dayIndex] || '';
};
