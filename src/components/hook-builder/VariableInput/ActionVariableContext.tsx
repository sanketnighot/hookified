"use client";

import React from 'react';
import { VariableContextProvider } from './VariableContext';

/**
 * Component that overrides the currentActionIndex in VariableContext
 * This allows each action block to see only variables from trigger + previous actions
 */
interface ActionVariableContextProps {
  children: React.ReactNode;
  actionIndex: number;
  triggerType?: string;
  triggerConfig?: any;
  actions?: Array<{
    id: string;
    type: string;
    config?: any;
    index: number;
    customName?: string;
  }>;
}

export function ActionVariableContext({
  children,
  actionIndex,
  triggerType,
  triggerConfig,
  actions = [],
}: ActionVariableContextProps) {
  return (
    <VariableContextProvider
      triggerType={triggerType}
      triggerConfig={triggerConfig}
      actions={actions}
      currentActionIndex={actionIndex}
    >
      {children}
    </VariableContextProvider>
  );
}

