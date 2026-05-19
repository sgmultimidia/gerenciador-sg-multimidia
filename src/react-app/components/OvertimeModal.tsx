import { X } from 'lucide-react';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface OvertimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  minutes: string;
  onChangeMinutes: (minutes: string) => void;
  onGenerate: () => void;
}

export default function OvertimeModal({
  isOpen,
  onClose,
  minutes,
  onChangeMinutes,
  onGenerate
}: OvertimeModalProps) {
  useLockBodyScroll(isOpen);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30 max-w-md w-full my-8 max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="bg-slate-800 border-b border-blue-500/30 p-6 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-white">Tempo Excedente</h3>
            <p className="text-slate-400 text-sm mt-1">Transmissão ao Vivo</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-blue-300 mb-2">
              Minutos Excedentes
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                onChangeMinutes(value);
              }}
              placeholder="Digite os minutos excedentes (exemplo: 30)"
              className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
            <p className="text-slate-400 text-xs mt-2">
              Taxa: R$ 250,00 por hora (R$ 4,17 por minuto)
            </p>
            {minutes && Number(minutes) > 0 && (
              <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500/50 rounded-md">
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">Valor adicional:</span> R$ {((Number(minutes) * 250) / 60).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-md font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onGenerate}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md font-semibold transition-all shadow-lg hover:shadow-blue-500/50"
            >
              Gerar Recibo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
