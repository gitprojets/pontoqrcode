import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Key, 
  RefreshCw, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Save,
  Settings2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeviceRotationConfig {
  dispositivo_id: string;
  dispositivo_nome: string;
  unidade_id: string | null;
  rotation_interval_days: number;
  next_rotation_at: string | null;
  rotated_at: string | null;
  rotation_notification_sent: boolean;
  days_until_rotation: number | null;
}

export default function RotationConfig() {
  const [devices, setDevices] = useState<DeviceRotationConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [newInterval, setNewInterval] = useState<number>(90);
  const [savingDevice, setSavingDevice] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      
      // Fetch device API key configs with device names
      const { data: apiKeys, error: apiError } = await supabase
        .from('dispositivo_api_keys')
        .select(`
          dispositivo_id,
          rotation_interval_days,
          next_rotation_at,
          rotated_at,
          rotation_notification_sent
        `);

      if (apiError) throw apiError;

      // Fetch device names
      const { data: dispositivos, error: dispError } = await supabase
        .from('dispositivos')
        .select('id, nome, unidade_id');

      if (dispError) throw dispError;

      // Combine data
      const devicesMap = new Map(dispositivos?.map(d => [d.id, d]) || []);
      
      const combined: DeviceRotationConfig[] = (apiKeys || []).map(ak => {
        const device = devicesMap.get(ak.dispositivo_id);
        const nextRotation = ak.next_rotation_at ? new Date(ak.next_rotation_at) : null;
        const daysUntil = nextRotation 
          ? Math.ceil((nextRotation.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
        
        return {
          dispositivo_id: ak.dispositivo_id,
          dispositivo_nome: device?.nome || 'Dispositivo Desconhecido',
          unidade_id: device?.unidade_id || null,
          rotation_interval_days: ak.rotation_interval_days || 90,
          next_rotation_at: ak.next_rotation_at,
          rotated_at: ak.rotated_at,
          rotation_notification_sent: ak.rotation_notification_sent || false,
          days_until_rotation: daysUntil,
        };
      });

      setDevices(combined);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Erro ao carregar configurações de rotação');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleEditInterval = (deviceId: string, currentInterval: number) => {
    setEditingDevice(deviceId);
    setNewInterval(currentInterval);
  };

  const handleSaveInterval = async (deviceId: string) => {
    if (newInterval < 1 || newInterval > 365) {
      toast.error('O intervalo deve estar entre 1 e 365 dias');
      return;
    }

    try {
      setSavingDevice(deviceId);
      
      // Calculate new next_rotation_at based on last rotation or now
      const device = devices.find(d => d.dispositivo_id === deviceId);
      const baseDate = device?.rotated_at ? new Date(device.rotated_at) : new Date();
      const newNextRotation = new Date(baseDate.getTime() + newInterval * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('dispositivo_api_keys')
        .update({
          rotation_interval_days: newInterval,
          next_rotation_at: newNextRotation.toISOString(),
          rotation_notification_sent: false, // Reset notification flag
        })
        .eq('dispositivo_id', deviceId);

      if (error) throw error;

      toast.success('Intervalo de rotação atualizado com sucesso!');
      setEditingDevice(null);
      await fetchDevices();
    } catch (error) {
      console.error('Error updating interval:', error);
      toast.error('Erro ao atualizar intervalo de rotação');
    } finally {
      setSavingDevice(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingDevice(null);
    setNewInterval(90);
  };

  const getStatusBadge = (device: DeviceRotationConfig) => {
    if (device.days_until_rotation === null) {
      return <Badge variant="secondary">Não configurado</Badge>;
    }
    
    if (device.days_until_rotation <= 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Expirado
        </Badge>
      );
    }
    
    if (device.days_until_rotation <= 7) {
      return (
        <Badge variant="outline" className="border-warning text-warning gap-1">
          <Clock className="w-3 h-3" />
          {device.days_until_rotation} dias restantes
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="border-success text-success gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {device.days_until_rotation} dias restantes
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings2 className="w-6 h-6" />
              Configuração de Rotação de Chaves
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure o intervalo de rotação automática das API keys por dispositivo
            </p>
          </div>
          <Button onClick={fetchDevices} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-info/20 bg-info/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-info mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Rotação Automática Ativa</p>
                <p className="text-muted-foreground mt-1">
                  O sistema verifica diariamente às 3h da manhã quais chaves precisam ser rotacionadas.
                  Notificações são enviadas 7 dias antes da expiração.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Devices List */}
        {devices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum dispositivo com API key configurada
              </h3>
              <p className="text-muted-foreground">
                Adicione dispositivos na página de Dispositivos para gerenciar suas chaves.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {devices.map(device => (
              <Card key={device.dispositivo_id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Key className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{device.dispositivo_nome}</CardTitle>
                        <CardDescription>ID: {device.dispositivo_id.slice(0, 8)}...</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(device)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Interval Configuration */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Intervalo de Rotação</Label>
                      {editingDevice === device.dispositivo_id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={newInterval}
                            onChange={(e) => setNewInterval(parseInt(e.target.value) || 90)}
                            className="w-20 h-8"
                          />
                          <span className="text-sm text-muted-foreground">dias</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => handleSaveInterval(device.dispositivo_id)}
                            disabled={savingDevice === device.dispositivo_id}
                          >
                            {savingDevice === device.dispositivo_id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 text-success" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={handleCancelEdit}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{device.rotation_interval_days} dias</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => handleEditInterval(device.dispositivo_id, device.rotation_interval_days)}
                          >
                            Editar
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Next Rotation */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Próxima Rotação</Label>
                      <p className="font-medium">
                        {device.next_rotation_at 
                          ? format(new Date(device.next_rotation_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Não definida'}
                      </p>
                    </div>

                    {/* Last Rotation */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Última Rotação</Label>
                      <p className="font-medium">
                        {device.rotated_at 
                          ? formatDistanceToNow(new Date(device.rotated_at), { addSuffix: true, locale: ptBR })
                          : 'Nunca rotacionada'}
                      </p>
                    </div>

                    {/* Notification Status */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Notificação Enviada</Label>
                      <p className="font-medium">
                        {device.rotation_notification_sent ? (
                          <span className="text-warning flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Sim
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Não</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
