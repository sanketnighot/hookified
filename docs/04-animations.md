# Animation System

Complete guide to the three-layer animation system in Hookified.

## 🎭 Animation Philosophy

Hookified uses a **three-layer animation approach** for optimal performance and flexibility:

1. **GSAP** - Complex, physics-based animations
2. **Framer Motion** - Component micro-interactions
3. **CSS** - Efficient shimmer and glow effects

## 📚 Animation Library

Located in `src/lib/animations.ts`:

```typescript
import { Variants } from "framer-motion";

// Easing functions
export const easings = {
  smooth: [0.43, 0.13, 0.23, 0.96],
  springy: [0.68, -0.55, 0.265, 1.55],
  bounce: [0.87, 0, 0.13, 1],
};

// Duration constants
export const durations = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
};
```

## 🎨 Framer Motion Variants

### 1. Fade In
```typescript
import { fadeInVariants } from "@/lib/animations";

<motion.div
  initial="hidden"
  animate="visible"
  variants={fadeInVariants}
>
  Content
</motion.div>
```

### 2. Slide Up
```typescript
import { slideUpVariants } from "@/lib/animations";

<motion.div
  initial="hidden"
  animate="visible"
  variants={slideUpVariants}
>
  Content slides up
</motion.div>
```

### 3. Slide In (from left)
```typescript
import { slideInVariants } from "@/lib/animations";

<motion.div
  initial="hidden"
  animate="visible"
  variants={slideInVariants}
>
  Content slides in
</motion.div>
```

### 4. Scale In
```typescript
import { scaleInVariants } from "@/lib/animations";

<motion.div
  initial="hidden"
  animate="visible"
  variants={scaleInVariants}
>
  Content scales in
</motion.div>
```

### 5. Staggered Container
```typescript
import { staggerContainerVariants, slideUpVariants } from "@/lib/animations";

<motion.div
  variants={staggerContainerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={slideUpVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### 6. Hover Lift
```typescript
import { hoverLiftVariants } from "@/lib/animations";

<motion.div
  variants={hoverLiftVariants}
  initial="rest"
  whileHover="hover"
>
  Hover me!
</motion.div>
```

### 7. Glow Effect
```typescript
import { glowVariants } from "@/lib/animations";

<motion.div
  variants={glowVariants}
  initial="rest"
  whileHover="hover"
>
  Glows on hover
</motion.div>
```

## 🌟 GSAP Animations

### Configuration Presets
```typescript
import { gsapDefaults, gsapSpring, gsapBounce } from "@/lib/animations";

// Default smooth animation
gsap.to(element, {
  ...gsapDefaults,
  x: 100
});

// Spring effect
gsap.to(element, {
  ...gsapSpring,
  scale: 1.2
});

// Bounce effect
gsap.to(element, {
  ...gsapBounce,
  y: -50
});
```

### Sidebar Expansion
```typescript
import { useRef } from "react";
import gsap from "gsap";

const sidebarRef = useRef<HTMLDivElement>(null);

const expand = () => {
  gsap.to(sidebarRef.current, {
    width: "12rem",
    duration: 0.3,
    ease: "power3.out"
  });
};

const collapse = () => {
  gsap.to(sidebarRef.current, {
    width: "4rem",
    duration: 0.3,
    ease: "power3.out"
  });
};
```

### Floating Orbs
```typescript
useEffect(() => {
  const orbs = document.querySelectorAll(".floating-orb");

  orbs.forEach((orb, i) => {
    gsap.to(orb, {
      y: -20,
      duration: 4 + i * 0.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  });
}, []);
```

## 💫 CSS Animations

### Custom Keyframes (in globals.css)

```css
@theme {
  @keyframes shimmer {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 1; filter: brightness(1); }
    50% { opacity: 0.8; filter: brightness(1.2); }
  }
}
```

### Utility Classes

```tsx
// Floating animation
<div className="animate-float">
  Floats up and down
</div>

// Pulsing glow
<div className="animate-pulse-glow">
  Pulsing glow effect
</div>

// Holographic shimmer
<div className="holographic-shimmer">
  Shimmering border
</div>
```

## 🎯 Animation Patterns

### 1. Page Transitions
```typescript
import { fadeInVariants } from "@/lib/animations";

export default function Page() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      <PageContent />
    </motion.div>
  );
}
```

### 2. List Animations
```typescript
import { staggerContainerVariants, slideUpVariants } from "@/lib/animations";

export function ItemList({ items }) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-6"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={slideUpVariants}>
          <ItemCard item={item} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 3. Hover Effects
```typescript
export function InteractiveCard() {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card>Hover me!</Card>
    </motion.div>
  );
}
```

### 4. Modal Animations
```typescript
export function Modal({ isOpen }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <ModalContent />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 5. Step Transitions
```typescript
import { AnimatePresence } from "framer-motion";
import { slideInVariants } from "@/lib/animations";

export function Wizard({ currentStep }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        variants={slideInVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <StepContent step={currentStep} />
      </motion.div>
    </AnimatePresence>
  );
}
```

## 🚀 Performance Tips

### 1. Use CSS for Simple Animations
```tsx
// ✅ Good - CSS animation
<div className="animate-float">Content</div>

// ❌ Avoid - JS animation for simple effects
<motion.div animate={{ y: [0, -10, 0] }}>Content</motion.div>
```

### 2. Optimize Motion Values
```tsx
// ✅ Good - Transform (GPU accelerated)
<motion.div animate={{ x: 100, scale: 1.2 }} />

// ❌ Avoid - Layout properties (expensive)
<motion.div animate={{ width: 200, height: 300 }} />
```

### 3. Use Layout Animations Sparingly
```tsx
// Only when absolutely necessary
<motion.div layout>
  <DynamicContent />
</motion.div>
```

### 4. Reduce Animation Scope
```tsx
// ✅ Good - Animate specific element
<motion.div whileHover={{ scale: 1.05 }}>
  <Card />
</motion.div>

// ❌ Avoid - Animating large trees
<motion.div whileHover={{ scale: 1.05 }}>
  <ComplexNestedStructure />
</motion.div>
```

### 5. Respect Motion Preferences
```typescript
import { useReducedMotion } from "framer-motion";

export function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { x: 100 }}
    >
      Content
    </motion.div>
  );
}
```

## 🎨 Custom Animation Recipes

### Count-Up Animation
```typescript
import { useEffect, useState } from "react";

export function CountUp({ end, duration = 2000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = 0;
    const increment = end / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}</span>;
}
```

### Typewriter Effect
```typescript
export function Typewriter({ text, delay = 50 }) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setDisplayText(text.slice(0, index));
      index++;
      if (index > text.length) clearInterval(timer);
    }, delay);

    return () => clearInterval(timer);
  }, [text, delay]);

  return <span>{displayText}</span>;
}
```

### Parallax Scroll
```typescript
import { useScroll, useTransform, motion } from "framer-motion";

export function ParallaxElement() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -200]);

  return (
    <motion.div style={{ y }}>
      Parallax content
    </motion.div>
  );
}
```

## 📋 Animation Checklist

When adding animations:

- [ ] Choose the right layer (GSAP/Framer Motion/CSS)
- [ ] Use predefined variants from `animations.ts`
- [ ] Test on different devices and browsers
- [ ] Verify performance (60fps target)
- [ ] Respect `prefers-reduced-motion`
- [ ] Add appropriate timing and easing
- [ ] Test with slow network/CPU throttling
- [ ] Ensure animations enhance UX, not distract

---

**Next**: [State Management](./05-state-management.md)

