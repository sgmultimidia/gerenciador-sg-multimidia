import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backdropVariants, modalVariants } from '@/react-app/utils/animations';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function AnimatedModal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-6xl',
}: AnimatedModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prevOverflow || 'unset';
    }

    return () => {
      document.body.style.overflow = prevOverflow || 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          // ⛔️ REMOVIDO overflow-y-auto do backdrop
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          // fecha só se clicar realmente no fundo
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // ✅ modal com altura máxima + layout em coluna
            className={`bg-slate-800 rounded-xl ${maxWidth} w-full my-8 max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ✅ Conteúdo interno com scroll */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
