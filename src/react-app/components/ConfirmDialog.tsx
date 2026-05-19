import { X, AlertTriangle } from 'lucide-react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';
import { backdropVariants, modalVariants } from '@/react-app/utils/animations';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}: ConfirmDialogProps) {
  useLockBodyScroll(isOpen);

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'from-red-900 to-red-800',
          button: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        };
      case 'warning':
        return {
          bg: 'from-yellow-900 to-yellow-800',
          button: 'from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
        };
      case 'info':
        return {
          bg: 'from-blue-900 to-blue-800',
          button: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9998] p-4 overflow-y-auto"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onCancel}
        >
          <motion.div 
            className="bg-slate-800 rounded-lg w-full max-w-md my-8 shadow-2xl border border-slate-600 max-h-[90vh] flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Fixed Header */}
        <div className={`bg-gradient-to-r ${colors.bg} p-4 border-b border-slate-600 rounded-t-lg flex-shrink-0`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-1 bg-slate-700/50 hover:bg-slate-600 text-white rounded transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-slate-200 text-base leading-relaxed">{message}</p>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-600 rounded-b-lg flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md font-semibold transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 bg-gradient-to-r ${colors.button} text-white rounded-md font-semibold transition-all shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmContextType {
  confirm: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning',
    resolve: null
  });

  const confirm = useCallback((options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'warning',
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState.resolve]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState.resolve]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}
