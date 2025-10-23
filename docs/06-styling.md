# Styling Guide

Complete guide to the Aurora theme and utility classes in Hookified.

## 🎨 Aurora Theme

Our futuristic design system based on aurora borealis colors and deep space aesthetics.

### Color Palette

#### Base Colors
```css
--color-background: 222 47% 5%;      /* Deep space dark */
--color-foreground: 210 40% 98%;     /* Almost white text */
--color-card: 222 47% 8%;            /* Slightly lighter cards */
--color-muted: 217 33% 17%;          /* Muted elements */
```

#### Aurora Gradients
```css
--color-aurora-cyan: 180 100% 50%;      /* Cyan */
--color-aurora-magenta: 320 100% 65%;   /* Magenta */
--color-aurora-purple: 270 100% 65%;    /* Purple */
--color-aurora-pink: 330 100% 70%;      /* Pink */
--color-aurora-blue: 220 100% 60%;      /* Blue */
--color-aurora-violet: 260 100% 65%;    /* Violet */
```

#### Space Backgrounds
```css
--color-space-dark: 222 47% 5%;      /* Darkest */
--color-space-medium: 220 45% 7%;    /* Medium */
--color-space-light: 218 43% 10%;    /* Lightest */
```

## 🌈 Gradient Utilities

### Aurora Gradients

#### Gradient 1: Cyan → Magenta
```tsx
<div className="aurora-gradient-1">
  Cyan to Magenta gradient
</div>
```

#### Gradient 2: Purple → Pink
```tsx
<div className="aurora-gradient-2">
  Purple to Pink gradient
</div>
```

#### Gradient 3: Blue → Violet
```tsx
<div className="aurora-gradient-3">
  Blue to Violet gradient
</div>
```

#### Gradient Text
```tsx
<h1 className="aurora-text">
  Gradient text with background-clip
</h1>
```

## 🪟 Neomorphic Effects

### Inset Shadow
Creates depth with inner shadows:

```tsx
<div className="neo-inset">
  Pressed/inset appearance
</div>
```

### Outset Shadow
Raises element from background:

```tsx
<div className="neo-outset">
  Raised/floating appearance
</div>
```

### Flat Shadow
Subtle depth effect:

```tsx
<div className="neo-flat">
  Subtle neomorphic depth
</div>
```

## ✨ Holographic Effects

### Holographic Border
Animated gradient border:

```tsx
<div className="holographic-border">
  Gradient border with pseudo-element
</div>
```

### Holographic Shimmer
Rotating shimmer effect:

```tsx
<div className="holographic-shimmer">
  Rotating shimmer overlay
</div>
```

### Combined Effects
```tsx
<Card className="holographic-border holographic-shimmer glass">
  Futuristic card with all effects
</Card>
```

## 🪟 Glass Morphism

### Light Glass
Subtle blur and transparency:

```tsx
<div className="glass">
  Light frosted glass effect
</div>
```

### Strong Glass
Heavy blur and opacity:

```tsx
<div className="glass-strong">
  Strong frosted glass effect
</div>
```

### Glass Cards
```tsx
<Card className="glass neo-flat border-white/10">
  Glassmorphic card with neomorphic shadow
</Card>
```

## 💫 Glow Effects

### Static Glows

#### Cyan Glow
```tsx
<div className="glow-cyan">
  Cyan glow around element
</div>
```

#### Magenta Glow
```tsx
<div className="glow-magenta">
  Magenta glow around element
</div>
```

#### Purple Glow
```tsx
<div className="glow-purple">
  Purple glow around element
</div>
```

### Hover Glows

```tsx
<Button className="glow-hover-cyan">
  Glows cyan on hover
</Button>
```

### Animated Glow
```tsx
<div className="animate-pulse-glow">
  Pulsing glow animation
</div>
```

## 🎭 Common Patterns

### 1. Feature Card
```tsx
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  className="glass neo-flat holographic-border rounded-2xl p-6"
>
  <div className="w-12 h-12 rounded-xl aurora-gradient-1" />
  <h3>Feature Title</h3>
  <p className="text-muted-foreground">Description</p>
</motion.div>
```

### 2. Aurora Button
```tsx
<Button className="aurora-gradient-1 hover:opacity-90 transition-opacity">
  Primary Action
</Button>
```

### 3. Glass Card
```tsx
<Card className="glass border-white/10">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content with frosted glass background
  </CardContent>
</Card>
```

### 4. Status Badge
```tsx
<Badge className="bg-green-500/20 text-green-400 border-green-500/30">
  ACTIVE
</Badge>
```

### 5. Input Field
```tsx
<Input
  className="glass border-white/10 focus:border-white/20"
  placeholder="Search..."
/>
```

