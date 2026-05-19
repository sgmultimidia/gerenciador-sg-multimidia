import { useState, useEffect } from 'react';
import { FileText, Calendar } from 'lucide-react';
import ResponsiveModal from '../ResponsiveModal';
import { Select } from '../ui';

interface Quote {
  id: number;
  quote_number: string;
  client_id: number;
  client_name: string;
  total: number;
  status: string;
  created_at: string;
  items?: string;
}

interface ContractTemplate {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preSelectedQuoteId?: number;
}

export default function ContractGenerator({ isOpen, onClose, preSelectedQuoteId }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [revisionsIncluded, setRevisionsIncluded] = useState('2 rodadas');
  const [generating, setGenerating] = useState(false);
  const [recommendedTemplate, setRecommendedTemplate] = useState<ContractTemplate | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preSelectedQuoteId && quotes.length > 0) {
      setSelectedQuoteId(String(preSelectedQuoteId));
    }
  }, [preSelectedQuoteId, quotes]);

  const loadData = async () => {
    try {
      // Load approved quotes
      const quotesResponse = await fetch('/api/quotes');
      if (quotesResponse.ok) {
        const allQuotes = await quotesResponse.json();
        setQuotes(allQuotes.filter((q: Quote) => q.status === 'approved'));
      }

      // Load templates
      const templatesResponse = await fetch('/api/contracts/templates');
      if (templatesResponse.ok) {
        const data = await templatesResponse.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const detectRecommendedTemplate = (quoteId: string) => {
    const quote = quotes.find(q => q.id === parseInt(quoteId));
    if (!quote || !quote.items) return null;

    try {
      const items = JSON.parse(quote.items);
      const hasLiveStreaming = items.some((item: any) => 
        item.name.toLowerCase().includes('transmissão') || 
        item.name.toLowerCase().includes('transmissao') ||
        item.name.toLowerCase().includes('live') ||
        item.name.toLowerCase().includes('ao vivo')
      );

      if (hasLiveStreaming) {
        // Find live streaming template
        const liveTemplate = templates.find(t => 
          t.name.includes('Transmissão ao Vivo') ||
          t.name.includes('Live')
        );
        return liveTemplate || null;
      }
    } catch (error) {
      console.error('Error parsing quote items:', error);
    }

    return null;
  };

  useEffect(() => {
    if (selectedQuoteId && templates.length > 0) {
      const recommended = detectRecommendedTemplate(selectedQuoteId);
      setRecommendedTemplate(recommended);
      
      // Auto-select recommended template if available
      if (recommended && !selectedTemplateId) {
        setSelectedTemplateId(String(recommended.id));
      }
    }
  }, [selectedQuoteId, templates]);

  const handleGenerate = async () => {
    if (!selectedQuoteId) {
      alert('Selecione um orçamento');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: parseInt(selectedQuoteId),
          template_id: selectedTemplateId ? parseInt(selectedTemplateId) : undefined,
          start_date: startDate,
          revisions_included: revisionsIncluded,
        }),
      });

      if (response.ok) {
        alert('Contrato gerado com sucesso!');
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao gerar contrato');
      }
    } catch (error) {
      console.error('Error generating contract:', error);
      alert('Erro ao gerar contrato');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerar Novo Contrato"
    >
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium mb-1">
                Como funciona?
              </p>
              <p className="text-xs text-blue-200/80">
                Selecione um orçamento aprovado e um template. O sistema vai gerar automaticamente
                um contrato preenchido com os dados do cliente e do orçamento.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Orçamento Aprovado *
          </label>
          <Select
            value={selectedQuoteId}
            onChange={(e) => setSelectedQuoteId(e.target.value)}
          >
            <option value="">Selecione um orçamento</option>
            {quotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                #{quote.quote_number} - {quote.client_name} - R$ {quote.total.toFixed(2)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Template
          </label>
          {recommendedTemplate && (
            <div className="mb-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-300">
                ✓ Template recomendado: <span className="font-semibold">{recommendedTemplate.name}</span>
              </p>
              <p className="text-xs text-green-200/70 mt-1">
                Detectamos serviços de transmissão ao vivo neste orçamento
              </p>
            </div>
          )}
          <Select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            <option value="">Seleção automática (recomendado)</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.is_default ? '(Padrão)' : ''}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Data de Início
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Revisões Incluídas
          </label>
          <Select
            value={revisionsIncluded}
            onChange={(e) => setRevisionsIncluded(e.target.value)}
          >
            <option value="1 rodada">1 rodada</option>
            <option value="2 rodadas">2 rodadas</option>
            <option value="3 rodadas">3 rodadas</option>
            <option value="Ilimitadas">Ilimitadas</option>
          </Select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedQuoteId}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {generating ? 'Gerando...' : 'Gerar Contrato'}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
