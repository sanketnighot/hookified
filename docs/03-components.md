# Component Architecture

Complete guide to the Hookified component system and patterns.

## 📐 Component Structure

### File Organization
Every component follows this structure:

```
ComponentName/
├── ComponentName.tsx       # Main component (< 100 lines)
├── ComponentName.types.ts  # TypeScript interfaces
├── ComponentName.test.tsx  # Tests (optional)
└── index.ts                # Clean exports
```

### Example: HookCard
```typescript
// HookCard.types.ts
export interface HookCardProps {
  hook: Hook;
  onEdit?: (hook: Hook) => void;
  onDelete?: (hookId: string) => void;
}

// HookCard.tsx
export function HookCard({ hook, onEdit, onDelete }: HookCardProps) {
  // Component logic (< 100 lines)
}

// index.ts
export { HookCard } from "./HookCard";
export type { HookCardProps } from "./HookCard.types";
```

## 🗂️ Component Categories

### 1. UI Components (`/components/ui/`)
Base shadcn/ui components with custom styling:

```typescript
// Button
import { Button } from "@/components/ui/button";
<Button className="aurora-gradient-1">Click</Button>

// Card
import { Card } from "@/components/ui/card";
<Card className="glass neo-flat">Content</Card>

// Input
import { Input } from "@/components/ui/input";
<Input className="glass border-white/10" />
```

### 2. Layout Components (`/components/layout/`)

#### FloatingSidebar
Contextual morphing navigation:

```typescript
import { FloatingSidebar } from "@/components/layout/FloatingSidebar";

// Features:
// - Expands on hover
// - Active route highlighting
// - Smooth GSAP animations
// - Aurora gradient for active state
```

#### PageContainer
Consistent page wrapper:

```typescript
import { PageContainer } from "@/components/layout/PageContainer";

export default function Page() {
  return (
    <PageContainer>
      <YourContent />
    </PageContainer>
  );
}
```

### 3. Animation Wrappers (`/components/animations/`)

#### FadeIn
Simple fade-in animation:

```typescript
import { FadeIn } from "@/components/animations/FadeIn";

<FadeIn delay={0.2}>
  <YourComponent />
</FadeIn>
```

### 4. Feature Components (`/components/features/`)

#### HookCard
Display hook with status and actions:

```typescript
import { HookCard } from "@/components/features/hook-card";

<HookCard
  hook={hook}
  onToggle={(id, active) => handleToggle(id, active)}
/>
```

### 5. Landing Components (`/components/landing/`)

#### HeroSection
Full-viewport hero with animations:

```typescript
import { HeroSection } from "@/components/landing/HeroSection";

// Features:
// - Animated gradient background
// - Floating orbs with GSAP
// - Aurora text gradient
// - Smooth CTAs
```

#### HolographicCard
Feature card with 3D effects:

```typescript
import { HolographicCard } from "@/components/landing/HolographicCard";

<HolographicCard
  icon={Zap}
  title="Feature"
  description="Description"
/>
```

### 6. Dashboard Components (`/components/dashboard/`)

#### StatsCard
Animated statistics display:

```typescript
import { StatsCard } from "@/components/dashboard/StatsCard";

<StatsCard
  title="Total Hooks"
  value={12}
  icon={Zap}
  trend={{ value: 12, isPositive: true }}
/>
```

#### HooksList
Filterable hooks grid:

```typescript
import { HooksList } from "@/components/dashboard/HooksList";

// Features:
// - Tab filtering (All, Active, Paused, Error)
// - Search integration with Zustand
// - Staggered animations
// - Grid layout
```

### 7. Hook Builder Components (`/components/hook-builder/`)

#### HookWizard
Multi-step creation wizard:

```typescript
import { HookWizard } from "@/components/hook-builder/HookWizard";

// Steps:
// 1. Select Trigger
// 2. Select Action
// 3. Configure Flow
```

#### WizardSteps
Animated progress indicator:

```typescript
import { WizardSteps } from "@/components/hook-builder/WizardSteps";

<WizardSteps
  steps={[
    { id: 1, name: "Trigger", description: "..." },
    { id: 2, name: "Action", description: "..." },
  ]}
  currentStep={1}
/>
```

