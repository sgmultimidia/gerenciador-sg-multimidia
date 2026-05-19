import { X, Plus, Edit2, Trash2, Save, Power, Package, Wrench } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Service } from '@/shared/types';
import { useToast } from '@/react-app/components/ToastContainer';
import { useConfirm } from '@/react-app/components/ConfirmDialog';
import { useIsMobile } from '@/react-app/hooks/useMediaQuery';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface ServicesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServicesUpdated?: () => void;
}

export default function ServicesManagementModal({
  isOpen,
  onClose,
  onServicesUpdated
}: ServicesManagementModalProps) {
  const toast = useToast();
  const { confirm } = useConfirm();
  const isMobile = useIsMobile();
  useLockBodyScroll(isOpen);
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'service' | 'combo'>('service');
  
  // Form state
  const [formServiceId, setFormServiceId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsHourly, setFormIsHourly] = useState(false);
  const [formIsPerTrack, setFormIsPerTrack] = useState(false);
  const [formIsPerImage, setFormIsPerImage] = useState(false);
  const [formIsPerVideo, setFormIsPerVideo] = useState(false);
  const [formComboItems, setFormComboItems] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadServices();
    }
  }, [isOpen]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormServiceId('');
    setFormName('');
    setFormPrice('');
    setFormDescription('');
    setFormIsHourly(false);
    setFormIsPerTrack(false);
    setFormIsPerImage(false);
    setFormIsPerVideo(false);
    setFormComboItems('');
    setEditingService(null);
    setShowNewServiceForm(false);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormServiceId(service.service_id);
    setFormName(service.name);
    setFormPrice(service.price.toString());
    setFormDescription(service.description || '');
    setFormIsHourly(service.is_hourly === 1);
    setFormIsPerTrack(service.is_per_track === 1);
    setFormIsPerImage(service.is_per_image === 1);
    setFormIsPerVideo(service.is_per_video === 1);
    setFormComboItems(service.combo_items || '');
    setShowNewServiceForm(true);
    setActiveTab(service.type);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice) {
      toast.error('Nome e preço são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      if (editingService) {
        // Update existing service
        const response = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            price: parseFloat(formPrice),
            description: formDescription || null,
            is_hourly: formIsHourly ? 1 : 0,
            is_per_track: formIsPerTrack ? 1 : 0,
            is_per_image: formIsPerImage ? 1 : 0,
            is_per_video: formIsPerVideo ? 1 : 0,
            combo_items: activeTab === 'combo' ? formComboItems : null,
          }),
        });

        if (response.ok) {
          toast.success('Serviço atualizado com sucesso');
          await loadServices();
          resetForm();
          onServicesUpdated?.();
        } else {
          toast.error('Erro ao atualizar serviço');
        }
      } else {
        // Create new service
        const serviceId = formServiceId || formName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: serviceId,
            name: formName,
            type: activeTab,
            price: parseFloat(formPrice),
            description: formDescription || null,
            is_hourly: formIsHourly ? 1 : 0,
            is_per_track: formIsPerTrack ? 1 : 0,
            is_per_image: formIsPerImage ? 1 : 0,
            is_per_video: formIsPerVideo ? 1 : 0,
            combo_items: activeTab === 'combo' ? formComboItems : null,
          }),
        });

        if (response.ok) {
          toast.success('Serviço criado com sucesso');
          await loadServices();
          resetForm();
          onServicesUpdated?.();
        } else {
          toast.error('Erro ao criar serviço');
        }
      }
    } catch (error) {
      toast.error('Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (service: Service) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/services/${service.id}/toggle`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success(service.is_active ? 'Serviço desativado' : 'Serviço ativado');
        await loadServices();
        onServicesUpdated?.();
      } else {
        toast.error('Erro ao alterar status do serviço');
      }
    } catch (error) {
      toast.error('Erro ao alterar status do serviço');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (service: Service) => {
    const confirmed = await confirm({
      title: 'Excluir Serviço',
      message: `Tem certeza que deseja excluir "${service.name}"?`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Serviço excluído com sucesso');
        await loadServices();
        onServicesUpdated?.();
      } else {
        toast.error('Erro ao excluir serviço');
      }
    } catch (error) {
      toast.error('Erro ao excluir serviço');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredServices = services.filter(s => s.type === activeTab);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-blue-500/30 max-w-5xl w-full max-h-[90vh] my-8 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 border-b border-blue-500/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white">Gerenciar Serviços</h3>
              <p className="text-blue-200 text-sm mt-1">Configure seus serviços e pacotes disponíveis</p>
            </div>
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                setActiveTab('service');
                resetForm();
              }}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                activeTab === 'service'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
              }`}
            >
              <Wrench className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Serviços</div>
                <div className="text-xs opacity-80">{services.filter(s => s.type === 'service').length} cadastrado{services.filter(s => s.type === 'service').length !== 1 ? 's' : ''}</div>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('combo');
                resetForm();
              }}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                activeTab === 'combo'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
              }`}
            >
              <Package className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Pacotes</div>
                <div className="text-xs opacity-80">{services.filter(s => s.type === 'combo').length} cadastrado{services.filter(s => s.type === 'combo').length !== 1 ? 's' : ''}</div>
              </div>
            </button>
          </div>

          {/* New Service Button */}
          {!showNewServiceForm && (
            <button
              onClick={() => setShowNewServiceForm(true)}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 mb-6"
            >
              <Plus className="w-6 h-6" />
              <span>Adicionar {activeTab === 'service' ? 'Novo Serviço' : 'Novo Pacote'}</span>
            </button>
          )}

          {/* New/Edit Service Form */}
          {showNewServiceForm && (
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-6 border border-blue-500/30 mb-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-white font-bold text-xl flex items-center gap-2">
                  {activeTab === 'service' ? <Wrench className="w-5 h-5 text-blue-400" /> : <Package className="w-5 h-5 text-purple-400" />}
                  {editingService ? 'Editar' : 'Novo'} {activeTab === 'service' ? 'Serviço' : 'Pacote'}
                </h4>
                <span className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full font-semibold">
                  {activeTab === 'service' ? 'SERVIÇO' : 'PACOTE'}
                </span>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-blue-300 mb-2">
                      Nome do {activeTab === 'service' ? 'Serviço' : 'Pacote'} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={
                        isMobile
                          ? (activeTab === 'service' ? 'Nome do serviço' : 'Nome do pacote')
                          : (activeTab === 'service' ? 'Exemplo: Gravação de Áudio' : 'Exemplo: Pacote Completo')
                      }
                      className="w-full px-4 py-3 rounded-lg bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-300 mb-2">
                      Preço (R$) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="150.00"
                      className="w-full px-4 py-3 rounded-lg bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-300 mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={isMobile ? "Descrição (opcional)" : "Adicione uma descrição opcional"}
                    className="w-full px-4 py-3 rounded-lg bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                  />
                </div>

                {activeTab === 'service' && (
                  <div>
                    <label className="block text-sm font-bold text-blue-300 mb-3">
                      Unidade de Cobrança
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg transition-all border-2 ${
                        formIsHourly 
                          ? 'bg-purple-600/20 border-purple-500' 
                          : 'bg-slate-600/30 border-slate-600 hover:border-slate-500'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formIsHourly}
                          onChange={(e) => {
                            setFormIsHourly(e.target.checked);
                            if (e.target.checked) {
                              setFormIsPerTrack(false);
                              setFormIsPerImage(false);
                              setFormIsPerVideo(false);
                            }
                          }}
                          className="w-5 h-5 accent-purple-600"
                        />
                        <span className="text-white font-medium">Por Hora</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg transition-all border-2 ${
                        formIsPerTrack 
                          ? 'bg-blue-600/20 border-blue-500' 
                          : 'bg-slate-600/30 border-slate-600 hover:border-slate-500'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formIsPerTrack}
                          onChange={(e) => {
                            setFormIsPerTrack(e.target.checked);
                            if (e.target.checked) {
                              setFormIsHourly(false);
                              setFormIsPerImage(false);
                              setFormIsPerVideo(false);
                            }
                          }}
                          className="w-5 h-5 accent-blue-600"
                        />
                        <span className="text-white font-medium">Por Faixa</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg transition-all border-2 ${
                        formIsPerImage 
                          ? 'bg-green-600/20 border-green-500' 
                          : 'bg-slate-600/30 border-slate-600 hover:border-slate-500'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formIsPerImage}
                          onChange={(e) => {
                            setFormIsPerImage(e.target.checked);
                            if (e.target.checked) {
                              setFormIsHourly(false);
                              setFormIsPerTrack(false);
                              setFormIsPerVideo(false);
                            }
                          }}
                          className="w-5 h-5 accent-green-600"
                        />
                        <span className="text-white font-medium">Por Imagem</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg transition-all border-2 ${
                        formIsPerVideo 
                          ? 'bg-cyan-600/20 border-cyan-500' 
                          : 'bg-slate-600/30 border-slate-600 hover:border-slate-500'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formIsPerVideo}
                          onChange={(e) => {
                            setFormIsPerVideo(e.target.checked);
                            if (e.target.checked) {
                              setFormIsHourly(false);
                              setFormIsPerTrack(false);
                              setFormIsPerImage(false);
                            }
                          }}
                          className="w-5 h-5 accent-cyan-600"
                        />
                        <span className="text-white font-medium">Por Vídeo</span>
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'combo' && (
                  <div>
                    <label className="block text-sm font-bold text-blue-300 mb-2">
                      Itens Incluídos no Pacote
                    </label>
                    <textarea
                      value={formComboItems}
                      onChange={(e) => setFormComboItems(e.target.value)}
                      placeholder={
                        isMobile
                          ? "Lista de serviços incluídos"
                          : "Exemplo: Gravação de Áudio, Mixagem de Áudio, Masterização de Áudio"
                      }
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-slate-600 text-white border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-slate-400"
                    />
                    <p className="text-slate-400 text-xs mt-2">Separe os itens por vírgula</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-600">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Salvando...' : editingService ? 'Atualizar' : 'Salvar'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services List */}
          <div className="space-y-3">
            {filteredServices.length === 0 ? (
              <div className="text-center py-16 bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-600">
                {activeTab === 'service' ? (
                  <Wrench className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                ) : (
                  <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                )}
                <p className="text-slate-400 text-lg font-medium">
                  Nenhum {activeTab === 'service' ? 'serviço' : 'pacote'} cadastrado
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  Clique no botão acima para adicionar o primeiro
                </p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  className={`bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-xl p-5 border-2 transition-all hover:shadow-lg ${
                    service.is_active 
                      ? 'border-slate-600 hover:border-blue-500/50' 
                      : 'border-red-500/30 opacity-60 hover:border-red-500/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-white font-bold text-lg">{service.name}</h5>
                        {!service.is_active && (
                          <span className="text-xs px-3 py-1 bg-red-600 text-white rounded-full font-bold">
                            INATIVO
                          </span>
                        )}
                        {service.type === 'combo' && (
                          <span className="text-xs px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold">
                            PACOTE
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <p className="text-green-400 font-bold text-xl">R$ {service.price.toFixed(2)}</p>
                        {service.is_hourly === 1 && (
                          <span className="text-xs px-2.5 py-1 bg-purple-600/20 border border-purple-500 text-purple-300 rounded-md font-semibold">
                            POR HORA
                          </span>
                        )}
                        {service.is_per_track === 1 && (
                          <span className="text-xs px-2.5 py-1 bg-blue-600/20 border border-blue-500 text-blue-300 rounded-md font-semibold">
                            POR FAIXA
                          </span>
                        )}
                        {service.is_per_image === 1 && (
                          <span className="text-xs px-2.5 py-1 bg-green-600/20 border border-green-500 text-green-300 rounded-md font-semibold">
                            POR IMAGEM
                          </span>
                        )}
                        {service.is_per_video === 1 && (
                          <span className="text-xs px-2.5 py-1 bg-cyan-600/20 border border-cyan-500 text-cyan-300 rounded-md font-semibold">
                            POR VÍDEO
                          </span>
                        )}
                      </div>
                      
                      {service.description && (
                        <p className="text-slate-300 text-sm mb-2 bg-slate-600/30 px-3 py-2 rounded-lg">
                          {service.description}
                        </p>
                      )}
                      {service.combo_items && (
                        <div className="mt-2 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                          <p className="text-purple-300 font-semibold text-xs mb-1">Itens incluídos:</p>
                          <p className="text-slate-200 text-sm">{service.combo_items}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleToggle(service)}
                        className={`p-3 rounded-lg transition-all ${
                          service.is_active
                            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/50'
                            : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/50'
                        }`}
                        title={service.is_active ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        disabled={loading}
                        className="p-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/50 rounded-lg transition-all disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
