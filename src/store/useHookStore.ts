import { mockHooks, mockRuns, mockTemplates } from "@/lib/mockData";
import { Hook, HookRun, Template } from "@/lib/types";
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
  setActiveHook: (hook: Hook | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: "ALL" | "ACTIVE" | "PAUSED" | "ERROR") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Computed
  getFilteredHooks: () => Hook[];
  getHookById: (id: string) => Hook | undefined;
  getRunsForHook: (hookId: string) => HookRun[];
}

export const useHookStore = create<HookStore>((set, get) => ({
  // Initial state
  hooks: mockHooks,
  activeHook: null,
  runs: mockRuns,
  templates: mockTemplates,
  searchQuery: "",
  filterStatus: "ALL",
  isSidebarOpen: true,

  // Actions
  setHooks: (hooks) => set({ hooks }),

  addHook: (hook) => set((state) => ({
    hooks: [...state.hooks, hook]
  })),

  updateHook: (id, updates) => set((state) => ({
    hooks: state.hooks.map((hook) =>
      hook.id === id ? { ...hook, ...updates, updatedAt: new Date() } : hook
    ),
  })),

  deleteHook: (id) => set((state) => ({
    hooks: state.hooks.filter((hook) => hook.id !== id),
  })),

  setActiveHook: (hook) => set({ activeHook: hook }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  toggleSidebar: () => set((state) => ({
    isSidebarOpen: !state.isSidebarOpen
  })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // Computed getters
  getFilteredHooks: () => {
    const { hooks, searchQuery, filterStatus } = get();

    return hooks.filter((hook) => {
      const matchesSearch = hook.name.toLowerCase().includes(searchQuery.toLowerCase());
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

