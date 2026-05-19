import { useState, useEffect } from 'react';
import { X, Download, TrendingUp, TrendingDown, DollarSign, Calendar, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { generateFinancialReportPDF } from '@/react-app/utils/pdfGenerator';

interface FinancialReportsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportData {
  monthly_revenue: Array<{ month: string; income: number; expense: number; profit: number }>;
  category_breakdown: Array<{ category: string; amount: number; percentage: number }>;
  payment_methods: Array<{ method: string; total: number; count: number }>;
  summary: {
    total_income: number;
    total_expense: number;
    profit: number;
    avg_ticket: number;
    transactions_count: number;
  };
}

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function FinancialReports({ isOpen, onClose }: FinancialReportsProps) {
  useLockBodyScroll(isOpen);
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set default dates (last 3 months)
      const today = new Date();
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && startDate && endDate) {
      loadReportData();
    }
  }, [isOpen, startDate, endDate]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/financial-report?start_date=${startDate}&end_date=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      // Error loading report - silently fail
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(monthNum) - 1]}/${year.slice(2)}`;
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csv = 'RELATÓRIO FINANCEIRO - SG Multimídia\n\n';
    csv += `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}\n\n`;
    
    csv += 'RESUMO\n';
    csv += `Receita Total,${reportData.summary.total_income}\n`;
    csv += `Despesas Totais,${reportData.summary.total_expense}\n`;
    csv += `Lucro,${reportData.summary.profit}\n`;
    csv += `Ticket Médio,${reportData.summary.avg_ticket}\n`;
    csv += `Transações,${reportData.summary.transactions_count}\n\n`;
    
    csv += 'RECEITA MENSAL\n';
    csv += 'Mês,Receita,Despesas,Lucro\n';
    reportData.monthly_revenue.forEach(row => {
      csv += `${row.month},${row.income},${row.expense},${row.profit}\n`;
    });
    
    csv += '\nCATEGORIAS DE DESPESAS\n';
    csv += 'Categoria,Valor,Percentual\n';
    reportData.category_breakdown.forEach(row => {
      csv += `${row.category},${row.amount},${row.percentage}%\n`;
    });
    
    csv += '\nMÉTODOS DE PAGAMENTO\n';
    csv += 'Método,Total,Quantidade\n';
    reportData.payment_methods.forEach(row => {
      csv += `${row.method},${row.total},${row.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_financeiro_${startDate}_${endDate}.csv`;
    link.click();
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    try {
      // Get all transactions for the period
      const response = await fetch(`/api/cash-transactions?start_date=${startDate}&end_date=${endDate}`);
      const transactions = response.ok ? await response.json() : [];

      const period = `${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`;
      
      generateFinancialReportPDF({
        period,
        revenue: reportData.summary.total_income,
        expenses: reportData.summary.total_expense,
        profit: reportData.summary.profit,
        transactions: transactions.map((t: any) => ({
          date: t.transaction_date,
          description: t.description,
          type: t.type,
          amount: t.amount,
        })),
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  if (!isOpen) return null;

  const monthlyData = reportData?.monthly_revenue.map(r => ({
    month: formatMonth(r.month),
    Receita: r.income,
    Despesas: r.expense,
    Lucro: r.profit
  })).reverse() || [];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-7xl max-h-[90vh] my-8 shadow-2xl border border-blue-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 border-b border-green-500/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Relatórios Financeiros</h2>
              <p className="text-green-200">Análise detalhada de receitas e despesas</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToPDF}
                disabled={!reportData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md font-semibold transition-all flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Gerar PDF
              </button>
              <button
                onClick={exportToCSV}
                disabled={!reportData}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md font-semibold transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Exportar CSV
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Date Filters */}
        <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div className="flex items-center gap-3">
              <label className="text-white font-semibold">De:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-white font-semibold">Até:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-white flex-shrink-0" />
                    <span className="text-green-100 text-sm font-medium">Receita</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(reportData.summary.total_income)}</p>
                </div>

                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-5 h-5 text-white flex-shrink-0" />
                    <span className="text-red-100 text-sm font-medium">Despesas</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(reportData.summary.total_expense)}</p>
                </div>

                <div className={`bg-gradient-to-br ${reportData.summary.profit >= 0 ? 'from-blue-600 to-blue-700' : 'from-orange-600 to-orange-700'} rounded-lg p-4 shadow-lg`}>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-white flex-shrink-0" />
                    <span className="text-blue-100 text-sm font-medium">Lucro</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(reportData.summary.profit)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-white flex-shrink-0" />
                    <span className="text-purple-100 text-sm font-medium">Ticket Médio</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(reportData.summary.avg_ticket)}</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-white flex-shrink-0" />
                    <span className="text-cyan-100 text-sm font-medium">Transações</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white">{reportData.summary.transactions_count}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue Chart */}
                <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-xl font-bold text-white mb-4">Evolução Mensal</h3>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                          labelStyle={{ color: '#e2e8f0' }}
                          formatter={(value) => formatCurrency(Number(value || 0))}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="Lucro" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                      Sem dados no período selecionado
                    </div>
                  )}
                </div>

                {/* Category Breakdown */}
                <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-xl font-bold text-white mb-4">Despesas por Categoria</h3>
                  {reportData.category_breakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={reportData.category_breakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => `${entry.category} (${entry.percentage.toFixed(1)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {reportData.category_breakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                          formatter={(value) => formatCurrency(Number(value || 0))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                      Sem despesas categorizadas
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                <h3 className="text-xl font-bold text-white mb-4">Métodos de Pagamento</h3>
                {reportData.payment_methods.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.payment_methods}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="method" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        formatter={(value) => formatCurrency(Number(value || 0))}
                      />
                      <Legend />
                      <Bar dataKey="total" fill="#3b82f6" name="Total Recebido" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    Sem dados de métodos de pagamento
                  </div>
                )}
              </div>

              {/* Detailed Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-xl font-bold text-white mb-4">Detalhamento de Categorias</h3>
                  <div className="space-y-2">
                    {reportData.category_breakdown.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                        <span className="text-white">{cat.category}</span>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(cat.amount)}</p>
                          <p className="text-slate-400 text-sm">{cat.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-xl font-bold text-white mb-4">Detalhamento de Pagamentos</h3>
                  <div className="space-y-2">
                    {reportData.payment_methods.map((method, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                        <span className="text-white">{method.method}</span>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(method.total)}</p>
                          <p className="text-slate-400 text-sm">{method.count} transações</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              Selecione um período para gerar o relatório
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
