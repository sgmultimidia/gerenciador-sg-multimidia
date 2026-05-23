import { X, CheckCircle, Send, Download, Receipt, FileText, Trash2, FileCheck, Calendar } from 'lucide-react';
import type { Client, Quote, Receipt as ReceiptType } from '@/shared/types';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { formatBRL } from '@/react-app/utils/formatBRL';

interface QuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  client: Client | null;
  receiptsHistory: ReceiptType[];
  onApprove?: (quoteId: number) => void;
  onDelete?: (quoteId: number) => void;
  onWhatsApp?: (quote: Quote, client: Client) => void;
  onPDF?: (quote: Quote, client: Client) => void;
  onReceipt?: (quote: Quote, client: Client) => void;
  onContract?: (quote: Quote, client: Client) => void;
  onPix?: (quote: Quote, client: Client) => void;
  onShowReceipts?: (quote: Quote, receipts: ReceiptType[]) => void;
}

export default function QuoteDetailsModal({
  isOpen,
  onClose,
  quote,
  client,
  receiptsHistory,
  onApprove,
  onDelete,
  onWhatsApp,
  onPDF,
  onReceipt,
  onContract,
  onPix,
  onShowReceipts
}: QuoteDetailsModalProps) {
  useLockBodyScroll(isOpen);
  
  if (!isOpen || !quote || !client) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30 max-w-3xl w-full my-8 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 border-b border-blue-500/30">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-3xl font-bold text-white">Orçamento #{quote.quote_number}</h3>
                {quote.status === 'approved' && (
                  <span className="px-3 py-1 rounded-full bg-green-600 text-white font-semibold flex items-center gap-1.5 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    APROVADO
                  </span>
                )}
              </div>
              <p className="text-blue-200 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(quote.created_at).toLocaleString('pt-BR', { 
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Client Info */}
          <div className="bg-slate-700/50 rounded-lg p-5 mb-6 border border-slate-600">
            <h4 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              CLIENTE
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-xs mb-1">Nome</p>
                <p className="text-white font-medium">{client.name}</p>
              </div>
              {client.whatsapp && (
                <div>
                  <p className="text-slate-400 text-xs mb-1">WhatsApp</p>
                  <p className="text-white font-medium">{client.whatsapp}</p>
                </div>
              )}
              {client.cpf_cnpj && (
                <div>
                  <p className="text-slate-400 text-xs mb-1">CPF/CNPJ</p>
                  <p className="text-white font-medium">{client.cpf_cnpj}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-slate-700/50 rounded-lg p-5 mb-6 border border-slate-600">
            <h4 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              ITENS DO ORÇAMENTO
            </h4>
            <div className="space-y-3">
              {quote.items.map((item, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.type === 'service' ? 'bg-blue-600' : 'bg-purple-600'
                        } text-white font-semibold`}>
                          {item.type === 'service' ? 'SERVIÇO' : 'PACOTE'}
                        </span>
                        <p className="text-white font-medium">{item.name}</p>
                      </div>
                      {item.comboDetails && item.comboDetails.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {item.comboDetails.map((detail, idx) => (
                            <p key={idx} className="text-slate-400 text-sm flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                              {detail}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-cyan-400 font-bold text-lg">R$ {formatBRL(item.price)}</p>
                      {item.displacement && item.displacement > 0 && (
                        <p className="text-slate-400 text-xs">+ Deslocamento: R$ {formatBRL(item.displacement)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg p-5 mb-6 border border-cyan-500/30">
            <h4 className="text-cyan-300 font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              RESUMO FINANCEIRO
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Subtotal</span>
                <span className="text-white font-semibold text-lg">R$ {formatBRL(quote.subtotal)}</span>
              </div>
              {quote.discount_percentage > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-400">Desconto ({quote.discount_percentage}%)</span>
                  <span className="text-green-400 font-semibold">-R$ {formatBRL((quote.subtotal * quote.discount_percentage / 100))}</span>
                </div>
              )}
              {quote.discount_value && quote.discount_value > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-400">Desconto (Valor Fixo)</span>
                  <span className="text-green-400 font-semibold">-R$ {formatBRL(quote.discount_value)}</span>
                </div>
              )}
              <div className="h-px bg-slate-600 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-white font-bold text-xl">TOTAL</span>
                <span className="text-cyan-400 font-bold text-3xl">R$ {formatBRL(quote.total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {receiptsHistory && receiptsHistory.length > 0 && onShowReceipts && (
              <button
                onClick={() => onShowReceipts(quote, receiptsHistory)}
                className="w-full px-4 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg font-semibold transition-all border border-green-500/50 flex items-center justify-center gap-2"
              >
                <FileCheck className="w-5 h-5" />
                Ver Histórico de Recibos ({receiptsHistory.length})
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {onWhatsApp && (
                <button
                  onClick={() => onWhatsApp(quote, client)}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  WhatsApp
                </button>
              )}
              {onPDF && (
                <button
                  onClick={() => onPDF(quote, client)}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  PDF
                </button>
              )}
              {onReceipt && (
                <button
                  onClick={() => {
                    if (quote.status === 'approved') {
                      onReceipt(quote, client);
                    }
                  }}
                  disabled={quote.status !== 'approved'}
                  className={`px-4 py-3 ${
                    quote.status === 'approved'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/50'
                      : 'bg-gray-600 cursor-not-allowed opacity-50'
                  } text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2`}
                  title={quote.status === 'approved' ? 'Gerar recibo' : 'Disponível apenas para orçamentos aprovados'}
                >
                  <Receipt className="w-5 h-5" />
                  Recibo
                </button>
              )}
              {onPix && (
                <button
                  onClick={() => {
                    if (quote.status === 'approved') {
                      onPix(quote, client);
                    }
                  }}
                  disabled={quote.status !== 'approved'}
                  className={`px-4 py-3 ${
                    quote.status === 'approved'
                      ? 'bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-500/50'
                      : 'bg-gray-600 cursor-not-allowed opacity-50'
                  } text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2`}
                  title={quote.status === 'approved' ? 'Cobrar via Pix' : 'Disponível apenas para orçamentos aprovados'}
                >
                  <QrCode className="w-5 h-5" />
                  Pix
                </button>
              )}
            </div>

            {onContract && (
              <button
                onClick={() => {
                  if (quote.status === 'approved') {
                    onContract(quote, client);
                  }
                }}
                disabled={quote.status !== 'approved'}
                className={`w-full px-4 py-3 ${
                  quote.status === 'approved'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-purple-500/50'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                } text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2`}
                title={quote.status === 'approved' ? 'Gerar contrato' : 'Disponível apenas para orçamentos aprovados'}
              >
                <FileText className="w-5 h-5" />
                Gerar Contrato de Prestação de Serviços
              </button>
            )}

            <div className="flex gap-3">
              {quote.status === 'pending' && onApprove && (
                <button
                  onClick={() => onApprove(quote.id)}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Aprovar Orçamento
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(quote.id)}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Excluir
                </button>
              )}
            </div>

            {quote.status === 'pending' && (
              <p className="text-slate-400 text-xs text-center">
                Ao aprovar, todos os outros orçamentos pendentes deste cliente serão excluídos
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
