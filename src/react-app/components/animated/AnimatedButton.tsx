import { motion, HTMLMotionProps } from 'framer-motion';
import { tapScale } from '@/react-app/utils/animations';

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  hoverScale?: number;
}

export function AnimatedButton({ 
  children, 
  hoverScale = 1.02,
  ...props 
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: hoverScale }}
      whileTap={tapScale}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
