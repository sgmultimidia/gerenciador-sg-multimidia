import { useState, useEffect } from 'react';
import { Save, Info } from 'lucide-react';
import ResponsiveModal from '../ResponsiveModal';
import { Input, Textarea } from '../ui';

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: ContractTemplate | null;
}

const AVAILABLE_VARIABLES = [
  { key: '{{client_name}}', description: 'Nome do cliente' },
  { key: '{{client_cpf_cnpj}}', description: 'CPF/CNPJ do cliente' },
  { key: '{{client_address}}', description: 'Endereço do cliente' },
  { key: '{{client_email}}', description: 'E-mail do cliente' },
  { key: '{{client_whatsapp}}', description: 'WhatsApp do cliente' },
  { key: '{{services_list}}', description: 'Lista de serviços contratados' },
  { key: '{{total_value}}', description: 'Valor total do contrato' },
  { key: '{{payment_terms}}', description: 'Condições de pagamento' },
  { key: '{{start_date}}', description: 'Data de início' },
  { key: '{{delivery_date}}', description: 'Data de entrega prevista' },
  { key: '{{revisions_included}}', description: 'Revisões incluídas' },
  { key: '{{contract_date}}', description: 'Data do contrato' },
];

export default function ContractTemplateEditor({ isOpen, onClose, template }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    is_default: false,
    service_types: 'all',
  });
  const [saving, setSaving] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        content: template.content,
        is_default: Boolean(template.is_default),
        service_types: template.service_types || 'all',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        content: '',
        is_default: false,
        service_types: 'all',
      });
    }
  }, [template]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      alert('Nome e conteúdo são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const url = template
        ? `/api/contracts/templates/${template.id}`
        : '/api/contracts/templates';
      
      const response = await fetch(url, {
        method: template ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;
      const newText = text.substring(0, start) + variable + text.substring(end);
      
      setFormData({ ...formData, content: newText });
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? 'Editar Template' : 'Novo Template'}
    >
      <div className="space-y-4">
        <Input
          label="Nome do Template"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Contrato Padrão de Produção"
        />

        <Textarea
          label="Descrição"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição opcional do template"
          rows={2}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_default"
            checked={formData.is_default}
            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_default" className="text-sm text-slate-300">
            Definir como template padrão
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">
              Conteúdo do Contrato
            </label>
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Info className="w-3 h-3" />
              {showVariables ? 'Ocultar' : 'Mostrar'} Variáveis
            </button>
          </div>

          {showVariables && (
            <div className="mb-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">
                Clique em uma variável para inseri-la no cursor:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {AVAILABLE_VARIABLES.map((variable) => (
                  <button
                    key={variable.key}
                    onClick={() => insertVariable(variable.key)}
                    className="text-left px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 rounded text-blue-300 transition-colors"
                  >
                    <span className="font-mono">{variable.key}</span>
                    <span className="text-slate-400"> - {variable.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            id="content-textarea"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Digite o conteúdo do contrato. Use as variáveis disponíveis para inserir dados dinâmicos."
            rows={15}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
