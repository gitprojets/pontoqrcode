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
import { Search, Shield, RefreshCw, User, Calendar, Database, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [maskedLogs, setMaskedLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showMasked, setShowMasked] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const { role } = useAuth();
  const isDeveloper = role === 'desenvolvedor';
  const ITEMS_PER_PAGE = 50;

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Fetch unmasked data (developers see everything, others get masked automatically)
      const { data, error } = await supabase.rpc('get_audit_logs_masked', {
        p_limit: ITEMS_PER_PAGE,
        p_offset: (page - 1) * ITEMS_PER_PAGE,
        p_action_filter: actionFilter !== 'all' ? actionFilter : null,
        p_table_filter: searchTerm || null
      });

      if (error) {
        console.error('RPC error, falling back to direct query:', error);
        const { data: directData, error: directError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
        
        if (directError) throw directError;
        
        if (directData && directData.length > 0) {
          await enrichLogsWithUserNames(directData, false);
        } else {
          setLogs([]);
          setMaskedLogs([]);
        }
        return;
      }

      // Get count
      const { data: countData } = await supabase.rpc('count_audit_logs', {
        p_action_filter: actionFilter !== 'all' ? actionFilter : null,
        p_table_filter: searchTerm || null
      });
      
      if (countData !== null) {
        setTotalCount(Number(countData));
      }

      if (data && data.length > 0) {
        // For developers, also generate masked version for comparison
        if (isDeveloper) {
          await enrichLogsWithUserNames(data, false);
          // Generate masked version locally for comparison
          const masked = data.map(log => ({
            ...log,
            old_data: maskSensitiveData(log.old_data),
            new_data: maskSensitiveData(log.new_data),
          }));
          await enrichLogsWithUserNames(masked, true);
        } else {
          await enrichLogsWithUserNames(data, false);
          setMaskedLogs([]);
        }
      } else {
        setLogs([]);
        setMaskedLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Local masking function for developer comparison view
  const maskSensitiveData = (data: unknown): unknown => {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveKeys = ['email', 'telefone', 'phone', 'password', 'senha', 'api_key', 'apikey', 'secret', 'token', 'matricula', 'cpf', 'rg', 'endereco', 'address', 'auth', 'p256dh', 'endpoint'];
    const result = { ...(data as Record<string, unknown>) };
    
    for (const key of Object.keys(result)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        const value = result[key];
        if (typeof value === 'string' && value.length > 0) {
          if (key === 'email' && value.includes('@')) {
            result[key] = value.substring(0, 2) + '***@***.***';
          } else if (['telefone', 'phone'].includes(key)) {
            result[key] = '***-' + value.replace(/[^0-9]/g, '').slice(-4);
          } else if (key === 'matricula') {
            result[key] = '***' + value.slice(-3);
          } else {
            result[key] = '[MASKED]';
          }
        }
      }
    }
    return result;
  };

  const toggleLogExpanded = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const enrichLogsWithUserNames = async (data: AuditLog[], isMasked: boolean) => {
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

      if (isMasked) {
        setMaskedLogs(logsWithNames);
      } else {
        setLogs(logsWithNames);
      }
    } else {
      const logsWithSystem = data.map(log => ({ ...log, user_name: 'Sistema' }));
      if (isMasked) {
        setMaskedLogs(logsWithSystem);
      } else {
        setLogs(logsWithSystem);
      }
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
            <div className="flex flex-col gap-4">
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
              
              {isDeveloper && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    {showMasked ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="mask-toggle" className="text-sm font-medium cursor-pointer">
                      {showMasked ? 'Visualização Mascarada' : 'Visualização Completa'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {showMasked 
                        ? 'Dados sensíveis ocultos (como administradores veem)' 
                        : 'Todos os dados visíveis (apenas desenvolvedores)'}
                    </p>
                  </div>
                  <Switch
                    id="mask-toggle"
                    checked={showMasked}
                    onCheckedChange={setShowMasked}
                  />
                </div>
              )}
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
                  {(showMasked && isDeveloper ? maskedLogs : logs).map((log) => {
                    const isExpanded = expandedLogs.has(log.id);
                    const hasData = log.old_data || log.new_data;
                    
                    return (
                      <Collapsible key={log.id} open={isExpanded} onOpenChange={() => hasData && toggleLogExpanded(log.id)}>
                        <div className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
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
                                {showMasked && isDeveloper && (
                                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Mascarado
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
                            {hasData && (
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="shrink-0">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </CollapsibleTrigger>
                            )}
                          </div>
                          
                          <CollapsibleContent>
                            {hasData && (
                              <div className="mt-4 pt-4 border-t space-y-3">
                                {log.old_data && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Dados Anteriores:</p>
                                    <pre className="text-xs bg-red-500/5 border border-red-500/20 rounded p-2 overflow-x-auto">
                                      {JSON.stringify(log.old_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_data && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Dados Novos:</p>
                                    <pre className="text-xs bg-green-500/5 border border-green-500/20 rounded p-2 overflow-x-auto">
                                      {JSON.stringify(log.new_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
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
                  Página {page} {totalCount > 0 && `de ${Math.ceil(totalCount / ITEMS_PER_PAGE)}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={logs.length < ITEMS_PER_PAGE || page * ITEMS_PER_PAGE >= totalCount}
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
