import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, DollarSign, Calendar, 
  FileText, FolderKanban, Plus, Settings, RefreshCw
} from 'lucide-react';
import type { Client, Service } from '@/shared/types';
import { useToast } from '@/react-app/components/ToastContainer';
import { useConfirm } from '@/react-app/components/ConfirmDialog';
import { useIsMobile } from '@/react-app/hooks/useMediaQuery';
import { AnimatedPage } from '@/react-app/components/animated';
import { cardVariants, hoverLift, tapScale } from '@/react-app/utils/animations';

// Import existing modals
import NewClientModal from '@/react-app/components/NewClientModal';
import ClientListModal from '@/react-app/components/ClientListModal';
import PriceTableModal from '@/react-app/components/PriceTableModal';
import UniversalQuoteSearch from '@/react-app/components/UniversalQuoteSearch';
import AppointmentsCalendar from '@/react-app/components/AppointmentsCalendar';
import CashRegister from '@/react-app/components/CashRegister';
import FinancialReports from '@/react-app/components/FinancialReports';
import ProjectStatus from '@/react-app/components/ProjectStatus';
import MonthlyReceiptModal from '@/react-app/components/MonthlyReceiptModal';
import ServicesManagementModal from '@/react-app/components/ServicesManagementModal';
import { WithdrawalControl } from '@/react-app/components/WithdrawalControl';
import QuoteWizard from '@/react-app/components/QuoteWizard';
import QuoteHistoryModal from '@/react-app/components/QuoteHistoryModal';
import ContractsManagement from '@/react-app/components/ContractsManagement';
import ContractGenerator from '@/react-app/components/contracts/ContractGenerator';
import ContractViewer from '@/react-app/components/contracts/ContractViewer';
import ReceiptGeneratorModal from '@/react-app/components/ReceiptGeneratorModal';
import RecurringProjects from '@/react-app/components/RecurringProjects';
import Prospects from '@/react-app/components/Prospects';
import { generateQuotePDF } from '@/react-app/utils/pdfGenerator';

