import { useState, useEffect } from 'react';
import { X, QrCode, Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from './ToastContainer';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface PixChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  clientName: string;
  clientEmail?: string;
  correlationId?: string;
  description?: string;
}

export default function PixChargeModal({
  isOpen, onClose, amount, clientName, clientEmail, correlationId, description
}: PixChargeModalProps) {
  const toast = useToast();
  useLockBodyScroll(isOpen, onClose);

  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [charge, setCharge] = useState<{
    qr_code?: string;
    qr_code_text?: string;
    pix_link?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkConfig();
    }
  }, [isOpen]);

  const checkConfig = async () => {
    try {
      const res = await fetch('/api/pix/status');
      if (res.ok) {
        const data = await res.json();
        setConfigured(data.configured);
      }
    } catch { setConfigured(false); }
  };

  const generateCharge = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pix/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          client_name: clientName,
          client_email: clientEmail,
          correlation_id: correlationId || `sg-${Date.now()}`,
          comment: description || `Pagamento SG Multimídia - ${clientName}`,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCharge(data);
      toast.success('Cobrança Pix gerada!');
    } catch {
      toast.error('Erro ao gerar cobrança Pix');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (charge?.qr_code_text) {
      navigator.clipboard.writeText(charge.qr_code_text);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const sendWhatsApp = () => {
    const link = charge?.pix_link || charge?.qr_code_text || '';
    const msg = encodeURIComponent(
      `Olá ${clientName}! Segue o link para pagamento via Pix no valor de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}:\n\n${link}\n\nQualquer dúvida estou à disposição!`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-md shadow-2xl border border-green-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-teal-900 border-b border-green-500/30 p-5 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Cobrança via Pix</h3>
              <p className="text-green-200 text-sm">{clientName} — R$ {fmt(amount)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Not configured */}
          {configured === false && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto" />
              <div>
                <p className="text-white font-bold text-lg">OpenPix não configurado</p>
                <p className="text-slate-400 text-sm mt-2">
                  Para usar cobranças via Pix, você precisa criar uma conta na OpenPix e adicionar a chave de API nas variáveis de ambiente do Cloudflare Workers.
                </p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg text-left space-y-2">
                <p className="text-slate-300 text-sm font-semibold">Como configurar:</p>
                <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
                  <li>Crie uma conta em openpix.com.br</li>
                  <li>Gere uma chave de API no painel</li>
                  <li>No Cloudflare Workers, vá em Settings → Variables</li>
                  <li>Adicione a variável <code className="bg-slate-600 px-1 rounded">OPENPIX_API_KEY</code></li>
                </ol>
              </div>
              <a href="https://openpix.com.br" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all">
                <ExternalLink className="w-4 h-4" />
                Acessar OpenPix
              </a>
            </div>
          )}

          {/* Configured - no charge yet */}
          {configured === true && !charge && (
            <div className="text-center space-y-4">
              <QrCode className="w-16 h-16 text-green-400 mx-auto opacity-50" />
              <div>
                <p className="text-white font-bold">Gerar cobrança Pix</p>
                <p className="text-slate-400 text-sm mt-1">
                  Será gerado um QR Code que você pode enviar para o cliente pelo WhatsApp.
                </p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cliente</span>
                  <span className="text-white font-medium">{clientName}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-slate-400">Valor</span>
                  <span className="text-green-400 font-bold">R$ {fmt(amount)}</span>
                </div>
              </div>
              <button onClick={generateCharge} disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-bold transition-all">
                {loading ? 'Gerando...' : 'Gerar QR Code Pix'}
              </button>
            </div>
          )}

          {/* Charge generated */}
          {charge && (
            <div className="space-y-4">
              {charge.qr_code && (
                <div className="flex justify-center">
                  <img src={charge.qr_code} alt="QR Code Pix" className="w-48 h-48 rounded-lg" />
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-slate-700 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-sm font-semibold">Cobrança gerada com sucesso!</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={copyCode}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar código'}
                </button>
                <button onClick={sendWhatsApp}
                  className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all">
                  <ExternalLink className="w-4 h-4" />
                  Enviar WhatsApp
                </button>
              </div>
              <p className="text-slate-500 text-xs text-center">
                O pagamento será registrado automaticamente no caixa quando confirmado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
