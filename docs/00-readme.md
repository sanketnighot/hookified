# Hookified Documentation

Welcome to the Hookified documentation! This guide will help you understand, develop, and extend the futuristic blockchain automation platform.

## 📚 Documentation Structure

1. **[Overview](./01-overview.md)** - Complete frontend architecture and features
2. **[Tailwind CSS v4 Guide](./02-tailwind-v4.md)** - CSS-first configuration approach
3. **[Component Architecture](./03-components.md)** - Component structure and patterns
4. **[Animation System](./04-animations.md)** - GSAP, Framer Motion, and CSS animations
5. **[State Management](./05-state-management.md)** - Zustand store and data flow
6. **[Styling Guide](./06-styling.md)** - Aurora theme and utility classes
7. **[Development Workflow](./07-development.md)** - Setup, building, and best practices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd hookified

# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

### Project Structure
```
hookified/
├── docs/                    # Documentation
├── src/
│   ├── app/                 # Next.js routes
│   ├── components/          # React components
│   ├── lib/                 # Utilities and helpers
│   └── store/               # Zustand state management
└── public/                  # Static assets
```

## 🎨 Design Philosophy

Hookified features a **futuristic aurora-themed interface** with:
- 🌌 Deep space backgrounds with vibrant gradients
- ✨ Holographic borders and shimmer effects
- 🪟 Neomorphic glass morphism
- 🎭 Smooth GSAP and Framer Motion animations
- 🎯 Minimal, user-friendly UX

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 (CSS-first)
- **Components**: shadcn/ui
- **Animations**: GSAP + Framer Motion
- **State**: Zustand
- **Icons**: Lucide React
- **Language**: TypeScript

## 📖 Key Concepts

### Routes
- `/` - Landing page with hero and features
- `/dashboard` - Command center with stats and hooks
- `/hook` - Multi-step hook creation wizard
- `/hook/[id]` - Individual hook details and history
- `/registry` - Template gallery with search

### Components
All components follow these principles:
- ✅ Under 100 lines per file
- ✅ Separated types and logic
- ✅ Reusable and composable
- ✅ Accessible and responsive

### Animations
Three-layer animation system:
1. **GSAP** - Complex physics-based animations
2. **Framer Motion** - Component micro-interactions
3. **CSS** - Efficient shimmer and glow effects

## 🤝 Contributing

### Code Style
- Use TypeScript for type safety
- Follow the component structure guidelines
- Keep files under 100 lines
- Write self-documenting code
- Add comments only for complex logic

### Testing
```bash
# Run linter
bun run lint

# Run type check
bun run type-check

# Build to verify
bun run build
```

## 📝 Next Steps

1. Read the [Overview](./01-overview.md) for complete feature documentation
2. Check [Tailwind v4 Guide](./02-tailwind-v4.md) for styling approach
3. Review [Component Architecture](./03-components.md) for patterns
4. Explore [Animation System](./04-animations.md) for smooth transitions

## 🆘 Support

For questions or issues:
- Check the documentation in this folder
- Review component examples in `src/components`
- Look at mock data in `src/lib/mockData.ts`

---

**Built with ❤️ for the future of blockchain automation**

