import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

interface PushNotificationToggleProps {
  variant?: 'switch' | 'button';
  className?: string;
  showLabel?: boolean;
}

export function PushNotificationToggle({
  variant = 'switch',
  className,
  showLabel = true,
}: PushNotificationToggleProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant={isSubscribed ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading || permission === 'denied'}
        className={cn('gap-2', className)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <BellOff className="w-4 h-4" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {isSubscribed ? 'Desativar Notificações' : 'Ativar Notificações'}
      </Button>
    );
  }

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="push-notifications" className="text-sm">
            Notificações Push
          </Label>
        </div>
      )}
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        <Switch
          id="push-notifications"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading || permission === 'denied'}
        />
      </div>
      {permission === 'denied' && (
        <p className="text-xs text-destructive">
          Notificações bloqueadas no navegador
        </p>
      )}
    </div>
  );
}
