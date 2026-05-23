import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Settings, X } from 'lucide-react';
import { useToast } from './ToastContainer';

export default function WithdrawalControl() {
  const toast = useToast();

  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyWithdrawn, setMonthlyWithdrawn] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [settings, setSettings] = useState<{ id: number; percentage: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewWithdrawal, setShowNewWithdrawal] = useState(false);
  const [newPercentage, setNewPercentage] = useState('20');
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const currentMonth = new Date().toISOString().substring(0, 7);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsRes, revenueRes, withdrawnRes, withdrawalsRes] = await Promise.all([
        fetch('/api/withdrawals/settings'),
        fetch(`/api/withdrawals/monthly-revenue/${currentMonth}`),
        fetch(`/api/withdrawals/monthly-total/${currentMonth}`),
        fetch(`/api/withdrawals?month=${currentMonth}`),
      ]);

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setSettings(s);
        setNewPercentage(String(s.percentage || 20));
      }
      if (revenueRes.ok) {
        const r = await revenueRes.json();
        setMonthlyRevenue(Number(r.revenue) || 0);
      }
      if (withdrawnRes.ok) {
        const w = await withdrawnRes.json();
        setMonthlyWithdrawn(Number(w.total) || 0);
      }
      if (withdrawalsRes.ok) {
        setWithdrawals(await withdrawalsRes.json());
      }
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/withdrawals/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: parseFloat(newPercentage) }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSettings(updated);
      setShowSettings(false);
      toast.success('Configurações salvas!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const createWithdrawal = async () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) { toast.warning('Valor inválido'); return; }
    if (amount > availableAmount) { toast.warning('Valor maior que o disponível'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          withdrawal_date: new Date().toISOString().split('T')[0],
          month_reference: currentMonth,
          notes: newNotes || null,
        }),
      });
      if (!res.ok) throw new Error();
      setNewAmount('');
      setNewNotes('');
      setShowNewWithdrawal(false);
      toast.success('Retirada registrada!');
      await loadAll();
    } catch {
      toast.error('Erro ao registrar retirada');
    } finally {
      setSaving(false);
    }
  };

  const deleteWithdrawal = async (id: number) => {
    if (!window.confirm('Excluir esta retirada?')) return;
    try {
      const res = await fetch(`/api/withdrawals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Retirada excluída');
      await loadAll();
    } catch {
      toast.error('Erro ao excluir retirada');
    }
  };

  const DAS_MEI = 75.00;
  const reservePercentage = settings?.percentage || 20;
  const reserveAmount = (monthlyRevenue * reservePercentage) / 100;
  const recommendedAmount = Math.max(0, monthlyRevenue - DAS_MEI - reserveAmount);
  const availableAmount = Math.max(0, recommendedAmount - monthlyWithdrawn);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Controle de Retiradas (MEI)</h2>
          <p className="text-xs text-slate-400 mt-0.5">Distribuição isenta de impostos</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Config</span>
        </button>
      </div>

      {/* Breakdown Card */}
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 space-y-2">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Cálculo do Mês</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Faturamento bruto</span>
            <span className="text-white font-semibold">R$ {fmt(monthlyRevenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">(-) DAS MEI</span>
            <span className="text-red-400 font-semibold">- R$ {fmt(DAS_MEI)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">(-) Reserva ({reservePercentage}%)</span>
            <span className="text-yellow-400 font-semibold">- R$ {fmt(reserveAmount)}</span>
          </div>
          <div className="h-px bg-slate-600" />
          <div className="flex justify-between text-sm">
            <span className="text-green-300 font-semibold">Disponível para retirada</span>
            <span className="text-green-400 font-bold">R$ {fmt(recommendedAmount)}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white">
          <div className="flex items-start justify-between mb-1">
            <span className="text-xs opacity-90">Ainda disponível</span>
            <DollarSign className="w-3 h-3" />
          </div>
          <p className="text-base font-bold">R$ {fmt(availableAmount)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 text-white">
          <div className="flex items-start justify-between mb-1">
            <span className="text-xs opacity-90">Já retirado</span>
            <TrendingDown className="w-3 h-3" />
          </div>
          <p className="text-base font-bold">R$ {fmt(monthlyWithdrawn)}</p>
          <p className="text-xs opacity-75">
            {monthlyRevenue > 0 ? ((monthlyWithdrawn / monthlyRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Warning */}
      {availableAmount <= 0 && monthlyWithdrawn > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300 font-semibold">⚠️ Limite de retirada atingido este mês</p>
        </div>
      )}

      {/* New Withdrawal Button */}
      <button
        onClick={() => setShowNewWithdrawal(true)}
        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Nova Retirada
      </button>

      {/* History */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-white font-semibold text-sm">Histórico</h3>
        </div>
        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma retirada este mês</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {withdrawals.map((w) => (
              <div key={w.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">R$ {fmt(Number(w.amount))}</p>
                  <p className="text-slate-400 text-xs">
                    {new Date(w.withdrawal_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    {w.notes && ` — ${w.notes}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteWithdrawal(w.id)}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Withdrawal Modal */}
      {showNewWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-sm border border-blue-500/30 shadow-2xl">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 rounded-t-xl flex justify-between items-center border-b border-blue-500/30">
              <h3 className="text-white font-bold">Nova Retirada</h3>
              <button onClick={() => setShowNewWithdrawal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">
                  Valor (R$) * <span className="text-slate-500 font-normal">máx. R$ {fmt(availableAmount)}</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Observação (opcional)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Pagamento de conta pessoal"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowNewWithdrawal(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all">
                  Cancelar
                </button>
                <button onClick={createWithdrawal} disabled={saving || !newAmount}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold transition-all">
                  {saving ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-sm border border-slate-600 shadow-2xl">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-t-xl flex justify-between items-center border-b border-slate-700">
              <h3 className="text-white font-bold">Configurações</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Percentual de Reserva (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-slate-500 text-xs mt-1">Percentual do faturamento reservado para emergências. Recomendado: 20%</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSettings(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all">
                  Cancelar
                </button>
                <button onClick={saveSettings} disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold transition-all">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
