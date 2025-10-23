import { Variants } from "framer-motion";

// Easing functions
export const easings = {
  smooth: [0.43, 0.13, 0.23, 0.96],
  springy: [0.68, -0.55, 0.265, 1.55],
  bounce: [0.87, 0, 0.13, 1],
} as const;

// Duration constants (in seconds)
export const durations = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

// Framer Motion variants
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal }
  },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.smooth }
  },
};

export const slideInVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.normal, ease: easings.smooth }
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.normal, ease: easings.smooth }
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const hoverLiftVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: durations.fast, ease: easings.smooth }
  },
};

export const glowVariants = {
  rest: { filter: "brightness(1)" },
  hover: {
    filter: "brightness(1.2)",
    transition: { duration: durations.fast }
  },
};

// Stagger utilities
export const stagger = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.2,
} as const;

// GSAP timeline configurations
export const gsapDefaults = {
  ease: "power3.out",
  duration: durations.normal,
};

export const gsapSpring = {
  ease: "elastic.out(1, 0.5)",
  duration: durations.slow,
};

export const gsapBounce = {
  ease: "bounce.out",
  duration: durations.slow,
};

