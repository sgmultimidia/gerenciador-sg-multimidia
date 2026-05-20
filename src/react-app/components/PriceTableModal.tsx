import { useState } from 'react';
import { X, DollarSign, Send, Edit2, Check, XCircle } from 'lucide-react';
import type { Service } from '@/shared/types';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { formatBRL } from '@/react-app/utils/formatBRL';

interface PriceTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  selectedClient: { name: string; contact?: string; whatsapp?: string } | null;
  onSendWhatsApp: () => void;
  onUpdatePrice: (id: number, price: number) => Promise<void>;
}

export default function PriceTableModal({
  isOpen,
  onClose,
  services,
  selectedClient,
  onSendWhatsApp,
  onUpdatePrice
}: PriceTableModalProps) {
  useLockBodyScroll(isOpen);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setEditingPrice(service.price.toFixed(2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingPrice('');
  };

  const saveEdit = async () => {
    if (!editingId || !editingPrice) return;
    
    const price = parseFloat(editingPrice);
    if (isNaN(price) || price < 0) {
      cancelEdit();
      return;
    }

    setSaving(true);
    try {
      await onUpdatePrice(editingId, price);
      cancelEdit();
    } catch (error) {
      // Error saving price - silently fail
    } finally {
      setSaving(false);
    }
  };

  const servicesList = services.filter(s => s.type === 'service');
  const combosList = services.filter(s => s.type === 'combo');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30 max-w-4xl w-full max-h-[90vh] my-8 flex flex-col">
        <div className="bg-slate-800 border-b border-blue-500/30 p-6 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-400" />
            <div>
              <h3 className="text-2xl font-bold text-white">Tabela de Preços</h3>
              <p className="text-sm text-slate-400 mt-1">Clique no ícone de edição para personalizar os valores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {servicesList.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-bold text-blue-300 mb-4 pb-2 border-b border-blue-500/30 flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                Serviços À La Carte
              </h4>
              <div className="grid gap-3">
                {servicesList.map((service) => {
                  const isEditing = editingId === service.id;

                  return (
                    <div
                      key={service.id}
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 flex justify-between items-center hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex-1">
                        <p className="text-white font-semibold text-lg">{service.name}</p>
                        {service.description && (
                          <p className="text-slate-400 text-sm mt-1">{service.description}</p>
                        )}
                        {service.is_hourly === 1 && (
                          <p className="text-slate-400 text-sm mt-1">Cobrança por hora</p>
                        )}
                        {service.is_per_image === 1 && (
                          <p className="text-slate-400 text-sm mt-1">Cobrança por imagem</p>
                        )}
                        {service.is_per_track === 1 && (
                          <p className="text-slate-400 text-sm mt-1">Cobrança por faixa</p>
                        )}
                        {service.is_per_video === 1 && (
                          <p className="text-slate-400 text-sm mt-1">Cobrança por vídeo</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <span className="text-white">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                className="w-28 px-3 py-2 bg-slate-600 text-white rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                autoFocus
                                disabled={saving}
                              />
                            </div>
                          ) : (
                            <p className="text-blue-400 font-bold text-xl">
                              R$ {formatBRL(service.price)}
                            </p>
                          )}
                          {!isEditing && (
                            <>
                              {service.is_hourly === 1 && (
                                <p className="text-slate-400 text-sm">/hora</p>
                              )}
                              {service.is_per_image === 1 && (
                                <p className="text-slate-400 text-sm">/imagem</p>
                              )}
                              {service.is_per_track === 1 && (
                                <p className="text-slate-400 text-sm">/faixa</p>
                              )}
                              {service.is_per_video === 1 && (
                                <p className="text-slate-400 text-sm">/vídeo</p>
                              )}
                            </>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-all"
                              title="Salvar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-all"
                              title="Cancelar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(service)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
                            title="Editar preço"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {combosList.length > 0 && (
            <div>
              <h4 className="text-xl font-bold text-cyan-300 mb-4 pb-2 border-b border-cyan-500/30 flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                Pacotes Promocionais
              </h4>
              <div className="grid gap-3">
                {combosList.map((combo) => {
                  const isEditing = editingId === combo.id;

                  return (
                    <div
                      key={combo.id}
                      className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg p-5 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-white font-bold text-lg">{combo.name}</p>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-600 text-white font-semibold">
                              PACOTE
                            </span>
                          </div>
                          {combo.combo_items && (
                            <p className="text-slate-300 text-sm">{combo.combo_items}</p>
                          )}
                          {combo.description && (
                            <p className="text-slate-400 text-sm mt-1">{combo.description}</p>
                          )}
                          {combo.is_per_track === 1 && !isEditing && (
                            <p className="text-slate-400 text-sm mt-1">Preço por faixa produzida</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <span className="text-white">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingPrice}
                                  onChange={(e) => setEditingPrice(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  className="w-32 px-3 py-2 bg-slate-600 text-white rounded border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                  autoFocus
                                  disabled={saving}
                                />
                              </div>
                            ) : (
                              <p className="text-cyan-400 font-bold text-2xl">
                                R$ {formatBRL(combo.price)}
                              </p>
                            )}
                            {combo.is_per_track === 1 && !isEditing && (
                              <p className="text-slate-400 text-sm">/faixa</p>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="flex gap-1">
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-all"
                                title="Salvar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-all"
                                title="Cancelar"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(combo)}
                              className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-all"
                              title="Editar preço"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-slate-300 text-sm">
              <span className="font-semibold text-blue-300">Observação:</span> Os preços podem variar conforme a complexidade do projeto. 
              Entre em contato para um orçamento personalizado.
            </p>
          </div>

          <div className="mt-6">
            <button
              onClick={onSendWhatsApp}
              disabled={!selectedClient}
              className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-green-500/50 disabled:shadow-none flex items-center justify-center gap-2 text-lg"
              title={!selectedClient ? "Selecione um cliente primeiro" : "Enviar tabela de preços por WhatsApp"}
            >
              <Send className="w-6 h-6" />
              {selectedClient ? `Enviar para ${selectedClient.name}` : 'Selecione um cliente primeiro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
