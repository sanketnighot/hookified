import { mockRuns, mockTemplates } from "@/lib/mockData";
import { ActionBlock, Hook, HookRun, Template } from "@/lib/types";
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
  draftHook: Partial<Hook> | null;

  // Actions
  fetchHooks: () => Promise<void>;
  setHooks: (hooks: Hook[]) => void;
  addHook: (hook: Hook) => void;
  updateHook: (id: string, updates: Partial<Hook>) => void;
  deleteHook: (id: string) => void;
  setActiveHook: (hook: Hook | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: "ALL" | "ACTIVE" | "PAUSED" | "ERROR") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Draft management
  setDraftHook: (draft: Partial<Hook> | null) => void;
  clearDraftHook: () => void;

  // Action management
  addActionToHook: (hookId: string, action: ActionBlock) => void;
  updateActionInHook: (
    hookId: string,
    actionId: string,
    updates: Partial<ActionBlock>
  ) => void;
  removeActionFromHook: (hookId: string, actionId: string) => void;
  reorderActionsInHook: (
    hookId: string,
    fromIndex: number,
    toIndex: number
  ) => void;

  // Computed
  getFilteredHooks: () => Hook[];
  getHookById: (id: string) => Hook | undefined;
  getRunsForHook: (hookId: string) => HookRun[];
}

export const useHookStore = create<HookStore>((set, get) => ({
  // Initial state
  hooks: [],
  activeHook: null,
  runs: mockRuns,
  templates: mockTemplates,
  searchQuery: "",
  filterStatus: "ALL",
  isSidebarOpen: true,
  draftHook: null,

  // Actions
  fetchHooks: async () => {
    try {
      const response = await fetch("/api/hooks");
      if (!response.ok) {
        throw new Error("Failed to fetch hooks");
      }
      const data = await response.json();
      set({ hooks: data.hooks || [] });
    } catch (error) {
      console.error("Error fetching hooks:", error);
      // Keep existing hooks on error
    }
  },

  setHooks: (hooks) => set({ hooks }),

  addHook: (hook) =>
    set((state) => ({
      hooks: [...state.hooks, hook],
    })),

  updateHook: (id, updates) =>
    set((state) => ({
      hooks: state.hooks.map((hook) =>
        hook.id === id ? { ...hook, ...updates, updatedAt: new Date() } : hook
      ),
    })),

  deleteHook: (id) =>
    set((state) => ({
      hooks: state.hooks.filter((hook) => hook.id !== id),
    })),

  setActiveHook: (hook) => set({ activeHook: hook }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // Draft management
  setDraftHook: (draft) => set({ draftHook: draft }),

  clearDraftHook: () => set({ draftHook: null }),

  // Action management
  addActionToHook: (hookId, action) =>
    set((state) => ({
      hooks: state.hooks.map((hook) =>
        hook.id === hookId
          ? {
              ...hook,
              actions: [...(hook.actions || []), action],
              updatedAt: new Date(),
            }
          : hook
      ),
    })),

  updateActionInHook: (hookId, actionId, updates) =>
    set((state) => ({
      hooks: state.hooks.map((hook) =>
        hook.id === hookId
          ? {
              ...hook,
              actions:
                hook.actions?.map((action) =>
                  action.id === actionId ? { ...action, ...updates } : action
                ) || [],
              updatedAt: new Date(),
            }
          : hook
      ),
    })),

  removeActionFromHook: (hookId, actionId) =>
    set((state) => ({
      hooks: state.hooks.map((hook) =>
        hook.id === hookId
          ? {
              ...hook,
              actions:
                hook.actions?.filter((action) => action.id !== actionId) || [],
              updatedAt: new Date(),
            }
          : hook
      ),
    })),

  reorderActionsInHook: (hookId, fromIndex, toIndex) =>
    set((state) => ({
      hooks: state.hooks.map((hook) => {
        if (hook.id !== hookId || !hook.actions) return hook;

        const newActions = [...hook.actions];
        const [movedAction] = newActions.splice(fromIndex, 1);
        newActions.splice(toIndex, 0, movedAction);

        return {
          ...hook,
          actions: newActions.map((action, index) => ({
            ...action,
            order: index,
          })),
          updatedAt: new Date(),
        };
      }),
    })),

  // Computed getters
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
  },

  getHookById: (id) => {
    return get().hooks.find((hook) => hook.id === id);
  },

  getRunsForHook: (hookId) => {
    return get().runs.filter((run) => run.hookId === hookId);
  },
}));
