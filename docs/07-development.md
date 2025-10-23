# Development Workflow

Complete guide to developing, building, and deploying Hookified.

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ or **Bun** (recommended)
- **Git**
- **Code Editor** (VS Code recommended)

### Initial Setup

```bash
# Clone the repository
git clone <repo-url>
cd hookified

# Install dependencies
bun install

# Run development server
bun run dev

# Open in browser
# http://localhost:3000
```

## 📦 Project Scripts

### Development
```bash
# Start dev server (hot reload)
bun run dev

# Start with turbopack
bun run dev --turbo
```

### Building
```bash
# Create production build
bun run build

# Run production server
bun run start
```

### Type Checking
```bash
# Run TypeScript compiler
bun run type-check
```

### Linting
```bash
# Run ESLint
bun run lint

# Fix auto-fixable issues
bun run lint --fix
```

## 🗂️ Project Structure

```
hookified/
├── docs/                    # Documentation
│   ├── 00-readme.md
│   ├── 01-overview.md
│   ├── 02-tailwind-v4.md
│   ├── 03-components.md
│   ├── 04-animations.md
│   ├── 05-state-management.md
│   ├── 06-styling.md
│   └── 07-development.md
│
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css      # Global styles + Tailwind
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Landing page
│   │   ├── dashboard/
│   │   ├── hook/
│   │   └── registry/
│   │
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components
│   │   ├── animations/      # Animation wrappers
│   │   ├── landing/         # Landing page
│   │   ├── dashboard/       # Dashboard
│   │   ├── hook-builder/    # Hook creation
│   │   ├── hook-detail/     # Hook details
│   │   ├── registry/        # Template registry
│   │   └── features/        # Feature components
│   │
│   ├── lib/
│   │   ├── utils.ts         # Utility functions
│   │   ├── animations.ts    # Animation configs
│   │   ├── types.ts         # TypeScript types
│   │   └── mockData.ts      # Mock data
│   │
│   └── store/
│       └── useHookStore.ts  # Zustand store
│
├── public/                  # Static assets
├── components.json          # shadcn/ui config
├── next.config.ts           # Next.js config
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

## 🛠️ Development Tools

### VS Code Extensions (Recommended)

1. **ESLint** - Linting
2. **Prettier** - Code formatting
3. **Tailwind CSS IntelliSense** - Tailwind autocomplete
4. **TypeScript Error Lens** - Inline TypeScript errors
5. **Auto Rename Tag** - Rename paired HTML/JSX tags
6. **GitLens** - Git integration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## 🎨 Creating New Components

### Step-by-Step Process

1. **Create Component Directory**
```bash
mkdir -p src/components/features/my-component
cd src/components/features/my-component
```

2. **Create Type Definitions**
```typescript
// MyComponent.types.ts
export interface MyComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}
```

3. **Create Component**
```typescript
// MyComponent.tsx
"use client";

import { motion } from "framer-motion";
import { MyComponentProps } from "./MyComponent.types";

export function MyComponent({
  title,
  description,
  onAction
}: MyComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {onAction && (
        <button onClick={onAction}>Action</button>
      )}
    </motion.div>
  );
}
```

4. **Create Barrel Export**
```typescript
// index.ts
export { MyComponent } from "./MyComponent";
export type { MyComponentProps } from "./MyComponent.types";
```

5. **Use Component**
```typescript
import { MyComponent } from "@/components/features/my-component";

<MyComponent
  title="Hello"
  description="World"
  onAction={() => console.log("Clicked")}
/>
```

## 🎭 Working with Animations

### Adding Framer Motion Animation

```typescript
import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";

export function AnimatedComponent() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      Content fades in
    </motion.div>
  );
}
```

### Adding GSAP Animation

```typescript
import { useEffect, useRef } from "react";
import gsap from "gsap";

