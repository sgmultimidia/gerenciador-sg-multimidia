import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import ResponsiveModal from './ResponsiveModal';
import ContractTemplateEditor from './contracts/ContractTemplateEditor';
import ContractGenerator from './contracts/ContractGenerator';
import ContractViewer from './contracts/ContractViewer';

interface ContractTemplate {
  id: number;
  name: string;
  description: string;
  content: string;
  is_default: boolean;
  service_types: string;
  created_at: string;
  updated_at: string;
}

interface Contract {
  id: number;
  quote_id: number;
  template_id: number;
  contract_number: string;
  content: string;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  quote_number?: string;
  quote_total?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContractsManagement({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'templates' | 'contracts'>('contracts');
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showContractGenerator, setShowContractGenerator] = useState(false);
  const [showContractViewer, setShowContractViewer] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'templates') {
        const response = await fetch('/api/contracts/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } else {
        const response = await fetch('/api/contracts');
        if (response.ok) {
          const data = await response.json();
          setContracts(data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const response = await fetch(`/api/contracts/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Erro ao excluir template');
    }
  };

  const handleDeleteContract = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;

    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Erro ao excluir contrato');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Erro ao excluir contrato');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      draft: { label: 'Rascunho', color: 'bg-slate-500/20 text-slate-300' },
      sent: { label: 'Enviado', color: 'bg-blue-500/20 text-blue-300' },
      signed: { label: 'Assinado', color: 'bg-green-500/20 text-green-300' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <>
      <ResponsiveModal
        isOpen={isOpen}
        onClose={onClose}
        title="Gestão de Contratos"
      >
        <div className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'contracts'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Contratos
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Templates
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              if (activeTab === 'templates') {
                setSelectedTemplate(null);
                setShowTemplateEditor(true);
              } else {
                setShowContractGenerator(true);
              }
            }}
            className="mb-4 w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'templates' ? 'Novo Template' : 'Gerar Contrato'}
          </button>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-400">Carregando...</div>
              </div>
            ) : activeTab === 'templates' ? (
              <div className="space-y-3">
                {templates.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    Nenhum template encontrado
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium truncate">
                              {template.name}
                            </h3>
                            {!!template.is_default && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">
                                Padrão
                              </span>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-slate-400 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowTemplateEditor(true);
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {contracts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    Nenhum contrato encontrado
                  </div>
                ) : (
                  contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-white font-medium">
                              {contract.contract_number}
                            </h3>
                            {getStatusBadge(contract.status)}
                          </div>
                          <p className="text-sm text-slate-300 mb-1">
                            Cliente: {contract.client_name}
                          </p>
                          <p className="text-sm text-slate-400">
                            Orçamento: #{contract.quote_number}
                          </p>
                          {contract.sent_at && (
                            <p className="text-xs text-slate-500 mt-1">
                              Enviado em {new Date(contract.sent_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {contract.signed_at && (
                            <p className="text-xs text-green-400 mt-1">
                              Assinado em {new Date(contract.signed_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowContractViewer(true);
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContract(contract.id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </ResponsiveModal>

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <ContractTemplateEditor
          isOpen={showTemplateEditor}
          onClose={() => {
            setShowTemplateEditor(false);
            setSelectedTemplate(null);
            loadData();
          }}
          template={selectedTemplate}
        />
      )}

      {/* Contract Generator Modal */}
      {showContractGenerator && (
        <ContractGenerator
          isOpen={showContractGenerator}
          onClose={() => {
            setShowContractGenerator(false);
            loadData();
          }}
        />
      )}

      {/* Contract Viewer Modal */}
      {showContractViewer && selectedContract && (
        <ContractViewer
          isOpen={showContractViewer}
          onClose={() => {
            setShowContractViewer(false);
            setSelectedContract(null);
            loadData();
          }}
          contract={selectedContract}
        />
      )}
    </>
  );
}
