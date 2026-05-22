import { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Settings, Download, X } from 'lucide-react';
import type { Withdrawal, WithdrawalSettings } from '../../shared/types';
import { useToast } from './ToastContainer';
import { useConfirm } from './ConfirmDialog';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

export function WithdrawalControl() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<WithdrawalSettings | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyWithdrawn, setMonthlyWithdrawn] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showNewWithdrawal, setShowNewWithdrawal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // New withdrawal form state
  const [amount, setAmount] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  
  // Settings form state
  const [newPercentage, setNewPercentage] = useState('40');
  
  const toast = useToast();
  const { confirm } = useConfirm();
  useLockBodyScroll(showNewWithdrawal || showSettings);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSettings(),
        loadWithdrawals(),
        loadMonthlyRevenue(),
        loadMonthlyWithdrawn()
      ]);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/withdrawals/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setNewPercentage(String(data.percentage));
      }
    } catch (error) {
      // Error loading settings - silently fail
    }
  };

  const loadWithdrawals = async () => {
    try {
      const response = await fetch(`/api/withdrawals?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data);
      }
    } catch (error) {
      // Error loading withdrawals - silently fail
    }
  };

  const loadMonthlyRevenue = async () => {
    try {
      const response = await fetch(`/api/withdrawals/monthly-revenue/${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyRevenue(data.revenue);
      }
    } catch (error) {
      // Error loading monthly revenue - silently fail
    }
  };

  const loadMonthlyWithdrawn = async () => {
    try {
      const response = await fetch(`/api/withdrawals/monthly-total/${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyWithdrawn(data.total);
      }
    } catch (error) {
      // Error loading monthly withdrawn - silently fail
    }
  };

  const handleUpdateSettings = async () => {
    const percentage = parseFloat(newPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Porcentagem deve estar entre 0 e 100');
      return;
    }

    try {
      const response = await fetch('/api/withdrawals/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage })
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        setShowSettings(false);
        toast.success('Configurações atualizadas com sucesso');
      } else {
        toast.error('Erro ao atualizar configurações');
      }
    } catch (error) {
      toast.error('Erro ao atualizar configurações');
    }
  };

  const handleCreateWithdrawal = async () => {
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error('Valor inválido');
      return;
    }

    const availableAmount = (monthlyRevenue * (settings?.percentage || 40)) / 100 - monthlyWithdrawn;
    
    if (withdrawalAmount > availableAmount) {
      const proceed = await confirm({
        title: 'Retirada acima do recomendado',
        message: `Você está retirando R$ ${withdrawalAmount.toFixed(2)}, mas o valor recomendado disponível é R$ ${availableAmount.toFixed(2)}. Deseja continuar?`,
        type: 'warning',
        confirmText: 'Continuar',
        cancelText: 'Cancelar'
      });
      
      if (!proceed) return;
    }

    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawalAmount,
          withdrawal_date: withdrawalDate,
          month_reference: selectedMonth,
          notes: notes || null
        })
      });

      if (response.ok) {
        toast.success('Retirada registrada com sucesso');
        setShowNewWithdrawal(false);
        setAmount('');
        setNotes('');
        setWithdrawalDate(new Date().toISOString().split('T')[0]);
        await loadData();
      } else {
        toast.error('Erro ao registrar retirada');
      }
    } catch (error) {
      toast.error('Erro ao registrar retirada');
    }
  };

  const handleDeleteWithdrawal = async (id: number) => {
    const proceed = await confirm({
      title: 'Excluir retirada',
      message: 'Tem certeza que deseja excluir esta retirada? Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!proceed) return;

    try {
      const response = await fetch(`/api/withdrawals/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Retirada excluída com sucesso');
        await loadData();
      } else {
        toast.error('Erro ao excluir retirada');
      }
    } catch (error) {
      toast.error('Erro ao excluir retirada');
    }
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Valor', 'Observações'];
    const rows = withdrawals.map(w => [
      new Date(w.withdrawal_date).toLocaleDateString('pt-BR'),
      `R$ ${w.amount.toFixed(2)}`,
      w.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `retiradas-${selectedMonth}.csv`;
    link.click();
  };

  const recommendedAmount = (monthlyRevenue * (settings?.percentage || 40)) / 100;
  const availableAmount = recommendedAmount - monthlyWithdrawn;
  const percentageWithdrawn = monthlyRevenue > 0 ? (monthlyWithdrawn / monthlyRevenue) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">Controle de Retiradas (MEI)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribuição isenta de impostos
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Config</span>
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-1.5 text-sm bg-slate-700 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Stats Cards - Grid 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] opacity-90 leading-tight">Faturamento</span>
            <TrendingUp className="w-3 h-3" />
          </div>
          <p className="text-base font-bold">R$ {monthlyRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] opacity-90 leading-tight">Recomendado</span>
            <DollarSign className="w-3 h-3" />
          </div>
          <p className="text-base font-bold">R$ {recommendedAmount.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 text-white">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] opacity-90 leading-tight">Disponível</span>
            <TrendingDown className="w-3 h-3" />
          </div>
          <p className="text-base font-bold">R$ {Math.max(0, availableAmount).toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 text-white">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] opacity-90 leading-tight">Retirado</span>
            <DollarSign className="w-3 h-3" />
          </div>
          <p className="text-base font-bold">R$ {monthlyWithdrawn.toFixed(2)}</p>
          <p className="text-[9px] opacity-75 mt-0.5">{percentageWithdrawn.toFixed(1)}%</p>
        </div>
      </div>

      {/* Warning if over recommended */}
      {availableAmount < 0 && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2">
          <p className="text-yellow-300 text-xs">
            ⚠️ Retirado R$ {Math.abs(availableAmount).toFixed(2)} acima do recomendado
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowNewWithdrawal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nova Retirada
        </button>
        
        {withdrawals.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        )}
      </div>

      {/* Withdrawals List */}
      <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700">
        <div className="p-3 border-b border-slate-700">
          <h3 className="text-base font-semibold text-white">Histórico</h3>
        </div>
        
        <div className="p-3">
          {withdrawals.length === 0 ? (
            <div className="text-center py-6">
              <DollarSign className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">Nenhuma retirada este mês</p>
            </div>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-2.5 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">
                        R$ {withdrawal.amount.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(withdrawal.withdrawal_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {withdrawal.notes && (
                      <p className="text-[10px] text-slate-300 mt-0.5 truncate">{withdrawal.notes}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteWithdrawal(withdrawal.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Withdrawal Modal */}
      {showNewWithdrawal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full my-8 shadow-xl max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Nova Retirada</h3>
              <button
                onClick={() => {
                  setShowNewWithdrawal(false);
                  setAmount('');
                  setNotes('');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
              
            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor da Retirada
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponível: R$ {Math.max(0, availableAmount).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data da Retirada
                  </label>
                  <input
                    type="date"
                    value={withdrawalDate}
                    onChange={(e) => setWithdrawalDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Adicione observações"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex gap-2 p-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={handleCreateWithdrawal}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Registrar
              </button>
              <button
                onClick={() => {
                  setShowNewWithdrawal(false);
                  setAmount('');
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full my-8 shadow-xl max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Configurar %</h3>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setNewPercentage(String(settings?.percentage || 40));
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
              
            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porcentagem do Faturamento
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newPercentage}
                      onChange={(e) => setNewPercentage(e.target.value)}
                      min="0"
                      max="100"
                      step="1"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-600 font-medium">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Média brasileira MEI: <strong>40%</strong>
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                  <p className="text-xs text-blue-800">
                    Com {newPercentage}%: até <strong>R$ {((monthlyRevenue * parseFloat(newPercentage || '0')) / 100).toFixed(2)}</strong> este mês
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex gap-2 p-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={handleUpdateSettings}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setNewPercentage(String(settings?.percentage || 40));
                }}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
