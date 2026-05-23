import { X, History, Edit2, Trash2, MessageCircle, Star, FileText, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Client, Quote, MonthlyReceipt } from '@/shared/types';
import QuoteDetailsModal from './QuoteDetailsModal';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { backdropVariants, modalVariants } from '@/react-app/utils/animations';
import { formatBRL } from '@/react-app/utils/formatBRL';

interface ClientActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSelectClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: number) => Promise<void>;
  onToggleFavorite: (client: Client) => Promise<void>;
  onQuoteWhatsApp?: (quote: any, client: Client) => void;
  onQuotePDF?: (quote: any, client: Client) => void;
  onQuoteReceipt?: (quote: any, client: Client) => void;
  onQuoteContract?: (quote: any, client: Client) => void;
  onMonthlyReceiptPDF?: (receipt: MonthlyReceipt, client: Client) => void;
}

interface ClientHistory {
  quotes: Quote[];
  monthlyReceipts: MonthlyReceipt[];
  serviceStats?: { name: string; count: number; total: number }[];
}

export default function ClientActionsModal({
  isOpen,
  onClose,
  client,
  onSelectClient,
  onEditClient,
  onDeleteClient,
  onToggleFavorite,
  onQuoteWhatsApp,
  onQuotePDF,
  onQuoteReceipt,
  onQuoteContract,
  onMonthlyReceiptPDF
}: ClientActionsModalProps) {
  useLockBodyScroll(isOpen);
  
  const [showHistory, setShowHistory] = useState(false);
  const [clientHistory, setClientHistory] = useState<ClientHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowHistory(false);
      setClientHistory(null);
      setSelectedQuote(null);
      setShowQuoteDetails(false);
    }
  }, [isOpen]);

  const loadClientHistory = async () => {
    if (!client) return;

    setLoadingHistory(true);
    
    try {
      const quotesResponse = await fetch(`/api/quotes/client/${client.id}`);
      const quotes = quotesResponse.ok ? await quotesResponse.json() : [];

      const receiptsResponse = await fetch(`/api/monthly-receipts/client/${client.id}`);
      const monthlyReceipts = receiptsResponse.ok ? await receiptsResponse.json() : [];

      // Calcular estatísticas de serviços
      const serviceMap = new Map<string, { count: number; total: number }>();
      quotes.forEach((quote: Quote) => {
        if (quote.status === 'approved' && Array.isArray(quote.items)) {
          quote.items.forEach((item: any) => {
            const existing = serviceMap.get(item.name) || { count: 0, total: 0 };
            serviceMap.set(item.name, {
              count: existing.count + 1,
              total: existing.total + (item.price || 0)
            });
          });
        }
      });

      const serviceStats = Array.from(serviceMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setClientHistory({ quotes, monthlyReceipts, serviceStats });
      setShowHistory(true);
    } catch (error) {
      // Error loading client history - silently fail
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (!client) return;
    const whatsapp = client.whatsapp || client.contact || '';
    const cleaned = whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleaned}`, '_blank');
  };

  const handleSelectClient = () => {
    if (client) {
      onSelectClient(client);
      onClose();
    }
  };

  const handleEditClient = () => {
    if (client) {
      onEditClient(client);
      onClose();
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    try {
      await onDeleteClient(client.id);
      onClose();
    } catch {
      // error handled by parent
    }
  };

  const handleToggleFavorite = async () => {
    if (!client) return;
    try {
      await onToggleFavorite(client);
    } catch {
      // error handled by parent
    }
  };

  const calculateClientStats = () => {
    if (!clientHistory) return null;

    const totalSpent = clientHistory.quotes
      .filter(q => q.status === 'approved')
      .reduce((sum, q) => sum + q.total, 0);
    
    const totalReceipts = clientHistory.monthlyReceipts
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalSpent: totalSpent + totalReceipts,
      quoteCount: clientHistory.quotes.length,
      receiptCount: clientHistory.monthlyReceipts.length
    };
  };

  if (!isOpen || !client) return null;

  const getClientColor = () => {
    return client.client_type === 'juridica' 
      ? 'border-green-500/30' 
      : 'border-blue-500/30';
  };

  const getClientBadgeColor = () => {
    return client.client_type === 'juridica' 
      ? 'bg-green-600' 
      : 'bg-blue-600';
  };

  const stats = calculateClientStats();

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && client && (
          <motion.div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55] flex items-center justify-center p-4 overflow-y-auto"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          >
            <motion.div 
              className={`bg-slate-800 rounded-lg shadow-2xl border ${getClientColor()} max-w-2xl w-full my-8 max-h-[90vh] flex flex-col`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
        {/* Fixed Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-6 flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {client.logo_url ? (
                <img 
                  src={client.logo_url} 
                  alt={client.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-600 flex-shrink-0"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full ${getClientBadgeColor()} flex items-center justify-center text-white font-bold text-2xl flex-shrink-0`}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {client.is_favorite ? (
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  ) : null}
                  <h3 className="text-2xl font-bold text-white truncate">{client.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${getClientBadgeColor()} text-white font-semibold flex-shrink-0`}>
                    {client.client_type === 'juridica' ? 'PJ' : 'PF'}
                  </span>
                </div>
                {client.tags && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {client.tags.split(',').map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-purple-600/50 text-purple-200 rounded">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Client Info */}
          <div className="space-y-1 text-sm">
            {client.cpf_cnpj && (
              <p className="text-slate-300 truncate">{client.cpf_cnpj}</p>
            )}
            {client.email && (
              <p className="text-slate-400 truncate">{client.email}</p>
            )}
            {(client.contact || client.whatsapp) && (
              <p className="text-slate-300 font-semibold">
                📱 {client.contact || client.whatsapp}
              </p>
            )}
            {client.address && (
              <p className="text-slate-400 break-words">📍 {client.address}</p>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={handleSelectClient}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Criar Orçamento
            </button>

            <button
              onClick={loadClientHistory}
              disabled={loadingHistory}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
            >
              <History className="w-5 h-5" />
              {loadingHistory ? 'Carregando...' : showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                client.is_favorite
                  ? 'bg-yellow-600 hover:bg-yellow-700 hover:shadow-yellow-500/50 text-white'
                  : 'bg-slate-600 hover:bg-slate-700 hover:shadow-slate-500/50 text-white'
              }`}
            >
              <Star className={`w-5 h-5 ${client.is_favorite ? 'fill-current' : ''}`} />
              {client.is_favorite ? 'Remover Favorito' : 'Adicionar Favorito'}
            </button>

            <button
              onClick={handleWhatsAppClick}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Abrir WhatsApp
            </button>

            <button
              onClick={handleEditClient}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Editar Cliente
            </button>

            <button
              onClick={handleDeleteClient}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Excluir Cliente
            </button>
          </div>

          {/* History Section */}
          {showHistory && clientHistory && (
            <div className="space-y-4 border-t border-slate-700 pt-4">
              {/* Stats Summary */}
              {stats && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-white mb-3">📊 Resumo</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-400">R$ {formatBRL(stats.totalSpent)}</p>
                      <p className="text-slate-400 text-xs">Total Gasto</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{stats.quoteCount}</p>
                      <p className="text-slate-400 text-xs">Orçamentos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-400">{stats.receiptCount}</p>
                      <p className="text-slate-400 text-xs">Recibos Mensais</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Stats */}
              {clientHistory.serviceStats && clientHistory.serviceStats.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">
                    🎯 Serviços Mais Contratados
                  </h4>
                  <div className="space-y-1.5">
                    {clientHistory.serviceStats.map((service, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-slate-700/50 rounded px-3 py-2">
                        <span className="text-white truncate">{service.name}</span>
                        <div className="flex gap-3 text-slate-300 flex-shrink-0 ml-2">
                          <span>{service.count}x</span>
                          <span className="text-green-400 font-semibold">R$ {formatBRL(service.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotes */}
              {clientHistory.quotes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Orçamentos ({clientHistory.quotes.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clientHistory.quotes.map((quote) => (
                      <div 
                        key={quote.id} 
                        onClick={() => {
                          setSelectedQuote(quote);
                          setShowQuoteDetails(true);
                        }}
                        className="bg-slate-700/50 rounded p-3 text-sm cursor-pointer hover:bg-slate-700 transition-all border border-transparent hover:border-blue-500/50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-white font-semibold">#{quote.quote_number}</span>
                            <span className="text-slate-400 ml-2">{new Date(quote.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 font-semibold">R$ {formatBRL(quote.total)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              quote.status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'
                            } text-white`}>
                              {quote.status === 'approved' ? 'Aprovado' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-400 text-xs mt-2">Clique para ver detalhes e opções</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Receipts */}
              {clientHistory.monthlyReceipts.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Recibos Mensais ({clientHistory.monthlyReceipts.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clientHistory.monthlyReceipts.map((receipt) => (
                      <div key={receipt.id} className="bg-slate-700/50 rounded p-3 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate">{receipt.description}</p>
                            <p className="text-slate-400 text-xs">{receipt.month_reference}</p>
                          </div>
                          <span className="text-green-400 font-semibold ml-2 flex-shrink-0">R$ {formatBRL(receipt.amount)}</span>
                        </div>
                        
                        {onMonthlyReceiptPDF && (
                          <button
                            onClick={() => onMonthlyReceiptPDF(receipt, client)}
                            className="w-full px-2 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            Gerar PDF
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Details Modal */}
      <QuoteDetailsModal
        isOpen={showQuoteDetails}
        onClose={() => {
          setShowQuoteDetails(false);
          setSelectedQuote(null);
        }}
        quote={selectedQuote}
        client={client}
        receiptsHistory={[]}
        onApprove={async () => {
          // Refresh history after approval
          setShowQuoteDetails(false);
          setSelectedQuote(null);
          await loadClientHistory();
        }}
        onDelete={async () => {
          // Refresh history after deletion
          setShowQuoteDetails(false);
          setSelectedQuote(null);
          await loadClientHistory();
        }}
        onWhatsApp={onQuoteWhatsApp}
        onPDF={onQuotePDF}
        onReceipt={onQuoteReceipt}
        onContract={onQuoteContract}
      />
    </>
  );
}
