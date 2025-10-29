"use client";

import { buildVariableSchema } from '@/lib/variables/schemaBuilder';
import React, { createContext, useContext, useMemo } from 'react';
import { VariableContextData, VariableTreeNode } from './types';

interface VariableContextValue {
  context: VariableContextData;
  variables: VariableTreeNode[];
  getVariableByPath: (path: string) => VariableTreeNode | null;
}

const VariableContext = createContext<VariableContextValue | null>(null);

interface VariableContextProviderProps {
  children: React.ReactNode;
  triggerType?: string;
  triggerConfig?: any;
  actions?: Array<{
    id: string;
    type: string;
    config?: any;
    index: number;
    customName?: string;
  }>;
  currentActionIndex?: number;
}

export function VariableContextProvider({
  children,
  triggerType,
  triggerConfig,
  actions = [],
  currentActionIndex,
}: VariableContextProviderProps) {
  const contextData: VariableContextData = useMemo(
    () => ({
      triggerType,
      triggerConfig,
      actions,
      currentActionIndex,
    }),
    [triggerType, triggerConfig, actions, currentActionIndex]
  );

  const variables = useMemo(() => {
    return buildVariableSchema(contextData);
  }, [contextData]);

  const getVariableByPath = (path: string): VariableTreeNode | null => {
    // Recursive search through variable tree
    const search = (nodes: VariableTreeNode[]): VariableTreeNode | null => {
      for (const node of nodes) {
        if (node.path === path) {
          return node;
        }
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    return search(variables);
  };

  const value: VariableContextValue = useMemo(
    () => ({
      context: contextData,
      variables,
      getVariableByPath,
    }),
    [contextData, variables, getVariableByPath]
  );

  return (
    <VariableContext.Provider value={value}>{children}</VariableContext.Provider>
  );
}

export function useVariableContext(): VariableContextValue {
  const context = useContext(VariableContext);
  if (!context) {
    throw new Error('useVariableContext must be used within VariableContextProvider');
  }
  return context;
}

