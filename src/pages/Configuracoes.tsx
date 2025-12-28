import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Bell, 
  Shield, 
  Clock, 
  Building,
  Save,
  User,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PushNotificationToggle } from '@/components/notifications/PushNotificationToggle';

export default function Configuracoes() {
  const { profile, role, refreshProfile } = useAuth();
  const isAdmin = role === 'administrador';
  const isDev = role === 'desenvolvedor';
  const isDiretor = role === 'diretor';

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification preferences (local state for now)
  const [notifications, setNotifications] = useState({
    presenceAlerts: true,
    reminders: true,
    emailSummary: false,
  });

  useEffect(() => {
    if (profile) {
      setNome(profile.nome);
      setEmail(profile.email);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nome })
        .eq('id', profile.id);

      if (error) throw error;

      if (refreshProfile) {
        await refreshProfile();
      }
      
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha: ' + error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 lg:space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            Gerencie as configurações do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="card-elevated p-4 lg:p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4 lg:mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Perfil do Usuário
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome</label>
                  <Input 
                    value={nome} 
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">E-mail</label>
                  <Input value={email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Matrícula</label>
                  <Input value={profile?.matricula || '-'} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cargo</label>
                  <Input value={role || ''} disabled className="capitalize bg-muted" />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="gradient" 
                  onClick={handleSaveProfile}
                  disabled={isSaving || nome === profile?.nome}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Perfil
                </Button>
              </div>
            </div>

            {/* Password Change */}
            <div className="card-elevated p-4 lg:p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-3 mb-4 lg:mb-6">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Lock className="w-5 h-5 text-warning" />
                </div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Alterar Senha
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Nova Senha</label>
                  <div className="relative">
                    <Input 
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Confirmar Nova Senha</label>
                  <Input 
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  Alterar Senha
                </Button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="card-elevated p-4 lg:p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-4 lg:mb-6">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Bell className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Notificações
                </h2>
              </div>
              
              <div className="space-y-3 lg:space-y-4">
                {/* Push Notifications */}
                <div className="flex items-center justify-between p-3 lg:p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Smartphone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm lg:text-base">Notificações Push</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">Receber alertas em tempo real no dispositivo</p>
                    </div>
                  </div>
                  <PushNotificationToggle variant="switch" showLabel={false} />
                </div>
                
                <div className="flex items-center justify-between p-3 lg:p-4 bg-muted/50 rounded-xl">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-foreground text-sm lg:text-base">Alertas de presença</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">Receber notificações sobre registros</p>
                  </div>
                  <Switch 
                    checked={notifications.presenceAlerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, presenceAlerts: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 lg:p-4 bg-muted/50 rounded-xl">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-foreground text-sm lg:text-base">Lembretes</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">Receber lembretes sobre horários</p>
                  </div>
                  <Switch 
                    checked={notifications.reminders}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, reminders: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 lg:p-4 bg-muted/50 rounded-xl">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-foreground text-sm lg:text-base">E-mails de resumo</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">Receber resumo semanal por e-mail</p>
                  </div>
                  <Switch 
                    checked={notifications.emailSummary}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailSummary: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Attendance Rules - Diretor/Admin only */}
            {(isDiretor || isAdmin || isDev) && (
              <div className="card-elevated p-4 lg:p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
                <div className="flex items-center gap-3 mb-4 lg:mb-6">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    Regras de Presença
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div className="space-y-2">
                    <label className="text-xs lg:text-sm font-medium text-foreground">
                      Tolerância entrada (min)
                    </label>
                    <Input type="number" defaultValue="15" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs lg:text-sm font-medium text-foreground">
                      Tolerância saída (min)
                    </label>
                    <Input type="number" defaultValue="10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs lg:text-sm font-medium text-foreground">
                      Correções max/mês
                    </label>
                    <Input type="number" defaultValue="3" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs lg:text-sm font-medium text-foreground">
                      Prazo correção (dias)
                    </label>
                    <Input type="number" defaultValue="5" />
                  </div>
                </div>
              </div>
            )}

            {/* Admin Only Settings */}
            {(isAdmin || isDev) && (
              <div className="card-elevated p-4 lg:p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-3 mb-4 lg:mb-6">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Shield className="w-5 h-5 text-destructive" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    Segurança e Sistema
                  </h2>
                </div>
                
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex items-center justify-between p-3 lg:p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium text-foreground text-sm lg:text-base">Autenticação em dois fatores</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">Exigir MFA para todos os usuários</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-3 lg:p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium text-foreground text-sm lg:text-base">Logs de auditoria</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">Manter histórico de alterações</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 lg:p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium text-foreground text-sm lg:text-base">Modo de manutenção</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">Bloquear acesso de usuários</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="card-elevated p-4 lg:p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Informações
                </h2>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Escola</span>
                  <span className="font-medium text-foreground truncate ml-2">{profile?.unidade || 'Sistema'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versão</span>
                  <span className="font-medium text-foreground">2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Último acesso</span>
                  <span className="font-medium text-foreground">Agora</span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="card-elevated p-4 lg:p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Settings className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Suporte
                </h2>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Precisa de ajuda? Entre em contato com o suporte técnico.
              </p>
              
              <Button variant="outline" className="w-full">
                Abrir chamado
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