export default function HomeNew() {
  const toast = useToast();
  const confirm = useConfirm();
  const isMobile = useIsMobile();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [showServicesManagement, setShowServicesManagement] = useState(false);
  const [showUniversalSearch, setShowUniversalSearch] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [showFinancialReports, setShowFinancialReports] = useState(false);
  const [showProjectStatus, setShowProjectStatus] = useState(false);
  const [showRecurringProjects, setShowRecurringProjects] = useState(false);
  const [showProspects, setShowProspects] = useState(false);
  const [showMonthlyReceipt, setShowMonthlyReceipt] = useState(false);
  const [showWithdrawalControl, setShowWithdrawalControl] = useState(false);
  const [showQuoteWizard, setShowQuoteWizard] = useState(false);
  const [showQuoteHistory, setShowQuoteHistory] = useState(false);
  const [showContractsManagement, setShowContractsManagement] = useState(false);
  const [showContractGenerator, setShowContractGenerator] = useState(false);
  const [showContractViewer, setShowContractViewer] = useState(false);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [selectedQuoteForContract, setSelectedQuoteForContract] = useState<number | null>(null);
  const [selectedQuoteForReceipt, setSelectedQuoteForReceipt] = useState<any | null>(null);
  const [selectedClientForReceipt, setSelectedClientForReceipt] = useState<Client | null>(null);
  const [quoteHistoryClient, setQuoteHistoryClient] = useState<Client | null>(null);
  const [clientQuotes, setClientQuotes] = useState<any[]>([]);
  const [wizardPreSelectedClient, setWizardPreSelectedClient] = useState<Client | null>(null);
  
  // Universal search states
  const [universalSearchQuery, setUniversalSearchQuery] = useState('');
  const [universalSearchResults, setUniversalSearchResults] = useState<any[]>([]);

  // New Client Form States
  const [clientType, setClientType] = useState<'fisica' | 'juridica'>('fisica');
  const [clientName, setClientName] = useState('');
  const [clientCpfCnpj, setClientCpfCnpj] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientPhoneNotes, setClientPhoneNotes] = useState('');
  const [clientTags, setClientTags] = useState('');
  const [clientInstagram, setClientInstagram] = useState('');
  const [clientFacebook, setClientFacebook] = useState('');
  const [clientLogoUrl, setClientLogoUrl] = useState('');
  const [clientInternalNotes, setClientInternalNotes] = useState('');
  const [clientIsFavorite, setClientIsFavorite] = useState(false);
  const [clientErrorMessage, setClientErrorMessage] = useState('');

  

  useEffect(() => {
    Promise.all([loadClients(), loadServices()]);
  }, []);

  useEffect(() => {
    if (quoteHistoryClient) {
      loadClientQuotes(quoteHistoryClient.id);
    }
  }, [quoteHistoryClient]);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      // Error loading clients - silently fail
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      // Error loading services - silently fail
    }
  };

  const loadClientQuotes = async (clientId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quotes/client/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClientQuotes(data);
      }
    } catch (error) {
      // Error loading quotes - silently fail
    } finally {
      setLoading(false);
    }
  };

  const formatCpfCnpj = (value: string, type: 'fisica' | 'juridica'): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (type === 'fisica') {
      // CPF: 000.000.000-00
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    } else {
      // CNPJ: 00.000.000/0000-00
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }
  };

  const handleCNPJBlur = async () => {
    if (clientType !== 'juridica') return;
    
    const cnpj = clientCpfCnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return;

    setLoading(true);
    setClientErrorMessage('');

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      
      if (response.ok) {
        const data = await response.json();
        setClientName(data.razao_social || data.nome_fantasia || '');
        setClientEmail(data.email || '');
        
        const addressParts = [];
        if (data.logradouro) addressParts.push(data.logradouro);
        if (data.numero) addressParts.push(data.numero);
        if (data.bairro) addressParts.push(data.bairro);
        if (data.municipio) addressParts.push(data.municipio);
        if (data.uf) addressParts.push(data.uf);
        if (data.cep) addressParts.push(`CEP: ${data.cep}`);
        
        setClientAddress(addressParts.join(', '));
        
        if (data.ddd_telefone_1) {
          setClientContact(data.ddd_telefone_1.replace(/\D/g, ''));
        }
      }
    } catch (error) {
      // Error fetching CNPJ data - silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (client: Client) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });

      if (response.ok) {
        await loadClients();
        toast.success('Cliente atualizado com sucesso!');
      } else {
        toast.error('Erro ao atualizar cliente');
      }
    } catch (error) {
      toast.error('Erro ao atualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    const confirmed = await confirm.confirm({
      title: 'Excluir Cliente',
      message: 'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.',
      type: 'danger'
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadClients();
        toast.success('Cliente excluído com sucesso!');
      } else {
        toast.error('Erro ao excluir cliente');
      }
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleUniversalSearch = async (searchTerm?: string) => {
    const query = searchTerm !== undefined ? searchTerm : universalSearchQuery;
    
    setLoading(true);
    try {
      // Always make the request, even if search is empty (to show all quotes)
      const url = query.trim() 
        ? `/api/quotes?search=${encodeURIComponent(query.trim())}`
        : `/api/quotes`;
        
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUniversalSearchResults(data);
      } else {
        toast.error('Erro ao buscar orçamentos');
        setUniversalSearchResults([]);
      }
    } catch (error) {
      toast.error('Erro ao buscar orçamentos');
      setUniversalSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUniversalDeleteQuote = async (quoteId: number) => {
    const confirmed = await confirm.confirm({
      title: 'Excluir Orçamento',
      message: 'Tem certeza que deseja excluir este orçamento?',
      type: 'danger'
    });
    
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Orçamento excluído com sucesso!');
        // Refresh search results
        handleUniversalSearch();
      } else {
        toast.error('Erro ao excluir orçamento');
      }
    } catch (error) {
      toast.error('Erro ao excluir orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleUniversalApproveQuote = async (quoteId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        toast.success('Orçamento aprovado com sucesso!');
        // Refresh search results
        handleUniversalSearch();
      } else {
        toast.error('Erro ao aprovar orçamento');
      }
    } catch (error) {
      toast.error('Erro ao aprovar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const formatQuoteForWhatsApp = (quote: any, client: any): string => {
    let message = `*SG Multimídia*\n`;
    message += `Estúdio de produção audiovisual\n\n`;
    message += `*ORÇAMENTO #${quote.quote_number}*\n`;
    message += `Cliente: ${client.name}\n`;
    message += `Data: ${new Date(quote.created_at).toLocaleDateString('pt-BR')}\n\n`;
    
    message += `*SERVIÇOS/PACOTES:*\n`;
    quote.items.forEach((item: any, index: number) => {
      const itemType = item.type === 'combo' ? '📦' : '🎵';
      message += `${itemType} ${item.name}\n`;
      if (item.comboDetails && item.comboDetails.length > 0) {
        item.comboDetails.forEach((detail: string) => {
          message += `  • ${detail}\n`;
        });
      }
      message += `  R$ ${item.price.toFixed(2)}\n`;
      if (index < quote.items.length - 1) message += `\n`;
    });
    
    message += `\n*VALORES:*\n`;
    message += `Subtotal: R$ ${quote.subtotal.toFixed(2)}\n`;
    
    // Show discount if there is any
    if (quote.discount_percentage > 0) {
      const discountValue = (quote.subtotal * quote.discount_percentage / 100);
      message += `Desconto (${quote.discount_percentage}%): -R$ ${discountValue.toFixed(2)}\n`;
    } else if (quote.discount_value && quote.discount_value > 0) {
      message += `Desconto: -R$ ${quote.discount_value.toFixed(2)}\n`;
    }
    
    message += `\n*TOTAL: R$ ${quote.total.toFixed(2)}*\n\n`;
    
    message += `Para aprovação ou dúvidas, entre em contato!\n\n`;
    message += `São Pedro do Sul - RS\n`;
    message += `📞 (55) 9 9660-2449`;
    
    return message;
  };

  const sendQuoteWhatsApp = (quote: any, client: any) => {
    if (!client.whatsapp) {
      toast.error('Cliente não possui WhatsApp cadastrado');
      return;
    }

    const message = formatQuoteForWhatsApp(quote, client);
    const whatsappNumber = client.whatsapp.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Abrindo WhatsApp...');
  };

  const sendPriceTableWhatsApp = () => {
    if (!clients.length) {
      toast.error('Nenhum cliente cadastrado');
      return;
    }

    // For price table, we'll use a generic message
    let message = `*SG Multimídia*\n`;
    message += `Estúdio de produção audiovisual\n\n`;
    message += `*TABELA DE PREÇOS*\n\n`;
    
    const servicesList = services.filter(s => s.type === 'service' && s.is_active);
    const combosList = services.filter(s => s.type === 'combo' && s.is_active);
    
    if (servicesList.length > 0) {
      message += `*SERVIÇOS À LA CARTE:*\n`;
      servicesList.forEach((service) => {
        message += `🎵 ${service.name}\n`;
        message += `  R$ ${service.price.toFixed(2)}`;
        if (service.is_hourly) message += `/hora`;
        if (service.is_per_track) message += `/faixa`;
        if (service.is_per_video) message += `/vídeo`;
        if (service.is_per_image) message += `/imagem`;
        message += `\n\n`;
      });
    }
    
    if (combosList.length > 0) {
      message += `\n*PACOTES PROMOCIONAIS:*\n`;
      combosList.forEach((combo) => {
        message += `📦 ${combo.name}\n`;
        if (combo.combo_items) {
          message += `${combo.combo_items}\n`;
        }
        message += `  R$ ${combo.price.toFixed(2)}`;
        if (combo.is_per_track) message += `/faixa`;
        message += `\n\n`;
      });
    }
    
    message += `\n_Os preços podem variar conforme a complexidade do projeto._\n\n`;
    message += `Entre em contato para um orçamento personalizado!\n\n`;
    message += `São Pedro do Sul - RS\n`;
    message += `📞 (55) 9 9660-2449`;

    const encodedMessage = encodeURIComponent(message);
    // For price table, open WhatsApp without a specific number so user can choose
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Abrindo WhatsApp...');
  };

  const resetClientForm = () => {
    setClientType('fisica');
    setClientName('');
    setClientCpfCnpj('');
    setClientEmail('');
    setClientAddress('');
    setClientContact('');
    setClientPhoneNotes('');
    setClientTags('');
    setClientInstagram('');
    setClientFacebook('');
    setClientLogoUrl('');
    setClientInternalNotes('');
    setClientIsFavorite(false);
    setClientErrorMessage('');
  };

  const handleCreateClient = async () => {
    if (!clientName.trim()) {
      setClientErrorMessage('Nome é obrigatório');
      return;
    }

    setLoading(true);
    setClientErrorMessage('');

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName.trim(),
          whatsapp: clientContact,
          client_type: clientType,
          cpf_cnpj: clientCpfCnpj,
          email: clientEmail,
          address: clientAddress,
          contact: clientContact,
          phone_notes: clientPhoneNotes,
          tags: clientTags,
          instagram: clientInstagram,
          facebook: clientFacebook,
          logo_url: clientLogoUrl,
          internal_notes: clientInternalNotes,
          is_favorite: clientIsFavorite ? 1 : 0,
        }),
      });

      if (response.ok) {
        await loadClients();
        setShowNewClientModal(false);
        resetClientForm();
      } else {
        setClientErrorMessage('Erro ao cadastrar cliente');
      }
    } catch (error) {
      setClientErrorMessage('Erro ao cadastrar cliente');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      {/* Unified Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Módulo de Clientes */}
        <motion.div 
          className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          whileHover={hoverLift}
        >
          <div className="bg-gradient-to-r from-primary-900/50 to-primary-800/30 p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-600/20 rounded-lg">
                <Users className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Clientes</h3>
                <p className="text-sm text-slate-400">Gerenciar carteira de clientes</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <motion.button
              onClick={() => setShowNewClientModal(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-primary-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Cadastrar Novo Cliente</span>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-primary-400" />
            </motion.button>
            <motion.button
              onClick={() => setShowClientList(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-primary-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Lista de Clientes</span>
              <Users className="w-4 h-4 text-slate-400 group-hover:text-primary-400" />
            </motion.button>
          </div>
        </motion.div>

        {/* Módulo de Orçamentos */}
        <motion.div 
          className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          whileHover={hoverLift}
        >
          <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Orçamentos</h3>
                <p className="text-sm text-slate-400">Criar e gerenciar orçamentos</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <motion.button
              onClick={() => setShowQuoteWizard(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-blue-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Criar Novo Orçamento</span>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
            </motion.button>
            <motion.button
              onClick={() => {
                setShowUniversalSearch(true);
                // Load all quotes when opening the modal
                setTimeout(() => handleUniversalSearch(''), 100);
              }}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-blue-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Buscar Orçamentos</span>
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
            </motion.button>
          </div>
        </motion.div>

        {/* Módulo de Projetos */}
        <motion.div 
          className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          whileHover={hoverLift}
        >
          <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/30 p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <FolderKanban className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Projetos</h3>
                <p className="text-sm text-slate-400">Acompanhar projetos ativos e concluídos</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <motion.button
              onClick={() => setShowProjectStatus(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-purple-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Gerenciar Projetos</span>
              <FolderKanban className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
            </motion.button>
            <motion.button
              onClick={() => setShowRecurringProjects(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-purple-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Projetos Recorrentes</span>
              <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
            </motion.button>
          </div>
        </motion.div>

        {/* Módulo de Caixa (Gestão Financeira Unificada) */}
        <motion.div 
          className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          whileHover={hoverLift}
        >
          <div className="bg-gradient-to-r from-green-900/50 to-green-800/30 p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Gestão Financeira</h3>
                <p className="text-sm text-slate-400">Controle completo de caixa e finanças</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <motion.button
              onClick={() => setShowCashRegister(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-green-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Controle de Caixa</span>
              <DollarSign className="w-4 h-4 text-slate-400 group-hover:text-green-400" />
            </motion.button>
            <motion.button
              onClick={() => setShowWithdrawalControl(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-green-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Controle de Retiradas</span>
              <DollarSign className="w-4 h-4 text-slate-400 group-hover:text-green-400" />
            </motion.button>
            <motion.button
              onClick={() => setShowFinancialReports(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-green-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Relatórios Financeiros</span>
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-green-400" />
            </motion.button>
            <motion.button
              onClick={() => setShowMonthlyReceipt(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-green-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Recibos Mensais</span>
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-green-400" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Módulos Adicionais - Grid com 2 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agenda */}
        <motion.div 
          className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          whileHover={hoverLift}
        >
          <div className="bg-gradient-to-r from-orange-900/50 to-orange-800/30 p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600/20 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Agenda</h3>
                <p className="text-sm text-slate-400">Calendário de agendamentos</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <motion.button
              onClick={() => setShowAppointments(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-orange-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Ver Calendário</span>
              <Calendar className="w-4 h-4 text-slate-400 group-hover:text-orange-400" />
            </motion.button>
          </div>
        </motion.div>

        {/* Contratos */}
        <motion.div 
          className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          whileHover={hoverLift}
        >
          <div className="bg-gradient-to-r from-indigo-900/50 to-indigo-800/30 p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Contratos</h3>
                <p className="text-sm text-slate-400">Gerar e gerenciar contratos</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <motion.button
              onClick={() => setShowContractsManagement(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-indigo-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Gerenciar Contratos</span>
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Prospecção */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div
          className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.7 }}
          whileHover={hoverLift}
        >
          <div className="bg-gradient-to-r from-cyan-900/50 to-teal-800/30 p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-600/20 rounded-lg">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Prospecção</h3>
                <p className="text-sm text-slate-400">Gerencie sua campanha porta a porta</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <motion.button
              onClick={() => setShowProspects(true)}
              className="w-full px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left transition-all border border-slate-600/50 hover:border-cyan-500/50 flex items-center justify-between group"
              whileHover={{ scale: 1.01 }}
              whileTap={tapScale}
            >
              <span className="text-sm font-medium text-white">Gerenciar Prospects</span>
              <Users className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
            </motion.button>
          </div>
        </motion.div>
      </div>
      
    </div>
  );

  return (
    <AnimatedPage className="min-h-screen bg-slate-950">
      {/* Simple Header with Logo and Settings */}
      <motion.header 
        className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={`max-w-[1920px] mx-auto ${isMobile ? 'px-3 py-3' : 'px-4 sm:px-6 lg:px-8 py-4'} flex items-center justify-between`}>
          <img 
            src="https://019b3337-8e60-7d99-90b6-518278a74e7c.mochausercontent.com/Logo-Branco-PNG.png" 
            alt="SG Multimídia"
            className={`${isMobile ? 'h-7' : 'h-9'} w-auto object-contain`}
          />
          <motion.button
            onClick={() => setShowServicesManagement(true)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
            title="Gerenciar Serviços e Preços"
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={tapScale}
            transition={{ duration: 0.3 }}
          >
            <Settings className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main 
        className={`max-w-[1920px] mx-auto ${isMobile ? 'py-4 px-3' : 'py-8 px-4 sm:px-6 lg:px-8'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {renderDashboard()}
      </motion.main>

      {/* All Modals - keeping existing functionality */}
      {/* Note: Modals will use AnimatedModal component for consistent animations */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => {
          setShowNewClientModal(false);
          resetClientForm();
        }}
        clientType={clientType}
        onChangeClientType={setClientType}
        name={clientName}
        onChangeName={setClientName}
        cpfCnpj={clientCpfCnpj}
        onChangeCpfCnpj={setClientCpfCnpj}
        email={clientEmail}
        onChangeEmail={setClientEmail}
        address={clientAddress}
        onChangeAddress={setClientAddress}
        contact={clientContact}
        onChangeContact={setClientContact}
        phoneNotes={clientPhoneNotes}
        onChangePhoneNotes={setClientPhoneNotes}
        tags={clientTags}
        onChangeTags={setClientTags}
        instagram={clientInstagram}
        onChangeInstagram={setClientInstagram}
        facebook={clientFacebook}
        onChangeFacebook={setClientFacebook}
        logoUrl={clientLogoUrl}
        onChangeLogoUrl={setClientLogoUrl}
        internalNotes={clientInternalNotes}
        onChangeInternalNotes={setClientInternalNotes}
        isFavorite={clientIsFavorite}
        onChangeIsFavorite={setClientIsFavorite}
        onSubmit={handleCreateClient}
        onBlurCNPJ={handleCNPJBlur}
        loading={loading}
        errorMessage={clientErrorMessage}
        formatCpfCnpj={formatCpfCnpj}
      />

      <ClientListModal
        isOpen={showClientList}
        onClose={() => setShowClientList(false)}
        clients={clients}
        loading={loading}
        errorMessage=""
        onSelectClient={(client: Client) => {
          setWizardPreSelectedClient(client);
          setShowClientList(false);
          setShowQuoteWizard(true);
        }}
        onUpdateClient={handleUpdateClient}
        onDeleteClient={handleDeleteClient}
        formatCpfCnpj={formatCpfCnpj}
        onQuoteWhatsApp={(quote, client) => sendQuoteWhatsApp(quote, client)}
        onQuotePDF={(quote, client) => {
          try {
            generateQuotePDF({
              quote_number: quote.quote_number,
              client_name: client.name,
              client_whatsapp: client.whatsapp,
              client_email: client.email,
              created_at: quote.created_at,
              items: quote.items,
              subtotal: quote.subtotal,
              discount_percentage: quote.discount_percentage,
              discount_value: quote.discount_value,
              total: quote.total,
            });
            toast.success('PDF gerado com sucesso!');
          } catch (error) {
            toast.error('Erro ao gerar PDF');
          }
        }}
        onQuoteReceipt={(quote, client) => {
          setSelectedQuoteForReceipt(quote);
          setSelectedClientForReceipt(client);
          setShowReceiptGenerator(true);
        }}
        onQuoteContract={(_quote, _client) => toast.info('Funcionalidade de contrato será implementada em breve')}
        onMonthlyReceiptPDF={(_receipt, _client) => toast.info('Funcionalidade de PDF do recibo mensal será implementada em breve')}
      />

      <PriceTableModal
        isOpen={showPriceTable}
        onClose={() => setShowPriceTable(false)}
        services={services}
        selectedClient={null}
        onSendWhatsApp={sendPriceTableWhatsApp}
        onUpdatePrice={async (id: number, price: number) => {
          try {
            const response = await fetch(`/api/service-prices/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ price }),
            });
            if (response.ok) {
              await loadServices();
              toast.success('Preço atualizado com sucesso!');
            } else {
              toast.error('Erro ao atualizar preço');
            }
          } catch (error) {
            toast.error('Erro ao atualizar preço');
          }
        }}
      />

      <ServicesManagementModal
        isOpen={showServicesManagement}
        onClose={() => setShowServicesManagement(false)}
        onServicesUpdated={loadServices}
      />

      <UniversalQuoteSearch
        isOpen={showUniversalSearch}
        onClose={() => {
          setShowUniversalSearch(false);
          setUniversalSearchQuery('');
          setUniversalSearchResults([]);
        }}
        quotes={universalSearchResults}
        searchQuery={universalSearchQuery}
        onSearchChange={(query: string) => {
          setUniversalSearchQuery(query);
          // Trigger search automatically as user types
          handleUniversalSearch(query);
        }}
        onDelete={handleUniversalDeleteQuote}
        onApprove={handleUniversalApproveQuote}
        onWhatsApp={(quoteId: number) => {
          const quote = universalSearchResults.find(q => q.id === quoteId);
          if (quote) {
            const client = clients.find(c => c.id === quote.client_id);
            if (client) {
              sendQuoteWhatsApp(quote, client);
            } else {
              toast.error('Cliente não encontrado');
            }
          }
        }}
        onPDF={(quoteId: number) => {
          const quote = universalSearchResults.find(q => q.id === quoteId);
          if (quote) {
            const client = clients.find(c => c.id === quote.client_id);
            if (client) {
              try {
                generateQuotePDF({
                  quote_number: quote.quote_number,
                  client_name: client.name,
                  client_whatsapp: client.whatsapp,
                  client_email: client.email,
                  created_at: quote.created_at,
                  items: quote.items,
                  subtotal: quote.subtotal,
                  discount_percentage: quote.discount_percentage,
                  discount_value: quote.discount_value,
                  total: quote.total,
                });
                toast.success('PDF gerado com sucesso!');
              } catch (error) {
                toast.error('Erro ao gerar PDF');
              }
            } else {
              toast.error('Cliente não encontrado');
            }
          }
        }}
        onReceipt={(quoteId: number) => {
          const quote = universalSearchResults.find(q => q.id === quoteId);
          if (quote) {
            const client = clients.find(c => c.id === quote.client_id);
            if (client) {
              setSelectedQuoteForReceipt(quote);
              setSelectedClientForReceipt(client);
              setShowReceiptGenerator(true);
            } else {
              toast.error('Cliente não encontrado');
            }
          }
        }}
        onGenerateContract={async (quoteId: number) => {
          // Check if contract already exists for this quote
          try {
            const response = await fetch(`/api/contracts/quote/${quoteId}`);
            if (response.ok) {
              const existingContract = await response.json();
              if (existingContract) {
                // Fetch full contract details
                const contractResponse = await fetch(`/api/contracts/${existingContract.id}`);
                if (contractResponse.ok) {
                  const fullContract = await contractResponse.json();
                  setSelectedContract(fullContract);
                  setShowContractViewer(true);
                }
              } else {
                // Create new contract
                setSelectedQuoteForContract(quoteId);
                setShowContractGenerator(true);
              }
            }
          } catch (error) {
            toast.error('Erro ao verificar contrato existente');
          }
        }}
        loading={loading}
      />

      <AppointmentsCalendar
        isOpen={showAppointments}
        onClose={() => setShowAppointments(false)}
        clients={clients}
      />

      <CashRegister
        isOpen={showCashRegister}
        onClose={() => setShowCashRegister(false)}
        clients={clients}
      />

      <FinancialReports
        isOpen={showFinancialReports}
        onClose={() => setShowFinancialReports(false)}
      />

      <ProjectStatus
        isOpen={showProjectStatus}
        onClose={() => setShowProjectStatus(false)}
        clients={clients}
      />

      <MonthlyReceiptModal
        isOpen={showMonthlyReceipt}
        onClose={() => setShowMonthlyReceipt(false)}
        clients={clients}
      />

      {showWithdrawalControl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl max-w-6xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Controle de Retiradas</h2>
              <button
                onClick={() => setShowWithdrawalControl(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <WithdrawalControl />
          </div>
        </div>
      )}

      <QuoteWizard
        isOpen={showQuoteWizard}
        onClose={() => {
          setShowQuoteWizard(false);
          setWizardPreSelectedClient(null);
        }}
        clients={clients}
        services={services}
        onCreateClient={() => {
          setShowQuoteWizard(false);
          setShowNewClientModal(true);
        }}
        onQuoteCreated={async (client: Client) => {
          await loadClients();
          await loadServices();
          setShowQuoteWizard(false);
          setWizardPreSelectedClient(null);
          setQuoteHistoryClient(client);
          setShowQuoteHistory(true);
        }}
        preSelectedClient={wizardPreSelectedClient}
      />

      <QuoteHistoryModal
        isOpen={showQuoteHistory}
        onClose={() => {
          setShowQuoteHistory(false);
          setQuoteHistoryClient(null);
          setClientQuotes([]);
        }}
        client={quoteHistoryClient}
        quotes={clientQuotes}
        receiptsHistory={{}}
        loading={loading}
        onApprove={async (quoteId: number) => {
          try {
            const response = await fetch(`/api/quotes/${quoteId}/approve`, {
              method: 'POST',
            });
            if (response.ok) {
              toast.success('Orçamento aprovado com sucesso!');
              if (quoteHistoryClient) {
                loadClientQuotes(quoteHistoryClient.id);
              }
            } else {
              toast.error('Erro ao aprovar orçamento');
            }
          } catch (error) {
            toast.error('Erro ao aprovar orçamento');
          }
        }}
        onDelete={async (quoteId: number) => {
          const confirmed = await confirm.confirm({
            title: 'Excluir Orçamento',
            message: 'Tem certeza que deseja excluir este orçamento?',
            type: 'danger'
          });
          if (!confirmed) return;
          
          try {
            const response = await fetch(`/api/quotes/${quoteId}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              toast.success('Orçamento excluído com sucesso!');
              if (quoteHistoryClient) {
                loadClientQuotes(quoteHistoryClient.id);
              }
            } else {
              toast.error('Erro ao excluir orçamento');
            }
          } catch (error) {
            toast.error('Erro ao excluir orçamento');
          }
        }}
        onWhatsApp={(quote: any, client: Client) => {
          sendQuoteWhatsApp(quote, client);
        }}
        onPDF={(quote: any, client: Client) => {
          try {
            generateQuotePDF({
              quote_number: quote.quote_number,
              client_name: client.name,
              client_whatsapp: client.whatsapp,
              client_email: client.email,
              created_at: quote.created_at,
              items: quote.items,
              subtotal: quote.subtotal,
              discount_percentage: quote.discount_percentage,
              discount_value: quote.discount_value,
              total: quote.total,
            });
            toast.success('PDF gerado com sucesso!');
          } catch (error) {
            toast.error('Erro ao gerar PDF');
          }
        }}
        onReceipt={(quote: any, client: Client) => {
          setSelectedQuoteForReceipt(quote);
          setSelectedClientForReceipt(client);
          setShowReceiptGenerator(true);
        }}
        onContract={() => {
          toast.info('Funcionalidade de contrato será implementada em breve');
        }}
        onShowReceipts={() => {
          toast.info('Histórico de recibos será implementado em breve');
        }}
      />

      <ContractsManagement
        isOpen={showContractsManagement}
        onClose={() => setShowContractsManagement(false)}
      />

      <ContractGenerator
        isOpen={showContractGenerator}
        onClose={() => {
          setShowContractGenerator(false);
          setSelectedQuoteForContract(null);
        }}
        preSelectedQuoteId={selectedQuoteForContract || undefined}
      />

      {selectedContract && (
        <ContractViewer
          isOpen={showContractViewer}
          onClose={() => {
            setShowContractViewer(false);
            setSelectedContract(null);
          }}
          contract={selectedContract}
        />
      )}

      <ReceiptGeneratorModal
        isOpen={showReceiptGenerator}
        onClose={() => {
          setShowReceiptGenerator(false);
          setSelectedQuoteForReceipt(null);
          setSelectedClientForReceipt(null);
        }}
        quote={selectedQuoteForReceipt}
        client={selectedClientForReceipt}
      />
      <Prospects
        isOpen={showProspects}
        onClose={() => setShowProspects(false)}
        onClientConverted={loadClients}
      />
      <RecurringProjects
        isOpen={showRecurringProjects}
        onClose={() => setShowRecurringProjects(false)}
        clients={clients}
      />
    </AnimatedPage>
  );
}