## 🎨 Color Usage Guide

### Text Colors
```tsx
// Primary text
<p className="text-foreground">Primary text</p>

// Muted text
<p className="text-muted-foreground">Secondary text</p>

// Aurora accent
<span className="aurora-text">Highlight</span>
```

### Background Colors
```tsx
// Default background
<div className="bg-background">Dark background</div>

// Card background
<div className="bg-card">Card background</div>

// Space gradients
<div className="bg-[hsl(var(--space-medium))]">
  Medium space background
</div>
```

### Border Colors
```tsx
// Subtle borders
<div className="border border-white/10">Subtle border</div>

// Visible borders
<div className="border border-white/20">Visible border</div>

// Aurora borders
<div className="border-2 border-[hsl(var(--aurora-cyan))]">
  Cyan border
</div>
```

## 🔧 Utility Combinations

### Interactive Card
```tsx
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  className={cn(
    "glass neo-flat holographic-border",
    "rounded-2xl p-6 cursor-pointer",
    "transition-all duration-300",
    "hover:border-white/20"
  )}
>
  Content
</motion.div>
```

### Floating Sidebar Item
```tsx
<Link href="/">
  <div className={cn(
    "flex items-center gap-3 px-3 py-3 rounded-xl",
    "transition-all duration-200",
    isActive
      ? "aurora-gradient-1 text-white"
      : "hover:bg-white/5 text-muted-foreground"
  )}>
    <Icon className="w-5 h-5" />
    <span>Label</span>
  </div>
</Link>
```

### Status Indicator
```tsx
<div className={cn(
  "flex items-center gap-2 px-3 py-1.5 rounded-full",
  "glass border",
  status === "ACTIVE"
    ? "border-green-500/30 text-green-400"
    : "border-yellow-500/30 text-yellow-400"
)}>
  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
  <span className="text-sm font-medium">{status}</span>
</div>
```

## 📱 Responsive Design

### Breakpoints
```tsx
// Mobile first approach
<div className="
  px-4 py-8          /* Mobile */
  md:px-8 md:py-12   /* Tablet */
  lg:px-12 lg:py-16  /* Desktop */
">
  Responsive content
</div>
```

### Grid Layouts
```tsx
<div className="
  grid
  grid-cols-1        /* Mobile: 1 column */
  md:grid-cols-2     /* Tablet: 2 columns */
  lg:grid-cols-3     /* Desktop: 3 columns */
  gap-6
">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Sidebar Adjustment
```tsx
<div className="
  min-h-screen
  pl-20 pr-6         /* Mobile: Collapsed sidebar */
  md:pl-28 md:pr-8   /* Desktop: Expanded sidebar */
  py-8
">
  <Content />
</div>
```

## 🎯 Accessibility

### Focus States
```tsx
<Button className="
  focus:outline-none
  focus:ring-2
  focus:ring-[hsl(var(--ring))]
  focus:ring-offset-2
  focus:ring-offset-background
">
  Accessible button
</Button>
```

### Color Contrast
All color combinations meet WCAG AA standards:
- Text on background: 14.5:1
- Muted text: 7.2:1
- Links and buttons: Clearly distinguishable

### Screen Reader Support
```tsx
<button
  className="aurora-gradient-1"
  aria-label="Create new hook"
>
  <Plus className="w-5 h-5" />
  <span className="sr-only">Create Hook</span>
</button>
```

## 🎨 Custom Utilities

### Creating New Utilities

Add to `src/app/globals.css`:

```css
/* Custom utility class */
.my-custom-effect {
  background: linear-gradient(
    135deg,
    hsl(var(--aurora-cyan)),
    hsl(var(--aurora-purple))
  );
  box-shadow: 0 0 30px hsl(var(--glow-cyan) / 0.3);
}

/* Responsive utility */
@media (min-width: 768px) {
  .my-custom-effect {
    box-shadow: 0 0 50px hsl(var(--glow-cyan) / 0.5);
  }
}
```

### Using with Tailwind Merge
```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "my-custom-effect",
  "rounded-xl p-6",
  isActive && "opacity-100",
  !isActive && "opacity-50"
)}>
  Content
</div>
```

## 📋 Styling Checklist

When styling a component:

- [ ] Use semantic color variables (not hardcoded colors)
- [ ] Apply appropriate glass/neomorphic effects
- [ ] Add hover/focus states for interactive elements
- [ ] Ensure sufficient color contrast
- [ ] Test in dark mode (our default)
- [ ] Verify responsive behavior
- [ ] Add appropriate transitions
- [ ] Use `cn()` for className merging
- [ ] Follow naming conventions
- [ ] Document custom utilities

---

**Next**: [Development Workflow](./07-development.md)

