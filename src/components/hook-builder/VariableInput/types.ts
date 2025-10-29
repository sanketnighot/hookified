/**
 * Types for variable input system
 */

export interface VariableReference {
  id: string; // Unique ID for this variable instance
  path: string; // Full path like "trigger.event.args.value"
  displayName: string; // User-friendly name like "Transfer Amount"
  source: 'trigger' | 'action' | 'builtin';
  sourceIndex?: number; // For actions, the action index (0, 1, 2...)
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'unknown';
  description?: string; // Optional description
}

export interface TemplateSegment {
  type: 'text' | 'variable';
  value: string | VariableReference;
  id: string; // Unique ID for this segment
}

export interface VariableTreeNode {
  id: string;
  name: string;
  path: string; // Full path to this node
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'unknown';
  description?: string;
  children?: VariableTreeNode[]; // Nested properties
  isLeaf: boolean; // True if no children
  source: 'trigger' | 'action' | 'builtin';
  sourceIndex?: number;
  icon?: string; // Emoji or icon identifier
}

export interface VariableContextData {
  triggerType?: string;
  triggerConfig?: any;
  actions: Array<{
    id: string;
    type: string;
    config?: any;
    index: number;
    customName?: string;
  }>;
  currentActionIndex?: number; // Index of action being configured
}

export interface VariableSchema {
  nodes: VariableTreeNode[];
  mockData: Record<string, any>; // Mock data for preview
}

