import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Shield, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity,
  Lock,
  Unlock,
  Users,
  Database,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface SecurityMetrics {
  totalApiKeys: number;
  keysExpiringSoon: number;
  keysExpired: number;
  keysHealthy: number;
  lastRotation: string | null;
  recentLogins: number;
  failedLogins: number;
  activeUsers: number;
  rlsEnabledTables: number;
  totalTables: number;
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface RecentAuditLog {
  id: string;
  action: string;
  table_name: string | null;
  user_name: string;
  created_at: string;
}

interface PendingRotation {
  dispositivo_id: string;
  dispositivo_nome: string;
  next_rotation_at: string;
  days_until_rotation: number;
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentAuditLog[]>([]);
  const [pendingRotations, setPendingRotations] = useState<PendingRotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState<string | null>(null);
  const { role } = useAuth();
  const isDeveloper = role === 'desenvolvedor';

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchRecentLogs(),
        fetchPendingRotations(),
      ]);
      generateAlerts();
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Erro ao carregar dados de segurança');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    // Get API key stats
    const { data: apiKeys } = await supabase
      .from('dispositivo_api_keys')
      .select('dispositivo_id, next_rotation_at, rotated_at');

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let keysExpiringSoon = 0;
    let keysExpired = 0;
    let keysHealthy = 0;
    let lastRotation: string | null = null;

    apiKeys?.forEach(key => {
      if (key.next_rotation_at) {
        const nextRotation = new Date(key.next_rotation_at);
        if (nextRotation <= now) {
          keysExpired++;
        } else if (nextRotation <= sevenDaysFromNow) {
          keysExpiringSoon++;
        } else {
          keysHealthy++;
        }
      }
      if (key.rotated_at && (!lastRotation || key.rotated_at > lastRotation)) {
        lastRotation = key.rotated_at;
      }
    });

    // Get recent login stats from audit logs
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: loginLogs } = await supabase
      .from('audit_logs')
      .select('action')
      .gte('created_at', oneDayAgo)
      .in('action', ['USER_LOGIN', 'LOGIN_FAILED']);

    const recentLogins = loginLogs?.filter(l => l.action === 'USER_LOGIN').length || 0;
    const failedLogins = loginLogs?.filter(l => l.action === 'LOGIN_FAILED').length || 0;

    // Get active users count
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    setMetrics({
      totalApiKeys: apiKeys?.length || 0,
      keysExpiringSoon,
      keysExpired,
      keysHealthy,
      lastRotation,
      recentLogins,
      failedLogins,
      activeUsers: activeUsers || 0,
      rlsEnabledTables: 15, // Known tables with RLS
      totalTables: 16,
    });
  };

  const fetchRecentLogs = async () => {
    try {
      const { data, error } = await supabase.rpc('get_audit_logs_masked', {
        p_limit: 10,
        p_offset: 0,
      });

      if (error) throw error;

      if (data?.length) {
        const userIds = [...new Set(data.filter((l: any) => l.user_id).map((l: any) => l.user_id))];
        
        let profileMap = new Map<string, string>();
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', userIds);
          profileMap = new Map(profiles?.map(p => [p.id, p.nome]) || []);
        }

        setRecentLogs(data.map((log: any) => ({
          id: log.id,
          action: log.action,
          table_name: log.table_name,
          user_name: log.user_id ? profileMap.get(log.user_id) || 'Usuário' : 'Sistema',
          created_at: log.created_at,
        })));
      }
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    }
  };

  const fetchPendingRotations = async () => {
    try {
      const { data, error } = await supabase.rpc('get_devices_pending_rotation');
      
      if (error) {
        console.error('Error fetching pending rotations:', error);
        return;
      }

      setPendingRotations(data || []);
    } catch (error) {
      console.error('Error fetching pending rotations:', error);
    }
  };

  const generateAlerts = () => {
    const newAlerts: SecurityAlert[] = [];

    // Check for expired API keys
    if (metrics?.keysExpired && metrics.keysExpired > 0) {
      newAlerts.push({
        id: 'expired-keys',
        type: 'critical',
        title: `${metrics.keysExpired} API Key(s) Expirada(s)`,
        description: 'Existem chaves de API que já expiraram e precisam ser rotacionadas imediatamente.',
        timestamp: new Date().toISOString(),
        actionUrl: '/dispositivos',
        actionLabel: 'Gerenciar Dispositivos',
      });
    }

    // Check for keys expiring soon
    if (metrics?.keysExpiringSoon && metrics.keysExpiringSoon > 0) {
      newAlerts.push({
        id: 'expiring-keys',
        type: 'warning',
        title: `${metrics.keysExpiringSoon} API Key(s) Expirando em Breve`,
        description: 'Algumas chaves de API irão expirar nos próximos 7 dias.',
        timestamp: new Date().toISOString(),
        actionUrl: '/dispositivos',
        actionLabel: 'Revisar Chaves',
      });
    }

    // Check for failed logins
    if (metrics?.failedLogins && metrics.failedLogins > 5) {
      newAlerts.push({
        id: 'failed-logins',
        type: 'warning',
        title: `${metrics.failedLogins} Tentativas de Login Falhadas`,
        description: 'Detectadas múltiplas tentativas de login falhadas nas últimas 24 horas.',
        timestamp: new Date().toISOString(),
        actionUrl: '/audit-logs',
        actionLabel: 'Ver Logs',
      });
    }

    // Info about last rotation
    if (metrics?.lastRotation) {
      const lastRotationDate = new Date(metrics.lastRotation);
      const daysSinceRotation = Math.floor((new Date().getTime() - lastRotationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceRotation > 30) {
        newAlerts.push({
          id: 'rotation-stale',
          type: 'info',
          title: 'Rotação de Chaves Recomendada',
          description: `A última rotação de API key foi há ${daysSinceRotation} dias.`,
          timestamp: metrics.lastRotation,
        });
      }
    }

    setAlerts(newAlerts);
  };

  useEffect(() => {
    if (metrics) {
      generateAlerts();
    }
  }, [metrics]);

  const handleRotateKey = async (deviceId: string) => {
    setIsRotating(deviceId);
    try {
      const { data, error } = await supabase.rpc('rotate_api_key', {
        p_dispositivo_id: deviceId
      });

      if (error) throw error;

      toast.success('API Key rotacionada com sucesso!', {
        description: `Nova chave: ${data?.substring(0, 8)}...`,
      });
      
      await fetchSecurityData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao rotacionar chave: ' + errorMessage);
    } finally {
      setIsRotating(null);
    }
  };

  const getAlertIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertBg = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-destructive/10 border-destructive/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-green-500/10 text-green-600';
    if (action.includes('CREATED')) return 'bg-blue-500/10 text-blue-600';
    if (action.includes('UPDATED')) return 'bg-yellow-500/10 text-yellow-600';
    if (action.includes('DELETED')) return 'bg-red-500/10 text-red-600';
    return 'bg-gray-500/10 text-gray-600';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  const keyHealthPercent = metrics?.totalApiKeys 
    ? Math.round((metrics.keysHealthy / metrics.totalApiKeys) * 100) 
    : 100;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Dashboard de Segurança
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento de segurança e métricas do sistema
            </p>
          </div>
          <Button onClick={fetchSecurityData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border flex items-start gap-4 ${getAlertBg(alert.type)}`}
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <h4 className="font-medium">{alert.title}</h4>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
                {alert.actionUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={alert.actionUrl}>{alert.actionLabel}</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saúde das API Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keyHealthPercent}%</div>
              <Progress value={keyHealthPercent} className="mt-2" />
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> {metrics?.keysHealthy || 0}
                </span>
                <span className="flex items-center gap-1 text-yellow-600">
                  <Clock className="h-3 w-3" /> {metrics?.keysExpiringSoon || 0}
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="h-3 w-3" /> {metrics?.keysExpired || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logins (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.recentLogins || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.failedLogins || 0} tentativas falhadas
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {(metrics?.failedLogins || 0) > 5 ? (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Atenção
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Normal
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Contas cadastradas no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RLS Ativo</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.rlsEnabledTables}/{metrics?.totalTables}
              </div>
              <Progress 
                value={((metrics?.rlsEnabledTables || 0) / (metrics?.totalTables || 1)) * 100} 
                className="mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                Tabelas com Row Level Security
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <Tabs defaultValue="rotations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rotations" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Rotação de Chaves
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Logs Recentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rotations">
            <Card>
              <CardHeader>
                <CardTitle>Dispositivos - Status de Rotação</CardTitle>
                <CardDescription>
                  Gerencie a rotação de API keys dos dispositivos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRotations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum dispositivo com API key configurada</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {pendingRotations.map((device) => {
                        const isExpired = device.days_until_rotation <= 0;
                        const isExpiringSoon = device.days_until_rotation <= 7 && device.days_until_rotation > 0;
                        
                        return (
                          <div
                            key={device.dispositivo_id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-full ${
                                isExpired ? 'bg-red-500/10' : 
                                isExpiringSoon ? 'bg-yellow-500/10' : 
                                'bg-green-500/10'
                              }`}>
                                {isExpired ? (
                                  <Unlock className="h-5 w-5 text-red-500" />
                                ) : isExpiringSoon ? (
                                  <Clock className="h-5 w-5 text-yellow-500" />
                                ) : (
                                  <Lock className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{device.dispositivo_nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {isExpired ? (
                                    <span className="text-red-500">Expirado</span>
                                  ) : (
                                    <>Expira em {device.days_until_rotation} dias</>
                                  )}
                                  {' • '}
                                  {format(new Date(device.next_rotation_at), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            
                            {isDeveloper && (
                              <Button
                                variant={isExpired ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => handleRotateKey(device.dispositivo_id)}
                                disabled={isRotating === device.dispositivo_id}
                              >
                                {isRotating === device.dispositivo_id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Rotacionar
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Logs de Auditoria Recentes</CardTitle>
                  <CardDescription>
                    Últimas ações registradas no sistema
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/audit-logs">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Todos
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum log de auditoria encontrado</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {recentLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={getActionColor(log.action)}>
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                            {log.table_name && (
                              <span className="text-sm text-muted-foreground">
                                {log.table_name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{log.user_name}</span>
                            <span title={format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}>
                              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