export function GSAPComponent() {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      gsap.to(elementRef.current, {
        x: 100,
        duration: 1,
        ease: "power3.out"
      });
    }
  }, []);

  return <div ref={elementRef}>Animated</div>;
}
```

### Adding CSS Animation

```css
/* In globals.css */
@keyframes my-animation {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

.my-animated-class {
  animation: my-animation 0.3s ease;
}
```

## 🗄️ Working with State

### Adding to Zustand Store

```typescript
// src/store/useHookStore.ts

interface HookStore {
  // Add new state
  myNewState: string;

  // Add new action
  setMyNewState: (value: string) => void;
}

export const useHookStore = create<HookStore>((set) => ({
  // Initialize state
  myNewState: "",

  // Implement action
  setMyNewState: (value) => set({ myNewState: value }),
}));
```

### Using in Component

```typescript
import { useHookStore } from "@/store/useHookStore";

export function MyComponent() {
  const myNewState = useHookStore((state) => state.myNewState);
  const setMyNewState = useHookStore((state) => state.setMyNewState);

  return (
    <input
      value={myNewState}
      onChange={(e) => setMyNewState(e.target.value)}
    />
  );
}
```

## 🎨 Adding Custom Styles

### In globals.css

```css
/* Add to @theme block for theme values */
@theme {
  --color-my-color: 200 100% 50%;
}

/* Add utility classes */
.my-utility-class {
  background: linear-gradient(
    135deg,
    hsl(var(--aurora-cyan)),
    hsl(var(--my-color))
  );
}
```

### Using in Components

```tsx
<div className="my-utility-class rounded-xl p-6">
  Custom styled content
</div>
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Writing Tests

```typescript
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders title", () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("calls onAction when clicked", () => {
    const handleAction = jest.fn();
    render(<MyComponent title="Test" onAction={handleAction} />);

    screen.getByRole("button").click();
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
```

## 📱 Adding New Routes

### Creating Page

```typescript
// src/app/my-route/page.tsx
import { PageContainer } from "@/components/layout/PageContainer";
import { MyPageContent } from "@/components/my-page/MyPageContent";

export default function MyPage() {
  return (
    <PageContainer>
      <MyPageContent />
    </PageContainer>
  );
}
```

### Adding to Sidebar

```typescript
// src/components/layout/FloatingSidebar/FloatingSidebar.tsx

const navItems: NavItem[] = [
  // ... existing items
  {
    id: "my-route",
    label: "My Route",
    icon: MyIcon,
    href: "/my-route"
  },
];
```

## 🐛 Debugging

### Using Browser DevTools

1. **React DevTools** - Inspect component tree
2. **Network Tab** - Monitor API calls
3. **Console** - View logs and errors
4. **Sources** - Set breakpoints in code

### Adding Debug Logs

```typescript
// Development only logs
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}

// Or use debug library
import debug from "debug";
const log = debug("app:component");
log("Component mounted", props);
```

### Zustand DevTools

```typescript
import { devtools } from "zustand/middleware";

export const useHookStore = create(
  devtools(
    (set) => ({
      // Store implementation
    }),
    { name: "HookStore" }
  )
);
```

## 🚀 Building for Production

### Build Process

```bash
# Create optimized build
bun run build

# Test production build locally
bun run start

# Build output is in .next/ directory
```

### Build Optimization

1. **Code Splitting** - Automatic with Next.js
2. **Image Optimization** - Use Next.js Image component
3. **Tree Shaking** - Remove unused code
4. **Minification** - Automatic in production build

### Performance Checklist

- [ ] Images optimized and using Next.js Image
- [ ] Lazy load components with `next/dynamic`
- [ ] Minimize client-side JavaScript
- [ ] Use Server Components where possible
- [ ] Implement proper caching strategies
- [ ] Optimize fonts with `next/font`
- [ ] Remove console.logs in production
- [ ] Test with Lighthouse

## 🔧 Common Issues

### Issue: Tailwind classes not working

**Solution**: Check globals.css import and Tailwind v4 syntax

```css
/* Make sure you have */
@import "tailwindcss";

/* Not the old v3 syntax */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Issue: Animation not smooth

**Solution**: Use transform properties (GPU accelerated)

```tsx
// ✅ Good
<motion.div animate={{ x: 100, scale: 1.2 }} />

// ❌ Slow
<motion.div animate={{ width: 200, height: 300 }} />
```

### Issue: Component not re-rendering

**Solution**: Check Zustand selector

```typescript
// ✅ Specific selector
const hooks = useHookStore((state) => state.hooks);

// ❌ May not trigger re-render
const store = useHookStore();
```

### Issue: TypeScript errors

**Solution**: Run type check and fix errors

```bash
bun run type-check
```

## 📝 Code Style Guidelines

### Naming Conventions

- **Components**: PascalCase (`MyComponent`)
- **Files**: PascalCase for components (`MyComponent.tsx`)
- **Utilities**: camelCase (`myUtilityFunction`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS`)
- **Types**: PascalCase (`MyComponentProps`)

### Import Order

```typescript
// 1. External libraries
import { motion } from "framer-motion";
import { useState } from "react";

// 2. Internal components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 3. Utilities and types
import { cn } from "@/lib/utils";
import type { Hook } from "@/lib/types";

// 4. Styles (if any)
import "./styles.css";
```

### File Length

- Components: < 100 lines
- Utilities: < 200 lines
- If exceeding, split into smaller files

## 🎯 Best Practices

1. **Use TypeScript** - Full type coverage
2. **Keep components small** - Single responsibility
3. **Reuse code** - Create utilities and hooks
4. **Test your code** - Write unit tests
5. **Document complex logic** - Add comments
6. **Follow conventions** - Consistent style
7. **Optimize performance** - Profile and optimize
8. **Review your code** - Self-review before committing
9. **Keep dependencies updated** - Regular updates
10. **Monitor bundle size** - Keep it small

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request
# Review and merge
```

### Commit Message Format

```
feat: add new component
fix: resolve animation bug
docs: update documentation
style: format code
refactor: restructure component
test: add unit tests
chore: update dependencies
```

---

**Congratulations!** You now have all the tools to develop Hookified effectively. 🚀

For questions, refer back to the relevant documentation sections or check the codebase examples.

