import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Download } from 'lucide-react';
import type { CashTransaction, Client } from '@/shared/types';
import { useToast } from '@/react-app/components/ToastContainer';
import { useConfirm } from '@/react-app/components/ConfirmDialog';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { Select } from './ui';

interface CashRegisterProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

export default function CashRegister({ isOpen, onClose, clients }: CashRegisterProps) {
  const toast = useToast();
  const { confirm } = useConfirm();
  useLockBodyScroll(isOpen);

  const [transactions, setTransactions] = useState<(CashTransaction & { client_name?: string })[]>([]);
  const [balance, setBalance] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);

  // Form fields
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [clientId, setClientId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const incomeCategories = [
    'Serviço Prestado',
    'Venda de Produto',
    'Orçamento Aprovado',
    'Recibo Emitido',
    'Outro'
  ];

  const expenseCategories = [
    'Aluguel',
    'Energia Elétrica',
    'Internet',
    'Telefone',
    'Equipamentos',
    'Manutenção',
    'Material de Escritório',
    'Transporte',
    'Alimentação',
    'Salários',
    'Impostos',
    'Outro'
  ];

  const paymentMethods = [
    'Dinheiro',
    'PIX',
    'Cartão de Débito',
    'Cartão de Crédito',
    'Transferência Bancária',
    'Boleto',
    'Outro'
  ];

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
      loadBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filterType, filterStartDate, filterEndDate]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      let url = '/api/cash-transactions?';
      const params: string[] = [];

      if (filterType !== 'all') params.push(`type=${filterType}`);
      if (filterStartDate) params.push(`start_date=${filterStartDate}`);
      if (filterEndDate) params.push(`end_date=${filterEndDate}`);

      url += params.join('&');

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch {
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      let url = '/api/cash-balance?';
      const params: string[] = [];

      if (filterStartDate) params.push(`start_date=${filterStartDate}`);
      if (filterEndDate) params.push(`end_date=${filterEndDate}`);

      url += params.join('&');

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch {
      toast.error('Erro ao carregar saldo');
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description || !transactionDate) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        description,
        category: category || null,
        client_id: clientId ? parseInt(clientId) : null,
        payment_method: paymentMethod || null,
        transaction_date: transactionDate
      };

      if (editingTransaction) {
        const response = await fetch(`/api/cash-transactions/${editingTransaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Erro ao atualizar transação');
        toast.success('Transação atualizada com sucesso!');
      } else {
        const response = await fetch('/api/cash-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Erro ao criar transação');
        toast.success('Transação criada com sucesso!');
      }

      resetForm();
      loadTransactions();
      loadBalance();
    } catch {
      toast.error('Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: CashTransaction) => {
    setEditingTransaction(transaction);
    setType(transaction.type);
    setAmount(transaction.amount.toString());
    setDescription(transaction.description);
    setCategory(transaction.category || '');
    setClientId(transaction.client_id?.toString() || '');
    setPaymentMethod(transaction.payment_method || '');
    setTransactionDate(transaction.transaction_date);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Excluir Transação',
      message: 'Tem certeza que deseja excluir esta transação?',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/cash-transactions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao excluir transação');

      toast.success('Transação excluída com sucesso!');
      loadTransactions();
      loadBalance();
    } catch {
      toast.error('Erro ao excluir transação');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setType('income');
    setAmount('');
    setDescription('');
    setCategory('');
    setClientId('');
    setPaymentMethod('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Cliente', 'Forma de Pagamento', 'Valor'];
    const rows = transactions.map(t => [
      new Date(t.transaction_date).toLocaleDateString('pt-BR'),
      t.type === 'income' ? 'Entrada' : 'Saída',
      t.description,
      t.category || '-',
      t.client_name || '-',
      t.payment_method || '-',
      `R$ ${t.amount.toFixed(2).replace('.', ',')}`
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `controle-caixa-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    // ✅ Backdrop NÃO rola. Só centraliza.
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto">
      {/* ✅ Modal com altura limitada */}
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30 max-w-6xl w-full max-h-[90vh] flex flex-col min-h-0">
        {/* ✅ Header FIXO (não precisa sticky se o scroll for no corpo) */}
        <div className="shrink-0 bg-slate-800 border-b border-blue-500/30 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-400" />
            <div>
              <h3 className="text-2xl font-bold text-white">Controle de Caixa</h3>
              <p className="text-slate-400 text-sm mt-1">Gerencie entradas e saídas</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ✅ Corpo do modal: ÚNICO SCROLL */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Balance Cards */}
          <div className="p-6 border-b border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-300 text-sm font-semibold uppercase tracking-wide">Entradas</span>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">R$ {balance.income.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-300 text-sm font-semibold uppercase tracking-wide">Saídas</span>
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-red-400">R$ {balance.expense.toFixed(2)}</p>
              </div>

              <div className={`bg-gradient-to-br ${balance.balance >= 0 ? 'from-blue-500/20 to-blue-600/10 border-blue-500/30' : 'from-orange-500/20 to-orange-600/10 border-orange-500/30'} border rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${balance.balance >= 0 ? 'text-blue-300' : 'text-orange-300'} text-sm font-semibold uppercase tracking-wide`}>Saldo</span>
                  <DollarSign className={`w-5 h-5 ${balance.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
                </div>
                <p className={`text-3xl font-bold ${balance.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>R$ {balance.balance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="p-4 border-b border-slate-700 flex flex-wrap gap-3">
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-500/50 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Transação
            </button>

            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exportar CSV
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <Filter className="w-5 h-5 text-slate-400" />
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="text-sm py-2"
              >
                <option value="all">Todas</option>
                <option value="income">Entradas</option>
                <option value="expense">Saídas</option>
              </Select>

              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="px-3 py-2 rounded-md bg-slate-700 text-white border border-slate-600 text-sm"
                placeholder="Data inicial"
              />

              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="px-3 py-2 rounded-md bg-slate-700 text-white border border-slate-600 text-sm"
                placeholder="Data final"
              />
            </div>
          </div>

          {/* Transactions List */}
          <div className="p-6">
            {loading && transactions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">Carregando...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-slate-400 text-center text-lg">Nenhuma transação encontrada</p>
                <p className="text-slate-500 text-center text-sm mt-2">Clique em "Nova Transação" para adicionar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className={`bg-slate-700/50 rounded-lg p-4 border ${
                      transaction.type === 'income' ? 'border-green-500/30' : 'border-red-500/30'
                    } hover:border-blue-500/50 transition-all`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${
                            transaction.type === 'income'
                              ? 'bg-green-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}>
                            {transaction.type === 'income' ? 'ENTRADA' : 'SAÍDA'}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white font-semibold whitespace-nowrap">
                            {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-white font-bold text-lg mb-1 overflow-wrap-anywhere">{transaction.description}</p>

                        {transaction.category && (
                          <p className="text-slate-400 text-sm mb-1">Categoria: {transaction.category}</p>
                        )}
                        {transaction.client_name && (
                          <p className="text-slate-400 text-sm mb-1">Cliente: {transaction.client_name}</p>
                        )}
                        {transaction.payment_method && (
                          <p className="text-slate-400 text-sm">Pagamento: {transaction.payment_method}</p>
                        )}
                      </div>

                      <div className="flex items-start gap-3 sm:flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-2xl font-bold whitespace-nowrap ${
                            transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-md transition-all"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-md transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Espaço de respiro no final, pra não “colar” no fundo */}
          <div className="h-4" />
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-lg shadow-2xl border border-green-500/30 flex flex-col">
            <div className="bg-gradient-to-r from-green-900 to-teal-900 p-5 border-b border-green-500/30 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                </h3>
                <p className="text-green-200 text-sm mt-0.5">
                  {editingTransaction ? 'Atualize os dados da transação' : 'Registre uma nova entrada ou saída'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Tipo *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setType('income')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      type === 'income' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Entrada
                  </button>
                  <button
                    onClick={() => setType('expense')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      type === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Saída
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Data *</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Descrição *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Descrição da transação"
                />
              </div>

              <Select
                label="Categoria"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Selecione...</option>
                {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>

              <Select
                label="Cliente"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Nenhum</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>

              <Select
                label="Forma de Pagamento"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Selecione...</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </Select>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold transition-all"
                >
                  {loading ? 'Salvando...' : editingTransaction ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}