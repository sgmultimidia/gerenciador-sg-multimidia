import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Search, Plus, Trash2, ShoppingCart, User, Package, FileText, Percent, DollarSign } from 'lucide-react';
import type { Client, Service, QuoteItem } from '@/shared/types';
import { useToast } from '@/react-app/components/ToastContainer';
import { Input, Textarea, NumberInput } from '@/react-app/components/ui';
import { useIsMobile } from '@/react-app/hooks/useMediaQuery';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { formatBRL } from '@/react-app/utils/formatBRL'; // v2

interface QuoteWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  services: Service[];
  onCreateClient: () => void;
  onQuoteCreated: (client: Client) => void;
  preSelectedClient?: Client | null;
}

const STEPS = [
  { id: 1, name: 'Cliente', icon: User },
  { id: 2, name: 'Serviços', icon: Package },
  { id: 3, name: 'Ajustes', icon: FileText },
  { id: 4, name: 'Revisão', icon: Check },
];

export default function QuoteWizard({
  isOpen,
  onClose,
  clients,
  services,
  onCreateClient,
  onQuoteCreated,
  preSelectedClient,
}: QuoteWizardProps) {
  const toast = useToast();
  const isMobile = useIsMobile();
  useLockBodyScroll(isOpen);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<QuoteItem[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountFixed, setDiscountFixed] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Service quantity states
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});
  const [serviceDisplacements, setServiceDisplacements] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      resetWizard();
      // If preSelectedClient is provided, set it and skip to step 2
      if (preSelectedClient) {
        setSelectedClient(preSelectedClient);
        setCurrentStep(2);
      }
    }
  }, [isOpen, preSelectedClient]);

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedClient(null);
    setSearchTerm('');
    setCartItems([]);
    setDiscountType('percentage');
    setDiscountPercentage('');
    setDiscountFixed('');
    setNotes('');
    setServiceQuantities({});
    setServiceDisplacements({});
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.whatsapp?.includes(searchTerm) ||
    client.cpf_cnpj?.includes(searchTerm)
  );

  const addServiceToCart = (service: Service, displacement?: number) => {
    const quantity = serviceQuantities[service.service_id];
    if (!quantity || quantity < 1) {
      toast.warning('Informe a quantidade antes de adicionar');
      return;
    }
    
    const price = service.price * quantity;
    
    // Normalize service name - replace "Captação de vídeo" with "Gravação de vídeos"
    let serviceName = service.name;
    if (serviceName.toLowerCase().includes('captação de vídeo')) {
      serviceName = serviceName.replace(/captação de vídeo/i, 'Gravação de vídeos');
    }
    
    const newItem: QuoteItem = {
      id: `${service.service_id}-${Date.now()}`,
      name: serviceName,
      price: price,
      type: 'service',
    };

    // Add quantity info to name if applicable
    if (service.is_per_track) {
      newItem.name = `${serviceName} (${quantity} faixa${quantity > 1 ? 's' : ''})`;
    } else if (service.is_per_video) {
      newItem.name = `${serviceName} (${quantity} vídeo${quantity > 1 ? 's' : ''})`;
    } else if (service.is_per_image) {
      newItem.name = `${serviceName} (${quantity} ${quantity > 1 ? 'imagens' : 'imagem'})`;
    } else if (service.is_hourly) {
      newItem.name = `${serviceName} (${quantity} hora${quantity > 1 ? 's' : ''})`;
    }

    // Add displacement and change to "externo" if applicable
    if (displacement && displacement > 0) {
      newItem.name = `${newItem.name} - Externo`;
      newItem.price = price + displacement;
    } else if (requiresDisplacement(service.name)) {
      newItem.name = `${newItem.name} - Interno`;
    }

    setCartItems([...cartItems, newItem]);
    // Clear quantity after adding
    const newQuantities = { ...serviceQuantities };
    delete newQuantities[service.service_id];
    setServiceQuantities(newQuantities);
    toast.success('Adicionado ao orçamento!');
  };

  const requiresDisplacement = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    return name.includes('transmissão ao vivo') || 
           name.includes('gravação de vídeo') || 
           name.includes('captação de vídeo');
  };

  const addComboToCart = (combo: Service) => {
    const quantity = serviceQuantities[combo.service_id];
    if (!quantity || quantity < 1) {
      toast.warning('Informe a quantidade antes de adicionar');
      return;
    }
    
    const price = combo.price * quantity;
    
    const newItem: QuoteItem = {
      id: `${combo.service_id}-${Date.now()}`,
      name: combo.name,
      price: price,
      type: 'combo',
      comboDetails: combo.combo_items ? combo.combo_items.split(',').map(i => i.trim()) : undefined,
    };

    if (combo.is_per_track) {
      newItem.name = `${combo.name} (${quantity} faixa${quantity > 1 ? 's' : ''})`;
    }

    setCartItems([...cartItems, newItem]);
    // Clear quantity after adding
    const newQuantities = { ...serviceQuantities };
    delete newQuantities[combo.service_id];
    setServiceQuantities(newQuantities);
    toast.success('Pacote adicionado ao orçamento!');
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    
    let discountValue = 0;
    if (discountType === 'percentage' && discountPercentage) {
      discountValue = (subtotal * parseFloat(discountPercentage)) / 100;
    } else if (discountType === 'fixed' && discountFixed) {
      discountValue = parseFloat(discountFixed);
    }
    
    const total = subtotal - discountValue;

    return { subtotal, discountValue, total };
  };

  const canGoNext = () => {
    if (currentStep === 1) return selectedClient !== null;
    if (currentStep === 2) return cartItems.length > 0;
    if (currentStep === 3) return true;
    return false;
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!selectedClient) return;

    const { total } = calculateTotals();
    
    setSaving(true);
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          items: cartItems,
          subtotal: calculateTotals().subtotal,
          discount_percentage: discountType === 'percentage' && discountPercentage ? parseFloat(discountPercentage) : 0,
          discount_value: discountType === 'fixed' && discountFixed ? parseFloat(discountFixed) : 0,
          total: total,
        }),
      });

      if (response.ok) {
        toast.success('Orçamento criado com sucesso!');
        onQuoteCreated(selectedClient);
        resetWizard();
      } else {
        toast.error('Erro ao criar orçamento');
      }
    } catch (error) {
      toast.error('Erro ao criar orçamento');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const servicesList = services.filter(s => s.type === 'service' && s.is_active);
  const combosList = services.filter(s => s.type === 'combo' && s.is_active);
  const { subtotal, discountValue, total } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] my-8 shadow-2xl border border-blue-500/30 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-3 border-b border-blue-500/30 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-xl font-bold text-white">Novo Orçamento</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                        isCompleted
                          ? 'bg-green-600 border-green-400'
                          : isActive
                          ? 'bg-blue-600 border-blue-400'
                          : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-1 font-medium ${
                        isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-slate-400'
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        currentStep > step.id ? 'bg-green-600' : 'bg-slate-600'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Client */}
          {currentStep === 1 && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Selecione o Cliente</h3>
                <p className="text-slate-400">Busque por nome, WhatsApp ou CPF/CNPJ</p>
              </div>

              <div className="mb-6">
                <Input
                  type="text"
                  placeholder={isMobile ? "Buscar..." : "Buscar cliente..."}
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                />
              </div>

              <div className="mb-4 flex justify-end">
                <button
                  onClick={onCreateClient}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Novo Cliente
                </button>
              </div>

              <div className="grid gap-3">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p>Nenhum cliente encontrado</p>
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedClient?.id === client.id
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'bg-slate-700/50 border-slate-600 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold text-lg">{client.name}</h4>
                          <div className="flex gap-3 mt-1">
                            {client.whatsapp && (
                              <p className="text-slate-400 text-sm">{client.whatsapp}</p>
                            )}
                            {client.cpf_cnpj && (
                              <p className="text-slate-400 text-sm">{client.cpf_cnpj}</p>
                            )}
                          </div>
                        </div>
                        {selectedClient?.id === client.id && (
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Add Services */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Services Catalog */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-white mb-4">Catálogo de Serviços</h3>
                
                {/* Services */}
                {servicesList.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-base font-semibold text-blue-300 mb-3">Serviços</h4>
                    <div className="grid gap-3">
                      {servicesList.map((service) => {
                        const needsDisplacement = requiresDisplacement(service.name);
                        const displayName = service.name.toLowerCase().includes('captação de vídeo') 
                          ? service.name.replace(/captação de vídeo/i, 'Gravação de vídeos')
                          : service.name;
                        
                        return (
                        <div
                          key={service.id}
                          className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-blue-500/50 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <h5 className="text-white font-semibold text-sm truncate">{displayName}</h5>
                              {service.description && (
                                <p className="text-slate-400 text-xs mt-0.5 truncate">{service.description}</p>
                              )}
                              <p className="text-blue-400 font-bold text-base mt-1">
                                R$ {formatBRL(service.price)}
                                <span className="text-xs text-slate-400 ml-1">
                                  {service.is_hourly ? '/hora' : ''}
                                  {service.is_per_track ? '/faixa' : ''}
                                  {service.is_per_video ? '/vídeo' : ''}
                                  {service.is_per_image ? '/imagem' : ''}
                                </span>
                              </p>
                            </div>
                            <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  value={serviceQuantities[service.service_id] !== undefined ? serviceQuantities[service.service_id] : ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                      const newQuantities = { ...serviceQuantities };
                                      delete newQuantities[service.service_id];
                                      setServiceQuantities(newQuantities);
                                    } else {
                                      const parsed = parseInt(val);
                                      setServiceQuantities({
                                        ...serviceQuantities,
                                        [service.service_id]: isNaN(parsed) ? 0 : parsed,
                                      });
                                    }
                                  }}
                                  placeholder="Qtd"
                                  className="w-16 px-2 py-1.5 text-sm text-center rounded bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => addServiceToCart(service, needsDisplacement ? parseFloat(serviceDisplacements[service.service_id] || '0') : undefined)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-all flex items-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add
                                </button>
                              </div>
                              {needsDisplacement && (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={serviceDisplacements[service.service_id] || ''}
                                  onChange={(e) =>
                                    setServiceDisplacements({
                                      ...serviceDisplacements,
                                      [service.service_id]: e.target.value,
                                    })
                                  }
                                  placeholder="Deslocamento"
                                  className="w-full px-2 py-1.5 text-xs rounded bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-400"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )}

                {/* Combos */}
                {combosList.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold text-purple-300 mb-3">Pacotes</h4>
                    <div className="grid gap-3">
                      {combosList.map((combo) => (
                        <div
                          key={combo.id}
                          className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/30 hover:border-purple-400/50 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h5 className="text-white font-semibold text-sm break-words">{combo.name}</h5>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-600 text-white font-semibold flex-shrink-0">
                                  PACOTE
                                </span>
                              </div>
                              {combo.combo_items && (
                                <p className="text-slate-300 text-xs truncate">{combo.combo_items}</p>
                              )}
                              {combo.description && (
                                <p className="text-slate-400 text-xs mt-0.5 truncate">{combo.description}</p>
                              )}
                              <p className="text-purple-400 font-bold text-base mt-1">
                                R$ {formatBRL(combo.price)}
                                <span className="text-xs text-slate-400 ml-1">
                                  {combo.is_per_track ? '/faixa' : ''}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <input
                                type="number"
                                min="1"
                                value={serviceQuantities[combo.service_id] !== undefined ? serviceQuantities[combo.service_id] : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    const newQuantities = { ...serviceQuantities };
                                    delete newQuantities[combo.service_id];
                                    setServiceQuantities(newQuantities);
                                  } else {
                                    const parsed = parseInt(val);
                                    setServiceQuantities({
                                      ...serviceQuantities,
                                      [combo.service_id]: isNaN(parsed) ? 0 : parsed,
                                    });
                                  }
                                }}
                                placeholder="Qtd"
                                className="w-16 px-2 py-1.5 text-sm text-center rounded bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                              <button
                                onClick={() => addComboToCart(combo)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition-all flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <div className="lg:col-span-1">
                <div className="sticky top-0">
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingCart className="w-5 h-5 text-blue-400" />
                      <h4 className="text-lg font-semibold text-white">Orçamento</h4>
                      <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        {cartItems.length}
                      </span>
                    </div>

                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">Nenhum item adicionado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-slate-800 rounded p-3 border border-slate-600"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium break-words">{item.name}</p>
                                {item.comboDetails && (
                                  <p className="text-slate-400 text-xs mt-1 break-words">
                                    {item.comboDetails.join(' • ')}
                                  </p>
                                )}
                                <p className="text-blue-400 font-semibold mt-1 whitespace-nowrap">
                                  R$ {formatBRL(item.price)}
                                </p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <div className="flex justify-between text-white font-bold text-lg">
                        <span>Subtotal:</span>
                        <span>R$ {formatBRL(subtotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Adjustments */}
          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Ajustes Finais</h3>
                <p className="text-slate-400">Configure desconto e observações</p>
              </div>

              <div className="space-y-6">
                {/* Discount Section */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-5 border border-green-500/30">
                  <label className="block text-white font-bold mb-3">Desconto</label>
                  
                  {/* Discount Type Toggle */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        setDiscountType('percentage');
                        setDiscountFixed('');
                      }}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        discountType === 'percentage'
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <Percent className="w-5 h-5" />
                      Porcentagem
                    </button>
                    <button
                      onClick={() => {
                        setDiscountType('fixed');
                        setDiscountPercentage('');
                      }}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        discountType === 'fixed'
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                      Valor Fixo
                    </button>
                  </div>

                  {/* Discount Input */}
                  {discountType === 'percentage' ? (
                    <NumberInput
                      min="0"
                      max="100"
                      step="0.01"
                      value={discountPercentage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscountPercentage(e.target.value)}
                      placeholder="0"
                      suffix="%"
                    />
                  ) : (
                    <NumberInput
                      min="0"
                      step="0.01"
                      value={discountFixed}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscountFixed(e.target.value)}
                      placeholder="0.00"
                      prefix="R$"
                    />
                  )}

                  {/* Discount Preview */}
                  {discountValue > 0 && (
                    <div className="mt-3 p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
                      <p className="text-green-300 text-sm font-semibold">
                        Desconto aplicado: R$ {formatBRL(discountValue)}
                        {discountType === 'percentage' && ` (${discountPercentage}%)`}
                      </p>
                    </div>
                  )}
                </div>

                <Textarea
                  label="Observações"
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  rows={4}
                  placeholder={isMobile ? "Observações..." : "Informações adicionais sobre o orçamento..."}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && selectedClient && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Revisão Final</h3>
                <p className="text-slate-400">Confira todos os detalhes antes de finalizar</p>
              </div>

              <div className="space-y-6">
                {/* Client Info */}
                <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <h4 className="text-lg font-semibold text-white mb-3">Cliente</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Nome</p>
                      <p className="text-white font-medium">{selectedClient.name}</p>
                    </div>
                    {selectedClient.whatsapp && (
                      <div>
                        <p className="text-slate-400 text-sm">WhatsApp</p>
                        <p className="text-white font-medium">{selectedClient.whatsapp}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <h4 className="text-lg font-semibold text-white mb-3">Itens</h4>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-start p-3 bg-slate-800 rounded gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium break-words">{item.name}</p>
                          {item.comboDetails && (
                            <p className="text-slate-400 text-sm mt-1 break-words">
                              {item.comboDetails.join(' • ')}
                            </p>
                          )}
                        </div>
                        <p className="text-blue-400 font-semibold whitespace-nowrap flex-shrink-0">R$ {formatBRL(item.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <h4 className="text-lg font-semibold text-white mb-3">Resumo Financeiro</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal</span>
                      <span>R$ {formatBRL(subtotal)}</span>
                    </div>
                    {discountValue > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>
                          Desconto 
                          {discountType === 'percentage' && ` (${discountPercentage}%)`}
                          {discountType === 'fixed' && ' (Valor Fixo)'}
                        </span>
                        <span>- R$ {formatBRL(discountValue)}</span>
                      </div>
                    )}
                    <div className="h-px bg-slate-600 my-2"></div>
                    <div className="flex justify-between text-white font-bold text-xl">
                      <span>Total</span>
                      <span>R$ {formatBRL(total)}</span>
                    </div>
                  </div>
                </div>

                {notes && (
                  <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                    <h4 className="text-lg font-semibold text-white mb-3">Observações</h4>
                    <p className="text-slate-300">{notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 p-6 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <button
              onClick={currentStep === 1 ? onClose : handleBack}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              {currentStep === 1 ? (
                <X className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
              {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                Próximo
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2 text-lg"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Finalizar Orçamento
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
