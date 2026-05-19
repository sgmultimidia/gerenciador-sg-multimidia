import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import type { RecurringProject } from '@/shared/types';

interface ReceiptGenerationModalProps {
  project: RecurringProject;
  onClose: () => void;
  onGenerate: (monthReference: string, amount: string) => Promise<void>;
  loading: boolean;
}

export default function ReceiptGenerationModal({
  project,
  onClose,
  onGenerate,
  loading,
}: ReceiptGenerationModalProps) {
  const [receiptMonthReference, setReceiptMonthReference] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [receiptAmount, setReceiptAmount] = useState(() => {
    if (project.is_variable_value === 1 && project.monthly_value) {
      return String(project.monthly_value);
    }
    return '';
  });

  const handleGenerate = () => {
    onGenerate(receiptMonthReference, receiptAmount);
  };

  const shouldShowAmountInput = project.is_variable_value === 1 || !project.monthly_value;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg w-full max-w-md my-8 shadow-2xl border border-green-500/30">
        <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 border-b border-green-500/30">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">Gerar Recibo</h3>
              <p className="text-green-200 text-sm mt-1">{project.project_name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">Cliente</label>
            <div className="px-4 py-2 bg-slate-700/50 text-white rounded-md border border-slate-600">
              {project.client_name || 'Cliente não identificado'}
            </div>
          </div>

          {shouldShowAmountInput ? (
            <div>
              <label className="block text-white font-semibold mb-2">
                Valor deste Mês (R$) *
              </label>
              <input
                type="number"
                value={receiptAmount}
                onChange={(e) => setReceiptAmount(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {project.monthly_value && (
                <p className="text-xs text-slate-400 mt-1">
                  Valor de referência: R$ {project.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-white font-semibold mb-2">Valor Fixo</label>
              <div className="px-4 py-2 bg-slate-700/50 text-white rounded-md border border-slate-600">
                R$ {project.monthly_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Projeto com valor mensal fixo</p>
            </div>
          )}

          <div>
            <label className="block text-white font-semibold mb-2">Descrição</label>
            <div className="px-4 py-2 bg-slate-700/50 text-white rounded-md border border-slate-600">
              {project.description || project.project_name}
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Mês de Referência
            </label>
            <input
              type="month"
              value={receiptMonthReference}
              onChange={(e) => setReceiptMonthReference(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {project.is_variable_value === 1 && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-orange-300">📊 Projeto Variável:</span> Informe o valor específico para este mês.
              </p>
            </div>
          )}
          
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-green-300">Importante:</span> O recibo será registrado 
              no caixa e um PDF será gerado para impressão.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-md font-semibold transition-all shadow-lg"
            >
              {loading ? 'Gerando...' : 'Gerar Recibo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
