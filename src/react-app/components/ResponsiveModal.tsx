import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsMobile } from '@/react-app/hooks/useMediaQuery';
import { backdropVariants, modalVariants } from '@/react-app/utils/animations';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  headerGradient?: string;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '4xl',
  headerGradient = 'from-blue-900 to-purple-900',
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div 
            className={`
              bg-slate-800 rounded-lg shadow-2xl border border-blue-500/30
              ${isMobile 
                ? 'w-full h-full max-h-full rounded-none' 
                : `w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] m-4`
              }
              overflow-hidden flex flex-col
            `}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerGradient} ${isMobile ? 'p-4' : 'p-6'} border-b border-blue-500/30 flex-shrink-0`}>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-white mb-1 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                {title}
              </h2>
              {subtitle && (
                <p className={`text-blue-200 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className={`p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all flex-shrink-0 ml-2`}
            >
              <X className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-3' : 'p-6'}`}>
          {children}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
