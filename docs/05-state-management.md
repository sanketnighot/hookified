# State Management

Guide to Zustand store and data flow in Hookified.

## 🗄️ Store Architecture

We use **Zustand** for global state management - a lightweight alternative to Redux with a simpler API.

### Why Zustand?

- ✅ Minimal boilerplate
- ✅ TypeScript-first
- ✅ No providers needed
- ✅ Excellent performance
- ✅ DevTools support
- ✅ Easy to test

## 📦 Main Store (`useHookStore`)

Located in `src/store/useHookStore.ts`:

```typescript
import { create } from "zustand";

interface HookStore {
  // State
  hooks: Hook[];
  activeHook: Hook | null;
  runs: HookRun[];
  templates: Template[];
  searchQuery: string;
  filterStatus: "ALL" | "ACTIVE" | "PAUSED" | "ERROR";
  isSidebarOpen: boolean;

  // Actions
  setHooks: (hooks: Hook[]) => void;
  addHook: (hook: Hook) => void;
  updateHook: (id: string, updates: Partial<Hook>) => void;
  deleteHook: (id: string) => void;

  // Computed
  getFilteredHooks: () => Hook[];
  getHookById: (id: string) => Hook | undefined;
  getRunsForHook: (hookId: string) => HookRun[];
}
```

## 🎯 Using the Store

### 1. Basic Usage
```typescript
import { useHookStore } from "@/store/useHookStore";

export function Component() {
  const hooks = useHookStore((state) => state.hooks);
  const addHook = useHookStore((state) => state.addHook);

  return (
    <div>
      {hooks.map(hook => <HookCard key={hook.id} hook={hook} />)}
      <Button onClick={() => addHook(newHook)}>Add</Button>
    </div>
  );
}
```

### 2. Multiple Selectors
```typescript
export function Dashboard() {
  const { hooks, searchQuery, setSearchQuery } = useHookStore();

  return (
    <div>
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {hooks.map(hook => <HookCard key={hook.id} hook={hook} />)}
    </div>
  );
}
```

### 3. Computed Values
```typescript
export function FilteredList() {
  const getFilteredHooks = useHookStore((state) => state.getFilteredHooks);
  const filteredHooks = getFilteredHooks();

  return (
    <div>
      {filteredHooks.map(hook => <HookCard key={hook.id} hook={hook} />)}
    </div>
  );
}
```

### 4. Actions
```typescript
export function HookActions({ hookId }: { hookId: string }) {
  const updateHook = useHookStore((state) => state.updateHook);
  const deleteHook = useHookStore((state) => state.deleteHook);

  const handlePause = () => {
    updateHook(hookId, { isActive: false, status: "PAUSED" });
  };

  const handleDelete = () => {
    if (confirm("Delete?")) {
      deleteHook(hookId);
    }
  };

  return (
    <div>
      <Button onClick={handlePause}>Pause</Button>
      <Button onClick={handleDelete}>Delete</Button>
    </div>
  );
}
```

## 📊 State Structure

### Hooks Collection
```typescript
hooks: Hook[] = [
  {
    id: "hook-1",
    userId: "user-1",
    name: "Whale Alert Notifier",
    description: "Get notified when large USDC transfers occur",
    triggerType: "ONCHAIN",
    triggerConfig: { ... },
    actionConfig: { ... },
    status: "ACTIVE",
    isActive: true,
    createdAt: Date,
    updatedAt: Date,
    lastExecutedAt?: Date,
  },
  // ... more hooks
]
```

### Runs Collection
```typescript
runs: HookRun[] = [
  {
    id: "run-1",
    hookId: "hook-1",
    status: "SUCCESS",
    triggeredAt: Date,
    completedAt: Date,
    error?: string,
    meta?: { ... },
  },
  // ... more runs
]
```

### UI State
```typescript
searchQuery: string = "";
filterStatus: "ALL" | "ACTIVE" | "PAUSED" | "ERROR" = "ALL";
isSidebarOpen: boolean = true;
```

## 🔄 Data Flow

### Reading Data
```typescript
// 1. Component reads from store
const hooks = useHookStore((state) => state.hooks);

// 2. Re-renders when data changes
// Zustand uses shallow equality check
```

### Updating Data
```typescript
// 1. Component calls action
const addHook = useHookStore((state) => state.addHook);
addHook(newHook);

// 2. Store updates state
set((state) => ({
  hooks: [...state.hooks, newHook]
}))

// 3. Components re-render
```

### Computed Values
```typescript
// Define computed getter
getFilteredHooks: () => {
  const { hooks, searchQuery, filterStatus } = get();

  return hooks.filter((hook) => {
    const matchesSearch = hook.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "ALL" || hook.status === filterStatus;

    return matchesSearch && matchesFilter;
  });
}

// Use in component
const filteredHooks = useHookStore((state) => state.getFilteredHooks());
```

