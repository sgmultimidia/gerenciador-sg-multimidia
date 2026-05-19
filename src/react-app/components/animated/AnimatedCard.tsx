import { motion, HTMLMotionProps } from 'framer-motion';
import { cardVariants, hoverLift } from '@/react-app/utils/animations';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  delay?: number;
  children: React.ReactNode;
}

export function AnimatedCard({ delay = 0, children, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverLift}
      transition={{
        delay,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
