import { Hook } from "@/lib/types";

export interface HookCardProps {
  hook: Hook;
  onEdit?: (hook: Hook) => void;
  onDelete?: (hookId: string) => void;
  onToggle?: (hookId: string, isActive: boolean) => void;
}

