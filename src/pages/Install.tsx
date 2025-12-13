import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Smartphone, Monitor, ArrowLeft, Check, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoImage from '@/assets/logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <img src={logoImage} alt="FrequênciaQR" className="w-20 h-20 mx-auto rounded-2xl shadow-lg mb-4" />
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
            Instalar FrequênciaQR
          </h1>
          <p className="text-muted-foreground">
            Instale o app no seu dispositivo para acesso rápido
          </p>
        </div>

        {isInstalled ? (
          <div className="card-elevated p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              App já instalado!
            </h2>
            <p className="text-muted-foreground mb-6">
              O FrequênciaQR já está instalado no seu dispositivo.
            </p>
            <Link to="/login">
              <Button variant="gradient">Acessar o App</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Direct Install Button */}
            {deferredPrompt && (
              <div className="card-elevated p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Instalar Agora
                </h2>
                <p className="text-muted-foreground mb-6">
                  Clique no botão abaixo para instalar o app
                </p>
                <Button variant="gradient" size="lg" onClick={handleInstall}>
                  <Download className="w-5 h-5 mr-2" />
                  Instalar App
                </Button>
              </div>
            )}

            {/* iOS Instructions */}
            {isIOS && (
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Como instalar no iPhone/iPad
                  </h2>
                </div>
                <ol className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="text-foreground">Toque no ícone de <strong>Compartilhar</strong></p>
                      <Share className="w-5 h-5 text-muted-foreground mt-1" />
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="text-foreground">Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></p>
                      <Plus className="w-5 h-5 text-muted-foreground mt-1" />
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                    <p className="text-foreground">Confirme tocando em <strong>"Adicionar"</strong></p>
                  </li>
                </ol>
              </div>
            )}

            {/* Android Instructions */}
            {isAndroid && !deferredPrompt && (
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Como instalar no Android
                  </h2>
                </div>
                <ol className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    <p className="text-foreground">Toque no menu do navegador (três pontos)</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                    <p className="text-foreground">Selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                    <p className="text-foreground">Confirme a instalação</p>
                  </li>
                </ol>
              </div>
            )}

            {/* Desktop Instructions */}
            {!isIOS && !isAndroid && !deferredPrompt && (
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Como instalar no Computador
                  </h2>
                </div>
                <ol className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    <p className="text-foreground">Procure o ícone de instalação na barra de endereço do navegador</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                    <p className="text-foreground">Clique em <strong>"Instalar"</strong> quando solicitado</p>
                  </li>
                </ol>
              </div>
            )}

            {/* Benefits */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Vantagens do App
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-foreground">Acesso rápido direto da tela inicial</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-foreground">Funciona mesmo offline</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-foreground">Notificações push</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-foreground">Experiência de app nativo</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
