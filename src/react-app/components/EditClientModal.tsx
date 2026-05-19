import { X, Star, Instagram, Facebook, Save, Edit2, Mail, MapPin, Phone, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Client } from '@/shared/types';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { backdropVariants, modalVariants } from '@/react-app/utils/animations';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onUpdate: (client: Client) => Promise<void>;
  loading: boolean;
  formatCpfCnpj: (value: string, type: 'fisica' | 'juridica') => string;
}

export default function EditClientModal({
  isOpen,
  onClose,
  client,
  onUpdate,
  loading,
  formatCpfCnpj
}: EditClientModalProps) {
  useLockBodyScroll(isOpen);

  // Estado interno para evitar que o sistema salve a cada letra digitada
  const [formData, setFormData] = useState<Client | null>(null);

  // Carrega os dados do cliente para o estado interno ao abrir o modal
  useEffect(() => {
    if (isOpen && client) {
      setFormData({ ...client });
    }
  }, [isOpen, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      await onUpdate(formData);
      onClose(); 
    }
  };

  const handleChange = (field: keyof Client, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && formData && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div 
            className="bg-slate-900 border border-blue-500/30 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            variants={modalVariants}
          >
            {/* Header */}
            <div className="p-4 border-b border-blue-500/30 flex justify-between items-center bg-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                Editar Cadastro: {client?.name}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <form id="edit-client-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Nome - Ocupa as duas colunas */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nome / Razão Social</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                {/* CPF/CNPJ */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={formData.cpf_cnpj || ''}
                    onChange={(e) => handleChange('cpf_cnpj', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>

                {/* WhatsApp / Contato */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> WhatsApp / Contato
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp || formData.contact || ''}
                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>

                {/* E-mail */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Redes Sociais */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Instagram className="w-3 h-3" /> Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.instagram || ''}
                    onChange={(e) => handleChange('instagram', e.target.value)}
                    placeholder="@usuario"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Facebook className="w-3 h-3" /> Facebook
                  </label>
                  <input
                    type="text"
                    value={formData.facebook || ''}
                    onChange={(e) => handleChange('facebook', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Notas/Tags */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Notas / Observações</label>
                  <textarea
                    value={formData.phone_notes || ''}
                    onChange={(e) => handleChange('phone_notes', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Favorito */}
              <div className="mt-6">
                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer group hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_favorite}
                    onChange={(e) => handleChange('is_favorite', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <Star className={`w-5 h-5 ${formData.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
                  <span className="text-white font-semibold">Cliente Favorito</span>
                </label>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-blue-500/30 p-4 bg-slate-900 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-md font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                form="edit-client-form"
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-md font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {loading ? 'Processando...' : (
                  <>
                    <Save className="w-5 h-5" />
                    Atualizar Cadastro
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}