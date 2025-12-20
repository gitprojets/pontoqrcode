import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Shield, RefreshCw, User, Calendar, Database } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
  user_name?: string;
}

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: 'bg-green-500/10 text-green-600 border-green-500/20',
  USER_LOGOUT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  USER_CREATED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  USER_UPDATED: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  USER_DELETED: 'bg-red-500/10 text-red-600 border-red-500/20',
  ROLE_CHANGED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  EXPORT_DATA: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  SETTINGS_CHANGED: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,table_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user names for the logs
      if (data && data.length > 0) {
        const userIds = [...new Set(data.filter(l => l.user_id).map(l => l.user_id))];
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', userIds as string[]);

          const profileMap = new Map(profiles?.map(p => [p.id, p.nome]) || []);
          
          const logsWithNames = data.map(log => ({
            ...log,
            user_name: log.user_id ? profileMap.get(log.user_id) || 'Usuário desconhecido' : 'Sistema'
          }));

          setLogs(logsWithNames);
        } else {
          setLogs(data.map(log => ({ ...log, user_name: 'Sistema' })));
        }
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, searchTerm]);

  const uniqueActions = [
    'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
    'ROLE_CHANGED', 'UNIDADE_CREATED', 'UNIDADE_UPDATED', 'UNIDADE_DELETED',
    'DISPOSITIVO_CREATED', 'DISPOSITIVO_UPDATED', 'REGISTRO_CREATED',
    'JUSTIFICATIVA_CREATED', 'JUSTIFICATIVA_APPROVED', 'EXPORT_DATA', 'SETTINGS_CHANGED'
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Logs de Auditoria
            </h1>
            <p className="text-muted-foreground mt-1">
              Rastreamento de todas as ações administrativas do sistema
            </p>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ação ou tabela..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log de auditoria encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={ACTION_COLORS[log.action] || 'bg-gray-500/10 text-gray-600'}
                            >
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                            {log.table_name && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                {log.table_name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {log.user_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                            </span>
                            {log.record_id && (
                              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                ID: {log.record_id.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {logs.length > 0 && (
              <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Página {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={logs.length < ITEMS_PER_PAGE}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
