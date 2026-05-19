import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already dismissed this session
  if (localStorage.getItem('installPromptDismissed') === 'true') {
    return null;
  }

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg shadow-2xl p-4 border border-blue-400/30">
        <div className="flex items-start gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-bold text-sm mb-1">
              Instalar SG Multimídia
            </h4>
            <p className="text-blue-100 text-xs mb-3">
              Adicione o app à tela inicial para acesso rápido e experiência otimizada
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 px-3 py-2 bg-white hover:bg-blue-50 text-blue-600 rounded-md text-xs font-bold transition-all"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-semibold transition-all"
              >
                Agora não
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
