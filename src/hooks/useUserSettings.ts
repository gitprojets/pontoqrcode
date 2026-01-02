import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserSettings {
  id: string;
  user_id: string;
  push_enabled: boolean;
  presence_alerts: boolean;
  reminders: boolean;
  email_summary: boolean;
  theme: string;
  created_at: string;
  updated_at: string;
}

const defaultSettings: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  push_enabled: true,
  presence_alerts: true,
  reminders: true,
  email_summary: false,
  theme: 'system',
};

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as UserSettings);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id, ...defaultSettings })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default settings:', insertError);
          // Use local defaults
          setSettings({
            id: '',
            user_id: user.id,
            ...defaultSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          setSettings(newSettings as UserSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user || !settings) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Configurações salvas!');
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erro ao salvar configurações');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, settings]);

  const updateSetting = useCallback(async <K extends keyof typeof defaultSettings>(
    key: K, 
    value: typeof defaultSettings[K]
  ) => {
    return updateSettings({ [key]: value });
  }, [updateSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    updateSetting,
    refresh: fetchSettings,
  };
}
