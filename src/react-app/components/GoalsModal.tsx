import { useState, useEffect } from 'react';
import { X, Target, Plus, Trash2, Edit2, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useToast } from './ToastContainer';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface Goal {
  id: number;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalsModal({ isOpen, onClose }: GoalsModalProps) {
  const toast = useToast();
  useLockBodyScroll(isOpen, onClose);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsRes, balanceRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/cash-balance'),
      ]);
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (balanceRes.ok) {
        const b = await balanceRes.json();
        setCashBalance(Number(b.balance) || 0);
      }
    } catch {
      toast.error('Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setName(goal.name);
      setDescription(goal.description || '');
      setTargetAmount(String(goal.target_amount));
      setDeadline(goal.deadline || '');
    } else {
      setEditingGoal(null);
      setName('');
      setDescription('');
      setTargetAmount('');
      setDeadline('');
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  const saveGoal = async () => {
    if (!name || !targetAmount) { toast.warning('Nome e valor são obrigatórios'); return; }
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) { toast.warning('Valor inválido'); return; }

    setSaving(true);
    try {
      const payload = { name, description, target_amount: amount, deadline: deadline || null };
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals';
      const method = editingGoal ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGoal ? { ...payload, status: editingGoal.status } : payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingGoal ? 'Meta atualizada!' : 'Meta criada!');
      closeForm();
      await loadData();
    } catch {
      toast.error('Erro ao salvar meta');
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (id: number) => {
    if (!window.confirm('Excluir esta meta?')) return;
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      toast.success('Meta excluída');
      await loadData();
    } catch {
      toast.error('Erro ao excluir meta');
    }
  };

  const completeGoal = async (goal: Goal) => {
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goal, status: 'completed' }),
      });
      toast.success('Meta concluída! 🎉');
      await loadData();
    } catch {
      toast.error('Erro ao atualizar meta');
    }
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const getMonthsLeft = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline + '-01');
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  const getProgress = (goal: Goal) => {
    const progress = (cashBalance / goal.target_amount) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getMonthlySuggestion = (goal: Goal) => {
    if (!goal.deadline) return null;
    const months = getMonthsLeft(goal.deadline);
    if (months <= 0) return null;
    const remaining = Math.max(0, goal.target_amount - cashBalance);
    return remaining / months;
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] shadow-2xl border border-yellow-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900 to-amber-900 border-b border-yellow-500/30 p-5 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Metas Financeiras</h3>
              <p className="text-yellow-200 text-sm">Saldo atual: <span className="font-bold text-white">R$ {fmt(cashBalance)}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openForm()}
              className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> Nova Meta
            </button>
            <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
            </div>
          ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma meta cadastrada</p>
              <p className="text-sm mt-1">Crie uma meta para acompanhar seu progresso financeiro</p>
            </div>
          ) : (
            <>
              {/* Active Goals */}
              {activeGoals.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Metas Ativas</h4>
                  {activeGoals.map(goal => {
                    const progress = getProgress(goal);
                    const monthlyNeeded = getMonthlySuggestion(goal);
                    const monthsLeft = goal.deadline ? getMonthsLeft(goal.deadline) : null;
                    const isAchievable = cashBalance >= goal.target_amount;
                    const isNearDeadline = monthsLeft !== null && monthsLeft <= 2;

                    return (
                      <div key={goal.id} className={`bg-slate-700/50 rounded-xl p-4 border transition-all ${
                        isAchievable ? 'border-green-500/50 bg-green-500/5' :
                        isNearDeadline ? 'border-red-500/30' : 'border-slate-600'
                      }`}>
                        {/* Goal header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-bold truncate">{goal.name}</p>
                              {isAchievable && (
                                <span className="text-xs px-2 py-0.5 bg-green-600/30 text-green-300 rounded-full font-semibold flex-shrink-0">
                                  ✓ Atingível!
                                </span>
                              )}
                            </div>
                            {goal.description && (
                              <p className="text-slate-400 text-xs mt-0.5 truncate">{goal.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {isAchievable && (
                              <button onClick={() => completeGoal(goal)}
                                className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all" title="Marcar como concluída">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => openForm(goal)}
                              className="p-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteGoal(goal.id)}
                              className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">R$ {fmt(cashBalance)} de R$ {fmt(goal.target_amount)}</span>
                            <span className={`font-bold ${isAchievable ? 'text-green-400' : 'text-yellow-400'}`}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${isAchievable ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Info row */}
                        <div className="flex flex-wrap gap-3 mt-2">
                          {goal.deadline && (
                            <div className={`flex items-center gap-1 text-xs ${isNearDeadline ? 'text-red-400' : 'text-slate-400'}`}>
                              <Clock className="w-3 h-3" />
                              {monthsLeft === 0 ? 'Prazo esgotado!' :
                               monthsLeft === 1 ? '1 mês restante' :
                               `${monthsLeft} meses restantes`}
                            </div>
                          )}
                          {monthlyNeeded && monthlyNeeded > 0 && !isAchievable && (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                              <TrendingUp className="w-3 h-3" />
                              Reserve R$ {fmt(monthlyNeeded)}/mês
                            </div>
                          )}
                          {!isAchievable && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              Faltam R$ {fmt(Math.max(0, goal.target_amount - cashBalance))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Completed Goals */}
              {completedGoals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Concluídas</h4>
                  {completedGoals.map(goal => (
                    <div key={goal.id} className="bg-slate-700/30 rounded-lg p-3 border border-green-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-slate-300 font-medium text-sm">{goal.name}</p>
                          <p className="text-slate-500 text-xs">R$ {fmt(goal.target_amount)}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md border border-yellow-500/30 shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-900 to-amber-900 p-4 rounded-t-xl flex justify-between items-center border-b border-yellow-500/30">
              <h3 className="text-white font-bold">{editingGoal ? 'Editar Meta' : 'Nova Meta'}</h3>
              <button onClick={closeForm} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Nome *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: Kit Equipamentos ML"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Descrição (opcional)</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Softbox, rebatedor, iluminadores..."
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Valor Alvo (R$) *</label>
                <input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1">Prazo (opcional)</label>
                <input type="month" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold">
                  Cancelar
                </button>
                <button onClick={saveGoal} disabled={saving || !name || !targetAmount}
                  className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-semibold">
                  {saving ? 'Salvando...' : editingGoal ? 'Atualizar' : 'Criar Meta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
