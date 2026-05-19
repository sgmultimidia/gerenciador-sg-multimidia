import { Variants } from 'framer-motion';

// Configurações de transição padrão
export const defaultTransition = {
  duration: 0.3,
  ease: [0.4, 0.0, 0.2, 1] as const, // ease-out personalizado
};

export const springTransition = {
  type: 'spring' as const,
  damping: 20,
  stiffness: 300,
};

export const smoothTransition = {
  duration: 0.4,
  ease: [0.4, 0.0, 0.2, 1] as const,
};

// Variantes de animação para fade in
export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Variantes para slide up (entrada de baixo para cima)
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.2 },
  },
};

// Variantes para slide down (modais)
export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

// Variantes para scale (zoom in/out)
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// Variantes para lista (stagger children)
export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

// Variantes para cards do dashboard
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: smoothTransition,
  },
};

// Variantes para backdrop de modais
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Variantes para modais
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// Variantes para página (transição de rotas)
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

// Hover animations (para uso em whileHover)
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const hoverLift = {
  y: -2,
  transition: { duration: 0.2 },
};

export const hoverBrightness = {
  filter: 'brightness(1.1)',
  transition: { duration: 0.2 },
};

// Tap animations (para uso em whileTap)
export const tapScale = {
  scale: 0.98,
};

// Loading animations
export const pulseVariants: Variants = {
  pulse: {
    opacity: [1, 0.6, 1],
    scale: [1, 0.98, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const spinVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Badge animations (para notificações, novidades)
export const badgeVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springTransition,
  },
};

// Slide in from side (para sidebars, drawers)
export const slideInFromRightVariants: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: smoothTransition,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const slideInFromLeftVariants: Variants = {
  hidden: {
    x: '-100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: smoothTransition,
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Collapse/Expand animations
export const collapseVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: defaultTransition,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: defaultTransition,
  },
};
