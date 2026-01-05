import { useEffect, useState } from 'react';
import { OnboardingWizard } from './OnboardingWizard';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAuth } from '@/contexts/AuthContext';

export function OnboardingTrigger() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings, isLoading: settingsLoading } = useUserSettings();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only show onboarding for authenticated users who haven't completed it
    if (!authLoading && !settingsLoading && isAuthenticated && settings) {
      if (!settings.onboarding_completed) {
        // Small delay for better UX
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [authLoading, settingsLoading, isAuthenticated, settings]);

  if (!isAuthenticated || authLoading || settingsLoading) {
    return null;
  }

  return (
    <OnboardingWizard 
      open={showOnboarding} 
      onOpenChange={setShowOnboarding} 
    />
  );
}
