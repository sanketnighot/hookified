# Hookified - Futuristic Frontend

A next-generation blockchain automation platform with an innovative, aurora-themed UI built for 2050 and beyond.

## 🎨 Design System

### Theme
- **Style**: Neomorphism with holographic accents
- **Color Palette**: Aurora theme with deep space backgrounds
  - Base: Deep space (#0a0a0f, #121218, #1a1a24)
  - Accents: Cyan to magenta gradients, purple to pink, blue to violet
  - Effects: Holographic borders, iridescent reflections, soft glows

### Typography
- **Primary**: Inter - Modern, geometric sans-serif
- **Mono**: JetBrains Mono - Technical elements and code

### Animation Philosophy
- GSAP for complex, physics-based animations
- Framer Motion for component micro-interactions
- CSS for efficient shimmer and glow effects
- All animations respect user preferences

## 🗂️ Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page (/)
│   ├── dashboard/                # Dashboard route (/dashboard)
│   ├── hook/                     # Create hook (/hook)
│   │   └── [id]/                 # Hook detail (/hook/[id])
│   └── registry/                 # Templates (/registry)
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/                   # Layout components
│   │   ├── FloatingSidebar/      # Morphing navigation sidebar
│   │   └── PageContainer/        # Page wrapper with animations
│   ├── animations/               # Animation wrappers
│   │   └── FadeIn/               # Reusable fade-in component
│   ├── landing/                  # Landing page components
│   │   ├── HeroSection/          # Hero with particle effects
│   │   ├── HolographicCard/      # 3D feature cards
│   │   └── FeatureShowcase/      # Features grid
│   ├── dashboard/                # Dashboard components
│   │   ├── DashboardHeader/      # Header with search
│   │   ├── DashboardGrid/        # Stats and hooks grid
│   │   ├── StatsCard/            # Animated stat cards
│   │   └── HooksList/            # Filterable hooks list
│   ├── hook-builder/             # Hook creation wizard
│   │   ├── HookWizard/           # Multi-step wizard
│   │   ├── WizardSteps/          # Progress indicator
│   │   ├── TriggerSelector/      # Trigger type picker
│   │   ├── ActionSelector/       # Action type picker
│   │   └── FlowBuilder/          # Visual flow configuration
│   ├── hook-detail/              # Hook detail view
│   │   ├── HookDetailView/       # Main detail container
│   │   ├── HookHeader/           # Hook title and actions
│   │   ├── MetricsPanel/         # Execution metrics
│   │   └── ExecutionTimeline/    # Run history timeline
│   ├── features/                 # Feature-specific components
│   │   └── hook-card/            # Reusable hook card
│   └── registry/                 # Template registry
│       ├── RegistryView/         # Registry container
│       ├── TemplateGrid/         # Templates grid
│       └── TemplateCard/         # Template card with copy
│
├── lib/
│   ├── utils.ts                  # Utility functions (cn, etc.)
│   ├── animations.ts             # Animation configurations
│   ├── types.ts                  # TypeScript interfaces
│   └── mockData.ts               # Mock data for development
│
└── store/
    └── useHookStore.ts           # Zustand state management
```

## 🚀 Features by Route

### 1. Landing Page (/)
- **Hero Section**: Full-viewport hero with animated aurora gradients
- **Particle Background**: Floating orbs with GSAP animations
- **Feature Showcase**: Grid of holographic cards with hover effects
- **Smooth Scrolling**: Scroll-triggered animations throughout

### 2. Dashboard (/dashboard)
- **Stats Cards**: Animated metrics with count-up effects
- **Hooks List**: Virtualized, filterable list of user hooks
- **Tab Filters**: Filter by status (All, Active, Paused, Error)
- **Search**: Real-time search across hook names
- **Quick Actions**: Floating action button for common tasks

### 3. Create Hook (/hook)
- **Multi-Step Wizard**: Three-step process with progress indicator
  1. Select Trigger (Onchain, Cron, Manual, Webhook)
  2. Select Action (Telegram, Webhook, Chain, Contract Call)
  3. Configure (Visual flow builder with forms)
- **Morphing Progress**: Animated step indicator with gradient fills
- **Form Validation**: Real-time validation with error states
- **Success Animation**: Celebration animation on hook creation

### 4. Hook Detail (/hook/[id])
- **Header**: Hook name, status badge, and action buttons
- **Metrics Panel**: Success rate, total runs, avg duration
- **Execution Timeline**: Chronological list of all runs
- **Edit Mode**: Toggle between view and edit modes
- **Delete Confirmation**: Animated modal for destructive actions

### 5. Registry (/registry)
- **Search**: Instant search across template names and descriptions
- **Template Grid**: Responsive grid of pre-built templates
- **Category Badges**: Color-coded template categories
- **Popularity Indicators**: Social proof with usage stats
- **One-Click Copy**: Duplicate templates to workspace with animation

## 🎯 Component Guidelines

### File Size Management
Each component is split to maintain < 100 lines per file:
- `Component.tsx` - JSX and component logic (< 100 lines)
- `Component.types.ts` - TypeScript interfaces
- `Component.animations.ts` - Framer Motion variants (if complex)
- `index.ts` - Clean exports

### Example: HookCard Structure
```
hook-card/
├── HookCard.tsx          # Main component (50 lines)
├── HookCard.types.ts     # Interfaces (20 lines)
└── index.ts              # Export
```

## 🎨 Custom Utility Classes

### Aurora Gradients
```tsx
className="aurora-gradient-1"  // Cyan to magenta
className="aurora-gradient-2"  // Purple to pink
className="aurora-gradient-3"  // Blue to violet
className="aurora-text"         // Gradient text
```

### Neomorphic Effects
```tsx
className="neo-inset"   // Inset shadow
className="neo-outset"  // Raised shadow
className="neo-flat"    // Subtle depth
```

### Holographic Effects
```tsx
className="holographic-border"   // Gradient border
className="holographic-shimmer"  // Animated shimmer
```

### Glass Morphism
```tsx
className="glass"         // Light glass
className="glass-strong"  // Heavy glass with blur
```

### Glow Effects
```tsx
className="glow-cyan"          // Static cyan glow
className="glow-hover-cyan"    // Glow on hover
className="animate-pulse-glow" // Pulsing glow
```

## 📦 State Management

### Zustand Store (`useHookStore`)
```typescript
// Access hooks
const { hooks, getFilteredHooks } = useHookStore();

// CRUD operations
const { addHook, updateHook, deleteHook } = useHookStore();

// UI state
const { searchQuery, setSearchQuery, filterStatus } = useHookStore();
```

### Mock Data
All data is currently mocked in `src/lib/mockData.ts`:
- `mockHooks` - Sample hook configurations
- `mockRuns` - Execution history
- `mockTemplates` - Template registry
- `mockAnalytics` - Dashboard statistics

**Ready for Backend Integration**: Simply replace mock functions with API calls.

## 🎭 Animation Patterns

### Page Transitions
```tsx
import { fadeInVariants } from "@/lib/animations";

<motion.div
  initial="hidden"
  animate="visible"
  variants={fadeInVariants}
>
```

### Staggered Lists
```tsx
import { staggerContainerVariants, slideUpVariants } from "@/lib/animations";

<motion.div variants={staggerContainerVariants}>
  {items.map((item) => (
    <motion.div key={item.id} variants={slideUpVariants}>
      {item}
    </motion.div>
  ))}
</motion.div>
```

### Hover Effects
```tsx
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  transition={{ duration: 0.2 }}
>
```

## 🔧 Development

### Install Dependencies
```bash
bun install
```

### Run Development Server
```bash
bun run dev
```

### Build for Production
```bash
bun run build
```

### Start Production Server
```bash
bun run start
```

## 🎨 Key Design Decisions

### Why Neomorphism + Holographic?
- **Depth without shadows**: Soft, organic feel of neomorphism
- **Futuristic edge**: Holographic accents add sci-fi aesthetic
- **High contrast**: Works beautifully in dark mode
- **Performance**: CSS-based effects are GPU-accelerated

### Why Floating Sidebar?
- **Space efficient**: Maximizes content area
- **Contextual**: Can morph based on route
- **Accessible**: Always visible, keyboard navigable
- **Modern**: Breaks from traditional top/side nav patterns

### Why Multi-Step Wizard?
- **Reduced cognitive load**: One decision at a time
- **Visual feedback**: Clear progress indication
- **Flexibility**: Easy to add/remove steps
- **Mobile-friendly**: Works well on small screens

### Why Aurora Theme?
- **Distinctive**: Stands out from typical crypto UIs
- **Energetic**: Vibrant gradients convey innovation
- **Readable**: High contrast maintains accessibility
- **Timeless**: Inspired by natural phenomena

## 🚀 Next Steps for Backend Integration

1. **Replace Mock Data**
   - Update `src/lib/mockData.ts` to call real APIs
   - Keep interfaces in `src/lib/types.ts` as contract

2. **Add API Layer**
   - Create `src/services/api.ts` for all API calls
   - Use React Query or SWR for data fetching
   - Add loading and error states

3. **Authentication**
   - Integrate wallet connect (RainbowKit, ConnectKit)
   - Add protected route middleware
   - Update FloatingSidebar with user menu

4. **Real-time Updates**
   - WebSocket connection for hook executions
   - Toast notifications for events
   - Optimistic UI updates

5. **Enhanced Flow Builder**
   - Implement actual drag-and-drop with @dnd-kit
   - Add node connections with SVG paths
   - Save/restore flow state

## 📝 Notes

- All components use TypeScript for type safety
- Every component has proper prop validation
- Animations respect `prefers-reduced-motion`
- Dark mode is default (theme is dark-optimized)
- Mobile-responsive with Tailwind breakpoints
- Accessibility features (ARIA labels, keyboard nav)

## 🎯 Innovation Highlights

1. **Morphing Navigation**: Sidebar that adapts to context
2. **Aurora Gradients**: Distinctive color system
3. **Neomorphic Glass**: Soft depth with transparency
4. **Micro-interactions**: Every element responds to user
5. **Particle Effects**: GSAP-powered ambient animations
6. **Wizard Flow**: Guided creation experience
7. **Timeline View**: Chronological execution history
8. **Template System**: Copy-paste automation
9. **Real-time Search**: Instant filtering everywhere
10. **Smooth Transitions**: Framer Motion page changes

---

Built with ❤️ using Next.js 15, React 19, Tailwind CSS 4, Framer Motion, GSAP, and shadcn/ui.