## 🎨 Component Patterns

### 1. Motion Components
All interactive components use Framer Motion:

```typescript
import { motion } from "framer-motion";

<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  transition={{ duration: 0.2 }}
>
  <Card>Content</Card>
</motion.div>
```

### 2. Staggered Lists
Use stagger animations for lists:

```typescript
import { motion } from "framer-motion";
import { staggerContainerVariants, slideUpVariants } from "@/lib/animations";

<motion.div
  variants={staggerContainerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={slideUpVariants}>
      <ItemCard item={item} />
    </motion.div>
  ))}
</motion.div>
```

### 3. Conditional Rendering
Use proper TypeScript guards:

```typescript
interface Props {
  data?: DataType;
  isLoading: boolean;
}

export function Component({ data, isLoading }: Props) {
  if (isLoading) return <Skeleton />;
  if (!data) return <EmptyState />;

  return <DataDisplay data={data} />;
}
```

### 4. Event Handlers
Type all event handlers:

```typescript
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  // Handle click
};

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setQuery(event.target.value);
};
```

## 🎯 Best Practices

### 1. Component Size
- Keep components under 100 lines
- Extract complex logic to hooks or utilities
- Split large components into smaller ones

### 2. Props Interface
```typescript
// ✅ Good - Explicit interface
interface CardProps {
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

// ❌ Bad - Inline type
function Card(props: { title: string; description?: string }) {
  // ...
}
```

### 3. Default Props
```typescript
interface Props {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
}

export function Component({
  size = "md",
  variant = "default"
}: Props) {
  // Use defaults
}
```

### 4. Children Pattern
```typescript
interface Props {
  children: React.ReactNode;
  className?: string;
}

export function Wrapper({ children, className }: Props) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  );
}
```

### 5. Compound Components
```typescript
// Parent component
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

// Sub-components
Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>;
};

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

### 6. Forwarding Refs
```typescript
import { forwardRef } from "react";

interface Props {
  value: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ value, ...props }, ref) => {
    return <input ref={ref} value={value} {...props} />;
  }
);

Input.displayName = "Input";
```

## 🔌 Integration Examples

### With Zustand Store
```typescript
import { useHookStore } from "@/store/useHookStore";

export function HooksList() {
  const { hooks, searchQuery, setSearchQuery } = useHookStore();

  return (
    <div>
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {hooks.map((hook) => (
        <HookCard key={hook.id} hook={hook} />
      ))}
    </div>
  );
}
```

### With Next.js Router
```typescript
import { useRouter } from "next/navigation";

export function NavigationButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");
  };

  return <Button onClick={handleClick}>Go to Dashboard</Button>;
}
```

### With Toast Notifications
```typescript
import { toast } from "sonner";

export function ActionButton() {
  const handleClick = async () => {
    try {
      await performAction();
      toast.success("Action completed!");
    } catch (error) {
      toast.error("Action failed");
    }
  };

  return <Button onClick={handleClick}>Perform Action</Button>;
}
```

## 🧪 Testing Components

```typescript
import { render, screen } from "@testing-library/react";
import { HookCard } from "./HookCard";

describe("HookCard", () => {
  const mockHook = {
    id: "1",
    name: "Test Hook",
    status: "ACTIVE",
    // ... other props
  };

  it("renders hook name", () => {
    render(<HookCard hook={mockHook} />);
    expect(screen.getByText("Test Hook")).toBeInTheDocument();
  });

  it("shows status badge", () => {
    render(<HookCard hook={mockHook} />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });
});
```

## 📦 Component Checklist

When creating a new component:

- [ ] Create component directory with proper structure
- [ ] Define TypeScript interfaces in `.types.ts`
- [ ] Keep main component under 100 lines
- [ ] Add proper prop documentation
- [ ] Use cn() for className merging
- [ ] Add motion animations where appropriate
- [ ] Test responsive behavior
- [ ] Verify accessibility (ARIA, keyboard nav)
- [ ] Export cleanly from index.ts
- [ ] Document any special usage patterns

---

**Next**: [Animation System](./04-animations.md)

