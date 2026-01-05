import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ClipboardList,
  Shield,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tip?: string;
}

const stepsByRole: Record<string, OnboardingStep[]> = {
  desenvolvedor: [
    { id: 'welcome', title: 'Bem-vindo ao FrequênciaQR', description: 'Sistema completo de gestão de presença escolar com QR Code.', icon: QrCode },
    { id: 'users', title: 'Gestão de Usuários', description: 'Gerencie todos os usuários, atribua roles e vincule a unidades.', icon: Users, tip: 'Acesse via menu Usuários' },
    { id: 'units', title: 'Unidades Escolares', description: 'Configure unidades, horários e dias de funcionamento.', icon: Settings, tip: 'Acesse via menu Unidades' },
    { id: 'security', title: 'Segurança', description: 'Monitore logs de auditoria e configure regras de acesso.', icon: Shield, tip: 'Acesse via menu Segurança' },
    { id: 'reports', title: 'Relatórios', description: 'Visualize relatórios completos de todas as unidades.', icon: BarChart3, tip: 'Acesse via menu Relatórios' },
  ],
  administrador: [
    { id: 'welcome', title: 'Bem-vindo ao FrequênciaQR', description: 'Gerencie presença escolar de forma eficiente.', icon: QrCode },
    { id: 'users', title: 'Gestão de Usuários', description: 'Adicione e gerencie funcionários das suas unidades.', icon: Users, tip: 'Acesse via menu Usuários' },
    { id: 'scales', title: 'Escalas de Trabalho', description: 'Configure as escalas semanais dos funcionários.', icon: ClipboardList, tip: 'Acesse via menu Escalas' },
    { id: 'reports', title: 'Relatórios', description: 'Acompanhe a frequência e gere relatórios detalhados.', icon: BarChart3, tip: 'Acesse via menu Relatórios' },
    { id: 'settings', title: 'Configurações', description: 'Personalize notificações e preferências do sistema.', icon: Settings, tip: 'Acesse via menu Configurações' },
  ],
  diretor: [
    { id: 'welcome', title: 'Bem-vindo ao FrequênciaQR', description: 'Acompanhe a presença na sua unidade escolar.', icon: QrCode },
    { id: 'qrcode', title: 'Leitor de QR Code', description: 'Registre a presença dos funcionários via QR Code.', icon: QrCode, tip: 'Acesse via menu Leitor QR' },
    { id: 'approvals', title: 'Aprovações', description: 'Aprove ou rejeite justificativas de ausência.', icon: FileText, tip: 'Acesse via menu Aprovações' },
    { id: 'calendar', title: 'Calendário', description: 'Visualize eventos e feriados da sua unidade.', icon: Calendar, tip: 'Acesse via menu Calendário' },
    { id: 'reports', title: 'Relatórios', description: 'Acompanhe a frequência da sua unidade.', icon: BarChart3, tip: 'Acesse via menu Relatórios' },
  ],
  coordenador: [
    { id: 'welcome', title: 'Bem-vindo ao FrequênciaQR', description: 'Coordene a presença na sua unidade.', icon: QrCode },
    { id: 'approvals', title: 'Aprovações', description: 'Analise e aprove justificativas de ausência.', icon: FileText, tip: 'Acesse via menu Aprovações' },
    { id: 'scales', title: 'Escalas', description: 'Visualize as escalas de trabalho da equipe.', icon: ClipboardList, tip: 'Acesse via menu Escalas' },
    { id: 'reports', title: 'Relatórios', description: 'Acompanhe métricas de frequência.', icon: BarChart3, tip: 'Acesse via menu Relatórios' },
  ],
  secretario: [
    { id: 'welcome', title: 'Bem-vindo ao FrequênciaQR', description: 'Gerencie informações de presença.', icon: QrCode },
    { id: 'employees', title: 'Funcionários', description: 'Visualize e filtre a lista de funcionários.', icon: Users, tip: 'Acesse via menu Funcionários' },
    { id: 'reports', title: 'Relatórios', description: 'Gere relatórios de frequência.', icon: BarChart3, tip: 'Acesse via menu Relatórios' },
  ],
  professor: [
    { id: 'welcome', title: 'Bem-vindo ao FrequênciaQR', description: 'Registre sua presença de forma simples.', icon: QrCode },
    { id: 'qrcode', title: 'Seu QR Code', description: 'Gere seu QR Code pessoal para registro de presença.', icon: QrCode, tip: 'Acesse via menu QR Code' },
    { id: 'history', title: 'Histórico', description: 'Visualize seu histórico de registros de ponto.', icon: Calendar, tip: 'Acesse via menu Histórico' },
    { id: 'justifications', title: 'Justificativas', description: 'Envie justificativas para ausências com anexos.', icon: FileText, tip: 'Acesse via menu Justificativas' },
    { id: 'notifications', title: 'Notificações', description: 'Ative notificações para lembretes de ponto.', icon: Bell, tip: 'Acesse via Configurações' },
  ],
  outro: [
    { id: 'welcome', title: 'Bem-vindo ao FrequênciaQR', description: 'Registre sua presença de forma simples.', icon: QrCode },
    { id: 'qrcode', title: 'Seu QR Code', description: 'Gere seu QR Code pessoal para registro.', icon: QrCode, tip: 'Acesse via menu QR Code' },
    { id: 'history', title: 'Histórico', description: 'Acompanhe seus registros de ponto.', icon: Calendar, tip: 'Acesse via menu Histórico' },
  ],
};

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const { role } = useAuth();
  const { updateSettings } = useUserSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const steps = stepsByRole[role || 'professor'] || stepsByRole.professor;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep]);

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    await updateSettings({ 
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    });
    setIsCompleting(false);
    onOpenChange(false);
  }, [updateSettings, onOpenChange]);

  const handleSkip = useCallback(async () => {
    await handleComplete();
  }, [handleComplete]);

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-background border-border">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
          <motion.div
            key={currentStep}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center"
          >
            <StepIcon className="w-8 h-8 text-primary" />
          </motion.div>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentStep 
                  ? "bg-primary w-6" 
                  : index < currentStep 
                    ? "bg-primary/60" 
                    : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {currentStepData.description}
              </p>
              
              {currentStepData.tip && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Dica: </span>
                  {currentStepData.tip}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentStep + 1} de {steps.length}
          </span>

          <Button
            onClick={handleNext}
            disabled={isCompleting}
            className="gap-2"
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {isCompleting ? 'Finalizando...' : 'Concluir'}
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
