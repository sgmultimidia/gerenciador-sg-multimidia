import { motion } from 'framer-motion';
import { listContainerVariants, listItemVariants } from '@/react-app/utils/animations';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div
      variants={listItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
