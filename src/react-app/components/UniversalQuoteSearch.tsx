import { X, Search, Trash2, CheckCircle, Send, Download, Receipt, FileText } from 'lucide-react';
import type { Quote } from '@/shared/types';
import { useIsMobile } from '@/react-app/hooks/useMediaQuery';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface UniversalQuoteSearchProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: (Quote & { client_name: string })[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onDelete: (quoteId: number) => void;
  onApprove: (quoteId: number) => void;
  onWhatsApp: (quoteId: number) => void;
  onPDF: (quoteId: number) => void;
  onReceipt: (quoteId: number) => void;
  onGenerateContract: (quoteId: number) => void;
  loading: boolean;
}

export default function UniversalQuoteSearch({
  isOpen,
  onClose,
  quotes,
  searchQuery,
  onSearchChange,
  onDelete,
  onApprove,
  onWhatsApp,
  onPDF,
  onReceipt,
  onGenerateContract,
  loading,
}: UniversalQuoteSearchProps) {
  const isMobile = useIsMobile();
  useLockBodyScroll(isOpen);
  
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop, not on the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30 max-w-6xl w-full my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 border-b border-blue-500/30 p-6 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Search className="w-8 h-8 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">Busca Universal de Orçamentos</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={isMobile ? "Buscar cliente ou orçamento..." : "Buscar por nome do cliente ou número do orçamento..."}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-400 text-center text-lg">
                Carregando orçamentos...
              </p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 text-center text-lg">
                {searchQuery ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento cadastrado'}
              </p>
              <p className="text-slate-500 text-center text-sm mt-2">
                {searchQuery ? 'Tente outro termo de busca' : 'Crie seu primeiro orçamento usando o assistente'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className={`bg-slate-700/50 rounded-lg p-5 border transition-all ${
                    quote.status === 'approved'
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-slate-600 hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="text-white font-bold text-lg">
                          Orçamento #{quote.quote_number}
                        </h4>
                        <span className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white font-semibold">
                          {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {quote.status === 'approved' && (
                          <span className="text-xs px-2.5 py-1 rounded bg-green-600 text-white font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            APROVADO
                          </span>
                        )}
                      </div>
                      <p className="text-blue-300 font-semibold truncate">Cliente: {quote.client_name}</p>
                      <p className="text-slate-400 text-sm mt-1">
                        {new Date(quote.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-cyan-400 font-bold text-2xl whitespace-nowrap">R$ {quote.total.toFixed(2)}</p>
                      {quote.discount_percentage > 0 && (
                        <p className="text-slate-400 text-sm">Desconto: {quote.discount_percentage}%</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-600 pt-4 mt-4">
                    <h5 className="text-blue-300 font-semibold text-sm mb-3 uppercase tracking-wide">
                      Itens:
                    </h5>
                    <div className="space-y-2">
                      {quote.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  item.type === 'service' ? 'bg-blue-600' : 'bg-cyan-600'
                                } text-white font-semibold flex-shrink-0`}
                              >
                                {item.type === 'service' ? 'Serviço' : 'Pacote'}
                              </span>
                              <p className="text-white text-sm font-medium break-words">{item.name}</p>
                            </div>
                            {item.comboDetails && item.comboDetails.length > 0 && (
                              <div className="ml-4 mt-1 text-slate-400 text-xs">
                                {item.comboDetails.map((detail, idx) => (
                                  <p key={idx} className="break-words">• {detail}</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <p className="text-white font-semibold whitespace-nowrap">R$ {item.price.toFixed(2)}</p>
                            {item.displacement && item.displacement > 0 && (
                              <p className="text-slate-400 text-xs">+ R$ {item.displacement.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-600 pt-4 mt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Subtotal:</span>
                      <span className="text-white font-semibold">R$ {quote.subtotal.toFixed(2)}</span>
                    </div>
                    {quote.discount_percentage > 0 && (
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-cyan-400">Desconto ({quote.discount_percentage}%):</span>
                        <span className="text-cyan-400 font-semibold">
                          -R$ {((quote.subtotal * quote.discount_percentage) / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-slate-600">
                      <span className="text-white">Total:</span>
                      <span className="text-cyan-400">R$ {quote.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-600 pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        onClick={() => onWhatsApp(quote.id)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Send className="w-4 h-4" /> WhatsApp
                      </button>
                      <button
                        onClick={() => onPDF(quote.id)}
                        className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-slate-500/50 flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Download className="w-4 h-4" /> PDF
                      </button>
                      <button
                        onClick={() => {
                          if (quote.status === 'approved') {
                            onReceipt(quote.id);
                          }
                        }}
                        disabled={quote.status !== 'approved'}
                        className={`px-3 py-2 ${
                          quote.status === 'approved'
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/50'
                            : 'bg-gray-600 cursor-not-allowed opacity-50'
                        } text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 text-xs`}
                        title={quote.status === 'approved' ? 'Gerar recibo' : 'Disponível apenas para orçamentos aprovados'}
                      >
                        <Receipt className="w-4 h-4" /> Recibo
                      </button>
                      <button
                        onClick={() => {
                          if (quote.status === 'approved') {
                            onGenerateContract(quote.id);
                          }
                        }}
                        disabled={quote.status !== 'approved'}
                        className={`px-3 py-2 ${
                          quote.status === 'approved'
                            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/50'
                            : 'bg-gray-600 cursor-not-allowed opacity-50'
                        } text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 text-xs`}
                        title={quote.status === 'approved' ? 'Gerar contrato' : 'Disponível apenas para orçamentos aprovados'}
                      >
                        <FileText className="w-4 h-4" /> Contrato
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {quote.status === 'pending' && (
                        <button
                          onClick={() => onApprove(quote.id)}
                          disabled={loading}
                          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Aprovar
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(quote.id)}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-5 h-5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
