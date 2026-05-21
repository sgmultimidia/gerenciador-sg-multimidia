import { useState, useEffect } from 'react';
import { X, Plus, Calendar, CheckCircle, XCircle } from 'lucide-react';
import type { RecurringProject, Client } from '@/shared/types';
import { useToast } from '@/react-app/components/ToastContainer';
import { useConfirm } from '@/react-app/components/ConfirmDialog';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { Select } from './ui';
import RecurringProjectCard from './recurring/RecurringProjectCard';
import ReceiptGenerationModal from './recurring/ReceiptGenerationModal';

interface RecurringProjectsProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

export default function RecurringProjects({ isOpen, onClose, clients }: RecurringProjectsProps) {
  const toast = useToast();
  const confirm = useConfirm();
  useLockBodyScroll(isOpen);
  
  const [projects, setProjects] = useState<RecurringProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<RecurringProject | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedProjectForReceipt, setSelectedProjectForReceipt] = useState<RecurringProject | null>(null);

  // Form fields
  const [clientId, setClientId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyValue, setMonthlyValue] = useState('');
  const [isVariableValue, setIsVariableValue] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [notes, setNotes] = useState('');

  // Receipt form fields
  

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recurring-projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        toast.error('Erro ao carregar projetos: ' + response.status);
      }
    } catch (error) {
      toast.error('Erro ao carregar projetos recorrentes: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientId('');
    setProjectName('');
    setDescription('');
    setMonthlyValue('');
    setIsVariableValue(false);
    setStartDate('');
    setEndDate('');
    setPaymentDay('');
    setNotes('');
    setEditingProject(null);
  };

  const handleSubmit = async () => {
    if (!clientId || !projectName) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }

    let value: number | null = null;
    if (monthlyValue) {
      value = parseFloat(monthlyValue);
      if (isNaN(value) || value <= 0) {
        toast.warning('Valor mensal inválido');
        return;
      }
    }

    setLoading(true);
    try {
      const url = editingProject 
        ? `/api/recurring-projects/${editingProject.id}`
        : '/api/recurring-projects';
      
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: Number(clientId),
          project_name: projectName,
          description: description || null,
          monthly_value: value,
          is_variable_value: isVariableValue ? 1 : 0,
          start_date: startDate || null,
          end_date: endDate || null,
          is_active: 1,
          payment_day: paymentDay ? Number(paymentDay) : null,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        toast.success(editingProject ? 'Projeto atualizado!' : 'Projeto criado!');
        resetForm();
        setShowModal(false);
        await loadProjects();
      } else {
        toast.error('Erro ao salvar projeto');
      }
    } catch (error) {
      toast.error('Erro ao salvar projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: RecurringProject) => {
    setEditingProject(project);
    setClientId(String(project.client_id));
    setProjectName(project.project_name);
    setDescription(project.description || '');
    setMonthlyValue(project.monthly_value ? String(project.monthly_value) : '');
    setIsVariableValue(project.is_variable_value === 1);
    setStartDate(project.start_date);
    setEndDate(project.end_date || '');
    setPaymentDay(project.payment_day ? String(project.payment_day) : '');
    setNotes(project.notes || '');
    setShowModal(true);
  };

  const handleToggleActive = async (project: RecurringProject) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recurring-projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          is_active: project.is_active ? 0 : 1,
        }),
      });

      if (response.ok) {
        toast.success(project.is_active ? 'Projeto desativado' : 'Projeto ativado');
        await loadProjects();
      } else {
        toast.error('Erro ao alterar status');
      }
    } catch (error) {
      toast.error('Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (project: RecurringProject) => {
    const confirmed = await confirm.confirm({
      title: 'Excluir Projeto Recorrente',
      message: `Tem certeza que deseja excluir o projeto "${project.project_name}"?`,
      type: 'danger'
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/recurring-projects/${project.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Projeto excluído!');
        await loadProjects();
      } else {
        toast.error('Erro ao excluir projeto');
      }
    } catch (error) {
      toast.error('Erro ao excluir projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReceipt = (project: RecurringProject) => {
    setSelectedProjectForReceipt(project);
    setShowReceiptModal(true);
  };

  const generateReceiptForProject = async (monthRef: string, amountStr: string) => {
    if (!selectedProjectForReceipt || !monthRef) {
      toast.warning('Dados incompletos');
      return;
    }

    // Determine amount based on project type and whether base value exists
    let amount: number;
    if (selectedProjectForReceipt.is_variable_value === 1 || !selectedProjectForReceipt.monthly_value) {
      // Variable project or no base value - must enter amount
      if (!amountStr) {
        toast.warning('Informe o valor para este mês');
        return;
      }
      amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        toast.warning('Valor inválido');
        return;
      }
    } else {
      // Fixed value project with base value
      amount = selectedProjectForReceipt.monthly_value;
    }

    setLoading(true);
    try {
      const client = clients.find(c => c.id === selectedProjectForReceipt.client_id);
      if (!client) {
        toast.error('Cliente não encontrado');
        setLoading(false);
        return;
      }

      // Create monthly receipt
      const receiptResponse = await fetch('/api/monthly-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          amount: amount,
          description: selectedProjectForReceipt.description || selectedProjectForReceipt.project_name,
          month_reference: monthRef
        })
      });

      if (!receiptResponse.ok) {
        throw new Error('Falha ao criar recibo');
      }

      const receipt = await receiptResponse.json();

      // Create cash transaction
      const [year, month] = monthRef.split('-');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const monthName = monthNames[parseInt(month) - 1];

      await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          amount: amount,
          description: `${selectedProjectForReceipt.project_name} - ${client.name} - ${monthName}/${year}`,
          category: 'Projeto Recorrente',
          client_id: client.id,
          quote_id: null,
          receipt_id: receipt.id,
          payment_method: null,
          transaction_date: new Date().toISOString().split('T')[0]
        })
      });

      // Generate PDF
      printReceipt(client, amount,
                   selectedProjectForReceipt.description || selectedProjectForReceipt.project_name, 
                   monthRef);
      
      toast.success('Recibo gerado com sucesso!');
      setShowReceiptModal(false);
      setSelectedProjectForReceipt(null);
    } catch (error) {
      toast.error('Erro ao gerar recibo');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (client: Client, amount: number, desc: string, monthRef: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const [year, month] = monthRef.split('-');
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthName = monthNames[parseInt(month) - 1];

    const numeroParaExtenso = (valor: number): string => {
      const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
      const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
      const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
      const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

      const parteInteira = Math.floor(valor);
      const centavos = Math.round((valor - parteInteira) * 100);
      let resultado = '';

      if (parteInteira === 0) {
        resultado = 'zero reais';
      } else {
        const milhares = Math.floor(parteInteira / 1000);
        const restante = parteInteira % 1000;
        
        if (milhares > 0) {
          if (milhares === 1) {
            resultado += 'mil';
          } else {
            const c = Math.floor(milhares / 100);
            const d = Math.floor((milhares % 100) / 10);
            const u = milhares % 10;
            
            if (c > 0) resultado += centenas[c];
            if (d === 1) {
              if (resultado) resultado += ' e ';
              resultado += especiais[u];
            } else {
              if (d > 0) {
                if (resultado) resultado += ' e ';
                resultado += dezenas[d];
              }
              if (u > 0) {
                if (resultado) resultado += ' e ';
                resultado += unidades[u];
              }
            }
            resultado += ' mil';
          }
        }

        const c = Math.floor(restante / 100);
        const d = Math.floor((restante % 100) / 10);
        const u = restante % 10;

        if (c > 0) {
          if (resultado && restante > 0) resultado += ' ';
          if (restante === 100) {
            resultado += 'cem';
          } else {
            resultado += centenas[c];
          }
        }

        if (d === 1) {
          if (resultado) resultado += ' e ';
          resultado += especiais[u];
        } else {
          if (d > 0) {
            if (resultado) resultado += ' e ';
            resultado += dezenas[d];
          }
          if (u > 0) {
            if (resultado) resultado += ' e ';
            resultado += unidades[u];
          }
        }

        resultado += parteInteira === 1 ? ' real' : ' reais';
      }

      if (centavos > 0) {
        const d = Math.floor(centavos / 10);
        const u = centavos % 10;
        
        resultado += ' e ';
        
        if (d === 1) {
          resultado += especiais[u];
        } else {
          if (d > 0) resultado += dezenas[d];
          if (u > 0) {
            if (d > 0) resultado += ' e ';
            resultado += unidades[u];
          }
        }
        
        resultado += centavos === 1 ? ' centavo' : ' centavos';
      }

      return resultado;
    };

    const valorExtenso = numeroParaExtenso(amount);
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    const content = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo Mensal - SG Multimídia</title>
        <style>
          @page { margin: 15mm; size: A4 landscape; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; color: #000; line-height: 1.4; padding: 15px; font-size: 20px; }
          .receipt-container { max-width: 100%; margin: 0 auto; border: 2px solid #000; padding: 25px 35px; min-height: 500px; }
          .header { text-align: left; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #000; }
          .header h1 { font-size: 20px; font-weight: bold; margin-bottom: 3px; letter-spacing: 1px; }
          .header .info { font-size: 20px; color: #333; line-height: 1.3; }
          .receipt-title { text-align: center; font-size: 20px; font-weight: bold; margin: 12px 0; letter-spacing: 6px; }
          .receipt-subtitle { text-align: center; font-size: 18px; color: #555; margin-bottom: 20px; }
          .content { margin: 15px 0; font-size: 20px; line-height: 1.8; }
          .content p { margin-bottom: 12px; }
          .underline { display: inline-block; border-bottom: 1px solid #000; min-width: 200px; padding: 0 5px; }
          .value-line { margin: 15px 0; }
          .footer { margin-top: 30px; }
          .date-location { text-align: right; margin-bottom: 50px; font-size: 20px; }
          .signature-section { margin-top: 40px; display: flex; justify-content: center; align-items: flex-end; }
          .signature-block { text-align: center; }
          .signature-line { border-top: 1px solid #000; width: 300px; padding-top: 5px; }
          .signature-name { font-size: 20px; font-weight: bold; }
          @media print {
            body { padding: 0; }
            .receipt-container { border: 2px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>SG Multimídia</h1>
            <div class="info">Estúdio de Produção Audiovisual</div>
            <div class="info">São Pedro do Sul - RS | WhatsApp: (55) 9 9660-2449</div>
          </div>

          <div class="receipt-title">RECIBO</div>
          <div class="receipt-subtitle">Referente ao mês de ${monthName} de ${year}</div>

          <div class="content">
            <p>
              Recebemos de <span class="underline"><strong>${client.name}</strong></span>
            </p>

            <p class="value-line">
              a quantia de <span class="underline"><strong>R$ ${amount.toFixed(2).replace('.', ',')}</strong></span> 
              (<strong>${valorExtenso}</strong>),
            </p>

            <p>
              referente a: <strong>${desc}</strong>
            </p>

            <p style="margin-top: 20px;">
              Para maior clareza, firmamos o presente recibo para que produza os seus efeitos, 
              dando plena, geral e irrevogável quitação pelo valor acima especificado.
            </p>
          </div>

          <div class="footer">
            <div class="date-location">
              ${dataFormatada}.
            </div>

            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line">
                  <div class="signature-name">${client.name}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  const activeProjects = projects.filter(p => p.is_active);
  const inactiveProjects = projects.filter(p => !p.is_active);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] my-8 shadow-2xl border border-emerald-500/30 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-4 border-b border-emerald-500/30 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Projetos Recorrentes</h2>
                <p className="text-emerald-200 text-sm hidden sm:block">Gerencie projetos mensais sem necessidade de novos orçamentos</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="p-3 border-b border-slate-700">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-700 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-white">{activeProjects.length}</p>
                <p className="text-emerald-200 text-sm">Projetos Ativos</p>
              </div>
              <div className="bg-blue-700 rounded-lg p-2 text-center">
                <p className="text-2xl font-bold text-white">
                  R$ {activeProjects.reduce((sum, p) => sum + (p.monthly_value || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-blue-200 text-sm">Receita Mensal Recorrente</p>
              </div>
              <div className="bg-slate-700 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-white">{inactiveProjects.length}</p>
                <p className="text-slate-300 text-sm">Projetos Inativos</p>
              </div>
            </div>
          </div>

          {/* Add Button */}
          <div className="p-6 border-b border-slate-700">
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-md font-semibold transition-all shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Projeto Recorrente
            </button>
          </div>

          {/* Projects List */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading && !showModal ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum projeto recorrente cadastrado</p>
                <p className="text-sm mt-2">Crie projetos que se repetem mensalmente sem precisar gerar novos orçamentos</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Projects */}
                {activeProjects.length > 0 && (
                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Projetos Ativos ({activeProjects.length})
                    </h3>
                    <div className="space-y-3">
                      {activeProjects.map((project) => {
                        try {
                          return (
                            <RecurringProjectCard
                              key={project.id}
                              project={project}
                              isActive={true}
                              onEdit={handleEdit}
                              onToggleActive={handleToggleActive}
                              onDelete={handleDelete}
                              onGenerateReceipt={handleGenerateReceipt}
                            />
                          );
                        } catch (error) {
                          console.error('Error rendering project card:', error, project);
                          return null;
                        }
                      })}
                    </div>
                  </div>
                )}

                {/* Inactive Projects */}
                {inactiveProjects.length > 0 && (
                  <div>
                    <h3 className="text-slate-400 font-semibold mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Projetos Inativos ({inactiveProjects.length})
                    </h3>
                    <div className="space-y-3">
                      {inactiveProjects.map((project) => {
                        try {
                          return (
                            <RecurringProjectCard
                              key={project.id}
                              project={project}
                              isActive={false}
                              onEdit={handleEdit}
                              onToggleActive={handleToggleActive}
                              onDelete={handleDelete}
                              onGenerateReceipt={handleGenerateReceipt}
                            />
                          );
                        } catch (error) {
                          console.error('Error rendering project card:', error, project);
                          return null;
                        }
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] shadow-2xl border border-emerald-500/30 flex flex-col">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-4 border-b border-emerald-500/30 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  {editingProject ? 'Editar Projeto Recorrente' : 'Novo Projeto Recorrente'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <Select
                label="Cliente"
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={!!editingProject}
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>

              <div>
                <label className="block text-white font-semibold mb-2">Nome do Projeto *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Exemplo: Assessoria de Marketing Mensal"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descreva os serviços incluídos no projeto..."
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Valor Mensal de Referência (R$) 
                  <span className="text-xs text-slate-400 font-normal ml-1">(opcional)</span>
                </label>
                <input
                  type="number"
                  value={monthlyValue}
                  onChange={(e) => setMonthlyValue(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Deixe vazio se não houver valor fixo"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Pode ser deixado vazio para projetos com valores determinados apenas no recibo
                </p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer bg-slate-700/30 p-3 rounded-lg hover:bg-slate-700/50 transition-all">
                  <input
                    type="checkbox"
                    checked={isVariableValue}
                    onChange={(e) => setIsVariableValue(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <span className="text-white font-semibold">Valor mensal variável</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Permitir ajustar o valor ao gerar cada recibo mensal
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Dia de Pagamento</label>
                <input
                  type="number"
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(e.target.value)}
                  min="1"
                  max="31"
                  placeholder="Exemplo: 10"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Data de Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Data de Término</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Observações internas sobre o projeto..."
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-md font-semibold transition-all shadow-lg"
              >
                {loading ? 'Salvando...' : editingProject ? 'Atualizar Projeto' : 'Criar Projeto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedProjectForReceipt && (
        <ReceiptGenerationModal
          project={selectedProjectForReceipt}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedProjectForReceipt(null);
          }}
          onGenerate={generateReceiptForProject}
          loading={loading}
        />
      )}
    </>
  );
}
