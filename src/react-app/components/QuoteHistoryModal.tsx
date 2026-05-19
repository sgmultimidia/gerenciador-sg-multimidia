import { X, History, CheckCircle, Send, Download, Receipt, FileText, Trash2, FileCheck } from 'lucide-react';
import type { Client, Quote, Receipt as ReceiptType } from '@/shared/types';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface QuoteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  quotes: Quote[];
  receiptsHistory: { [quoteId: number]: ReceiptType[] };
  loading: boolean;
  onApprove: (quoteId: number) => void;
  onDelete: (quoteId: number) => void;
  onWhatsApp: (quote: Quote, client: Client) => void;
  onPDF: (quote: Quote, client: Client) => void;
  onReceipt: (quote: Quote, client: Client) => void;
  onContract: (quote: Quote, client: Client) => void;
  onShowReceipts: (quote: Quote, receipts: ReceiptType[]) => void;
}

export default function QuoteHistoryModal({
  isOpen,
  onClose,
  client,
  quotes,
  receiptsHistory,
  loading,
  onApprove,
  onDelete,
  onWhatsApp,
  onPDF,
  onReceipt,
  onContract,
  onShowReceipts
}: QuoteHistoryModalProps) {
  useLockBodyScroll(isOpen);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30 max-w-4xl w-full max-h-[90vh] my-8 flex flex-col">
        <div className="bg-slate-800 border-b border-blue-500/30 p-6 flex justify-between items-center flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <History className="w-8 h-8 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">Histórico de Orçamentos</h3>
            </div>
            {client && (
              <p className="text-slate-400 text-sm">Cliente: {client.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 text-center text-lg">Nenhum orçamento encontrado</p>
              <p className="text-slate-500 text-center text-sm mt-2">Os orçamentos gerados aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className={`bg-slate-700/50 rounded-lg p-5 border transition-all ${
                  quote.status === 'approved' 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-slate-600 hover:border-blue-500/50'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-bold text-lg">Orçamento #{quote.quote_number}</h4>
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
                      <p className="text-slate-400 text-sm">
                        {new Date(quote.created_at).toLocaleString('pt-BR', { 
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-bold text-2xl">R$ {quote.total.toFixed(2)}</p>
                      {quote.discount_percentage > 0 && (
                        <p className="text-slate-400 text-sm">Desconto: {quote.discount_percentage}%</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-600 pt-4 mt-4">
                    <h5 className="text-blue-300 font-semibold text-sm mb-3 uppercase tracking-wide">Itens:</h5>
                    <div className="space-y-2">
                      {quote.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded ${item.type === 'service' ? 'bg-blue-600' : 'bg-cyan-600'} text-white font-semibold flex-shrink-0`}>
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
                        <span className="text-cyan-400 font-semibold">-R$ {(quote.subtotal * quote.discount_percentage / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-slate-600">
                      <span className="text-white">Total:</span>
                      <span className="text-cyan-400">R$ {quote.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-600 pt-4 mt-4">
                    {receiptsHistory[quote.id] && receiptsHistory[quote.id].length > 0 && (
                      <button
                        onClick={() => onShowReceipts(quote, receiptsHistory[quote.id])}
                        className="w-full mb-3 px-4 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg font-semibold transition-all border border-green-500/50 flex items-center justify-center gap-2"
                      >
                        <FileCheck className="w-5 h-5" />
                        Ver Histórico de Recibos ({receiptsHistory[quote.id].length})
                      </button>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <button
                        onClick={() => client && onWhatsApp(quote, client)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Send className="w-4 h-4" /> WhatsApp
                      </button>
                      <button
                        onClick={() => client && onPDF(quote, client)}
                        className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-slate-500/50 flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Download className="w-4 h-4" /> PDF
                      </button>
                      <button
                        onClick={() => {
                          if (quote.status === 'approved' && client) {
                            onReceipt(quote, client);
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
                    </div>
                    
                    <button
                      onClick={() => {
                        if (quote.status === 'approved' && client) {
                          onContract(quote, client);
                        }
                      }}
                      disabled={quote.status !== 'approved'}
                      className={`w-full mb-2 px-4 py-3 ${
                        quote.status === 'approved'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-purple-500/50'
                          : 'bg-gray-600 cursor-not-allowed opacity-50'
                      } text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2`}
                      title={quote.status === 'approved' ? 'Gerar contrato' : 'Disponível apenas para orçamentos aprovados'}
                    >
                      <FileText className="w-5 h-5" />
                      Gerar Contrato de Prestação de Serviços
                    </button>
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
                    {quote.status === 'pending' && (
                      <p className="text-slate-400 text-xs text-center mt-2">
                        Ao aprovar, todos os outros orçamentos pendentes deste cliente serão excluídos
                      </p>
                    )}
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
