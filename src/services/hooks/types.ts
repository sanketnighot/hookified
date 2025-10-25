import { Hook } from "@/lib/types";

export interface CreateHookInput {
  userId: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: any;
  actions: any[];
}

export interface UpdateHookInput {
  name?: string;
  description?: string;
  triggerType?: string;
  triggerConfig?: any;
  actions?: any[];
  status?: string;
  isActive?: boolean;
}

export interface HookWithRuns extends Hook {
  runs?: any[];
}
