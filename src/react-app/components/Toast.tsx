import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-500/50';
      case 'error':
        return 'bg-red-900/90 border-red-500/50';
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-500/50';
      case 'info':
        return 'bg-blue-900/90 border-blue-500/50';
    }
  };

  return (
    <motion.div 
      className={`${getBackgroundColor()} border backdrop-blur-sm rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[300px] max-w-[500px]`}
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      layout
    >
      {getIcon()}
      <p className="text-white flex-1 text-sm font-medium">{message}</p>
      <motion.button
        onClick={onClose}
        className="text-white/70 hover:text-white transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
