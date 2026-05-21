import { X, Star, Instagram, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/react-app/hooks/useMediaQuery';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { backdropVariants, modalVariants } from '@/react-app/utils/animations';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientType: 'fisica' | 'juridica';
  onChangeClientType: (type: 'fisica' | 'juridica') => void;
  name: string;
  onChangeName: (name: string) => void;
  cpfCnpj: string;
  onChangeCpfCnpj: (value: string) => void;
  email: string;
  onChangeEmail: (email: string) => void;
  address: string;
  onChangeAddress: (address: string) => void;
  contact: string;
  onChangeContact: (contact: string) => void;
  phoneNotes: string;
  onChangePhoneNotes: (notes: string) => void;
  tags: string;
  onChangeTags: (tags: string) => void;
  instagram: string;
  onChangeInstagram: (instagram: string) => void;
  facebook: string;
  onChangeFacebook: (facebook: string) => void;
  logoUrl: string;
  onChangeLogoUrl: (url: string) => void;
  internalNotes: string;
  onChangeInternalNotes: (notes: string) => void;
  isFavorite: boolean;
  onChangeIsFavorite: (favorite: boolean) => void;
  onSubmit: () => void;
  onBlurCNPJ: () => void;
  loading: boolean;
  errorMessage: string;
  formatCpfCnpj: (value: string, type: 'fisica' | 'juridica') => string;
}

export default function NewClientModal({
  isOpen,
  onClose,
  clientType,
  onChangeClientType,
  name,
  onChangeName,
  cpfCnpj,
  onChangeCpfCnpj,
  email,
  onChangeEmail,
  address,
  onChangeAddress,
  contact,
  onChangeContact,
  phoneNotes,
  onChangePhoneNotes,
  tags,
  onChangeTags,
  instagram,
  onChangeInstagram,
  facebook,
  onChangeFacebook,
  logoUrl,
  onChangeLogoUrl,
  internalNotes,
  onChangeInternalNotes,
  isFavorite,
  onChangeIsFavorite,
  onSubmit,
  onBlurCNPJ,
  loading,
  errorMessage,
  formatCpfCnpj
}: NewClientModalProps) {
  const isMobile = useIsMobile();
  useLockBodyScroll(isOpen);

  return (
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
            className="bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30 max-w-3xl w-full max-h-[90vh] my-8 flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="bg-gradient-to-r from-primary-900 to-blue-900 border-b border-blue-500/30 p-4 md:p-6 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl md:text-2xl font-bold text-white">Novo Cliente</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md">
              <p className="text-red-300 text-sm font-semibold">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Client Type */}
            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-2 uppercase tracking-wide">
                Tipo de Cliente
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => onChangeClientType('fisica')}
                  className={`flex-1 px-4 py-3 rounded-md font-semibold transition-all ${
                    clientType === 'fisica'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Pessoa Física
                </button>
                <button
                  onClick={() => onChangeClientType('juridica')}
                  className={`flex-1 px-4 py-3 rounded-md font-semibold transition-all ${
                    clientType === 'juridica'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Pessoa Jurídica
                </button>
              </div>
            </div>

            {/* Basic Info - Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-blue-300 mb-2">
                  {clientType === 'fisica' ? 'Nome Completo' : 'Razão Social'} *
                </label>
                <input
                  type="text"
                  placeholder={
                    isMobile 
                      ? (clientType === 'fisica' ? 'Nome completo' : 'Razão social')
                      : (clientType === 'fisica' ? 'Exemplo: João Silva' : 'Exemplo: Empresa ABC Ltda.')
                  }
                  value={name}
                  onChange={(e) => onChangeName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-300 mb-2">
                  {clientType === 'fisica' ? 'CPF' : 'CNPJ'}
                  {clientType === 'juridica' && (
                    <span className="text-xs text-slate-400 ml-2">(busca automática)</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={clientType === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                  value={cpfCnpj}
                  onChange={(e) => {
                    const formatted = formatCpfCnpj(e.target.value, clientType);
                    onChangeCpfCnpj(formatted);
                  }}
                  onBlur={onBlurCNPJ}
                  maxLength={clientType === 'fisica' ? 14 : 18}
                  className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-300 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => onChangeEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-2">
                Endereço Completo
              </label>
              <textarea
                placeholder={isMobile ? "Endereço completo" : "Rua, número, bairro, cidade, estado, CEP"}
                value={address}
                onChange={(e) => onChangeAddress(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-blue-300 mb-2">
                  WhatsApp com DDD
                </label>
                <input
                  type="text"
                  placeholder="55999999999"
                  value={contact}
                  onChange={(e) => onChangeContact(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-300 mb-2">
                  Observações sobre Telefone
                </label>
                <input
                  type="text"
                  placeholder={isMobile ? "Observações" : "Exemplo: Ligar após às 14h"}
                  value={phoneNotes}
                  onChange={(e) => onChangePhoneNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </label>
                <input
                  type="text"
                  placeholder="@usuario"
                  value={instagram}
                  onChange={(e) => onChangeInstagram(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </label>
                <input
                  type="text"
                  placeholder="perfil ou página"
                  value={facebook}
                  onChange={(e) => onChangeFacebook(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Tags and Logo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-blue-300 mb-2">
                  Tags
                  <span className="text-xs text-slate-400 ml-2">(separadas por vírgula)</span>
                </label>
                <input
                  type="text"
                  placeholder={isMobile ? "Tags" : "Exemplo: VIP, Recorrente, Corporativo"}
                  value={tags}
                  onChange={(e) => onChangeTags(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-300 mb-2">
                  URL da Logo/Foto
                </label>
                <input
                  type="text"
                  placeholder="https://exemplo.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => onChangeLogoUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-2">
                Observações Internas (Privadas)
              </label>
              <textarea
                placeholder={isMobile ? "Observações internas..." : "Notas privadas sobre preferências, histórico de negociações, etc."}
                value={internalNotes}
                onChange={(e) => onChangeInternalNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Favorite Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer bg-slate-700/30 p-3 rounded-lg hover:bg-slate-700/50 transition-all">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => onChangeIsFavorite(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
                <span className="text-white font-semibold">Marcar como cliente favorito</span>
              </label>
            </div>

            </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="border-t border-blue-500/30 p-4 md:p-6 bg-slate-900 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-md font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-all shadow-lg hover:shadow-blue-500/50"
            >
              {loading ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