## 🎨 Patterns

### 1. Optimistic Updates
```typescript
export function useOptimisticHook() {
  const updateHook = useHookStore((state) => state.updateHook);

  const toggleActive = async (hookId: string, isActive: boolean) => {
    // Optimistic update
    updateHook(hookId, {
      isActive,
      status: isActive ? "ACTIVE" : "PAUSED"
    });

    try {
      // API call
      await api.updateHook(hookId, { isActive });
      toast.success("Updated!");
    } catch (error) {
      // Revert on error
      updateHook(hookId, {
        isActive: !isActive,
        status: !isActive ? "ACTIVE" : "PAUSED"
      });
      toast.error("Failed to update");
    }
  };

  return { toggleActive };
}
```

### 2. Batched Updates
```typescript
// Update multiple hooks at once
const batchUpdate = (updates: Array<{ id: string; changes: Partial<Hook> }>) => {
  set((state) => ({
    hooks: state.hooks.map((hook) => {
      const update = updates.find((u) => u.id === hook.id);
      return update ? { ...hook, ...update.changes } : hook;
    }),
  }));
};
```

### 3. Middleware Pattern
```typescript
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useHookStore = create(
  devtools(
    (set, get) => ({
      // Store implementation
    }),
    { name: "HookStore" }
  )
);
```

### 4. Persistence
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "settings-storage" }
  )
);
```

## 🧪 Testing the Store

```typescript
import { renderHook, act } from "@testing-library/react";
import { useHookStore } from "./useHookStore";

describe("useHookStore", () => {
  beforeEach(() => {
    // Reset store
    useHookStore.setState({ hooks: [] });
  });

  it("adds a hook", () => {
    const { result } = renderHook(() => useHookStore());

    act(() => {
      result.current.addHook(mockHook);
    });

    expect(result.current.hooks).toHaveLength(1);
    expect(result.current.hooks[0]).toEqual(mockHook);
  });

  it("filters hooks by search query", () => {
    const { result } = renderHook(() => useHookStore());

    act(() => {
      result.current.addHook({ ...mockHook, name: "Test Hook" });
      result.current.setSearchQuery("test");
    });

    const filtered = result.current.getFilteredHooks();
    expect(filtered).toHaveLength(1);
  });
});
```

## 📝 Mock Data Integration

Currently using mock data from `src/lib/mockData.ts`:

```typescript
import { mockHooks, mockRuns, mockTemplates } from "@/lib/mockData";

export const useHookStore = create<HookStore>((set, get) => ({
  // Initialize with mock data
  hooks: mockHooks,
  runs: mockRuns,
  templates: mockTemplates,
  // ... rest of store
}));
```

### Replacing with Real API

```typescript
// Before (mock)
addHook: (hook) => set((state) => ({
  hooks: [...state.hooks, hook]
}));

// After (real API)
addHook: async (hook) => {
  try {
    const newHook = await api.createHook(hook);
    set((state) => ({
      hooks: [...state.hooks, newHook]
    }));
    toast.success("Hook created!");
  } catch (error) {
    toast.error("Failed to create hook");
    throw error;
  }
};
```

## 🚀 Performance Tips

### 1. Selective Subscriptions
```typescript
// ✅ Good - Only subscribes to hooks
const hooks = useHookStore((state) => state.hooks);

// ❌ Avoid - Subscribes to entire store
const store = useHookStore();
```

### 2. Shallow Equality
```typescript
import { shallow } from "zustand/shallow";

// Prevents re-render if array contents are same
const hooks = useHookStore(
  (state) => state.hooks,
  shallow
);
```

### 3. Split Large Stores
```typescript
// Instead of one large store:
// useAppStore

// Use multiple focused stores:
useHookStore();      // Hooks data
useUIStore();        // UI state
useAuthStore();      // Auth state
```

### 4. Memoize Selectors
```typescript
import { useMemo } from "react";

const selector = useMemo(
  () => (state) => state.hooks.filter(h => h.isActive),
  []
);

const activeHooks = useHookStore(selector);
```

## 🎯 Best Practices

1. **Keep state flat** - Avoid deep nesting
2. **Use computed values** - For derived state
3. **Selective updates** - Update only what changed
4. **Type everything** - Full TypeScript coverage
5. **Test store logic** - Unit test actions and getters
6. **Document actions** - Clear JSDoc comments
7. **Handle errors** - Try/catch in async actions
8. **Optimistic UI** - Update UI immediately
9. **Toast feedback** - Show success/error messages
10. **DevTools integration** - Use Zustand DevTools

---

**Next**: [Styling Guide](./06-styling.md)

