import { X, Users, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Client, MonthlyReceipt } from '@/shared/types';
import EditClientModal from '@/react-app/components/EditClientModal';
import ClientActionsModal from '@/react-app/components/ClientActionsModal';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { backdropVariants, modalVariants, listContainerVariants, listItemVariants } from '@/react-app/utils/animations';

interface ClientListModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  loading: boolean;
  errorMessage: string;
  onSelectClient: (client: Client) => void;
  onUpdateClient: (client: Client) => Promise<void>;
  onDeleteClient: (id: number) => Promise<void>;
  formatCpfCnpj: (value: string, type: 'fisica' | 'juridica') => string;
  onQuoteWhatsApp?: (quote: any, client: Client) => void;
  onQuotePDF?: (quote: any, client: Client) => void;
  onQuoteReceipt?: (quote: any, client: Client) => void;
  onQuoteContract?: (quote: any, client: Client) => void;
  onMonthlyReceiptPDF?: (receipt: MonthlyReceipt, client: Client) => void;
}

export default function ClientListModal({
  isOpen,
  onClose,
  clients: initialClients,
  loading: externalLoading,
  errorMessage,
  onSelectClient,
  onUpdateClient,
  onDeleteClient,
  formatCpfCnpj,
  onQuoteWhatsApp,
  onQuotePDF,
  onQuoteReceipt,
  onQuoteContract,
  onMonthlyReceiptPDF
}: ClientListModalProps) {
  useLockBodyScroll(isOpen);
  
  // Estados de controle
  const [localClients, setLocalClients] = useState<Client[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sincroniza a lista local quando a prop original mudar ou o modal abrir
  useEffect(() => {
    if (isOpen) {
      setLocalClients([...initialClients]);
    }
  }, [initialClients, isOpen]);

  // Filtro de busca utilizando a lista local
  const filteredClients = localClients.filter(client => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      client.whatsapp?.includes(search) ||
      client.contact?.includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.cpf_cnpj?.includes(search) ||
      client.tags?.toLowerCase().includes(search)
    );
  });

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowActionsModal(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowEditModal(true);
    setShowActionsModal(false);
  };

  // FUNÇÃO CORRIGIDA: Atualiza o banco E a interface
  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      setIsUpdating(true);
      
      // 1. Atualiza no Banco de Dados
      await onUpdateClient(updatedClient);

      // 2. Atualiza a lista local IMEDIATAMENTE (Reflete nos cards)
      setLocalClients(prev => prev.map(c => 
        c.id === updatedClient.id ? { ...updatedClient } : c
      ));

      // 3. Fecha os modais e limpa estados
      setShowEditModal(false);
      setEditingClient(null);
      
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFavorite = async (client: Client) => {
    const updated = { ...client, is_favorite: client.is_favorite ? 0 : 1 };
    await handleUpdateClient(updated);
    setSelectedClient(updated);
  };

  useEffect(() => {
    if (!isOpen) {
      setEditingClient(null);
      setShowEditModal(false);
      setSelectedClient(null);
      setShowActionsModal(false);
      setSearchTerm('');
    }
  }, [isOpen]);

  const getClientColor = (clientType?: string) => {
    return clientType === 'juridica' 
      ? 'border-green-500/30 hover:border-green-500' 
      : 'border-blue-500/30 hover:border-blue-500';
  };

  const getClientBadgeColor = (clientType?: string) => {
    return clientType === 'juridica' 
      ? 'bg-green-600' 
      : 'bg-blue-600';
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          >
            <motion.div 
              className="bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30 max-w-6xl w-full max-h-[90vh] my-8 flex flex-col"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-primary-900 to-blue-900 border-b border-blue-500/30 p-6 flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Gerenciar Clientes</h3>
                    <p className="text-blue-200 text-sm mt-1">Clique em um cliente para ver as opções disponíveis</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, telefone, e-mail, CPF/CNPJ ou tags..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md">
                    <p className="text-red-300 text-sm font-semibold">{errorMessage}</p>
                  </div>
                )}

                {filteredClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="w-16 h-16 text-slate-600 mb-4" />
                    <p className="text-slate-400 text-center text-lg">
                      {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    </p>
                    <p className="text-slate-500 text-center text-sm mt-2">
                      {searchTerm ? 'Tente outro termo de busca' : 'Clique em "Novo Cliente" para adicionar'}
                    </p>
                  </div>
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={listContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredClients.map((client) => (
                      <motion.div 
                        key={client.id} 
                        className={`bg-slate-700/50 rounded-lg p-4 border ${getClientColor(client.client_type)} transition-all hover:bg-slate-700/70 cursor-pointer hover:shadow-lg hover:shadow-blue-500/20`}
                        variants={listItemVariants}
                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleClientClick(client)}
                      >
                        <div className="flex items-start gap-3">
                          {client.logo_url ? (
                            <img 
                              src={client.logo_url} 
                              alt={client.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-slate-600 flex-shrink-0"
                            />
                          ) : (
                            <div className={`w-14 h-14 rounded-full ${getClientBadgeColor(client.client_type)} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {client.is_favorite ? (
                                <span className="text-yellow-400 flex-shrink-0">⭐</span>
                              ) : null}
                              <p className="text-white font-bold text-base truncate">{client.name}</p>
                            </div>

                            <span className={`inline-block text-xs px-2 py-0.5 rounded ${getClientBadgeColor(client.client_type)} text-white font-semibold mb-2`}>
                              {client.client_type === 'juridica' ? 'PJ' : 'PF'}
                            </span>

                            {client.tags && (
                              <div className="flex gap-1 mb-2 flex-wrap">
                                {client.tags.split(',').slice(0, 2).map((tag, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 bg-purple-600/50 text-purple-200 rounded">
                                    {tag.trim()}
                                  </span>
                                ))}
                                {client.tags.split(',').length > 2 && (
                                  <span className="text-xs px-2 py-0.5 bg-slate-600/50 text-slate-300 rounded">
                                    +{client.tags.split(',').length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="space-y-0.5 text-sm min-w-0">
                              {client.cpf_cnpj && (
                                <p className="text-slate-300 truncate text-xs">{client.cpf_cnpj}</p>
                              )}
                              {client.email && (
                                <p className="text-slate-400 truncate text-xs">{client.email}</p>
                              )}
                              {(client.whatsapp || client.contact) && (
                                <p className="text-slate-300 font-semibold text-xs truncate">
                                  📱 {client.whatsapp || client.contact}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ClientActionsModal
        isOpen={showActionsModal}
        onClose={() => {
          setShowActionsModal(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onSelectClient={(client) => {
          onSelectClient(client);
          onClose();
        }}
        onEditClient={handleEditClient}
        onDeleteClient={onDeleteClient}
        onToggleFavorite={handleToggleFavorite}
        onQuoteWhatsApp={onQuoteWhatsApp}
        onQuotePDF={onQuotePDF}
        onQuoteReceipt={onQuoteReceipt}
        onQuoteContract={onQuoteContract}
        onMonthlyReceiptPDF={onMonthlyReceiptPDF}
      />

      <EditClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingClient(null);
        }}
        client={editingClient}
        onUpdate={handleUpdateClient}
        loading={isUpdating || externalLoading}
        formatCpfCnpj={formatCpfCnpj}
      />
    </>
  );
}