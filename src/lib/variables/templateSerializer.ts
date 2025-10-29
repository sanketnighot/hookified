/**
 * Serialization utilities for converting between visual template format and string format
 */

import { TemplateSegment, VariableReference } from '@/components/hook-builder/VariableInput/types';

/**
 * Parse a template string into segments
 * Example: "Transfer of {trigger.value} from {trigger.from}"
 */
export function parseTemplate(template: string): TemplateSegment[] {
  if (!template) return [];

  const segments: TemplateSegment[] = [];
  const regex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match;
  let segmentId = 0;

  while ((match = regex.exec(template)) !== null) {
    // Add text before variable
    if (match.index > lastIndex) {
      const textValue = template.substring(lastIndex, match.index);
      if (textValue) {
        segments.push({
          type: 'text',
          value: textValue,
          id: `text-${segmentId++}`,
        });
      }
    }

    // Add variable
    const path = match[1].trim();
    segments.push({
      type: 'variable',
      value: {
        id: `var-${segmentId++}`,
        path,
        displayName: getDisplayName(path),
        source: getSourceFromPath(path),
        sourceIndex: getSourceIndex(path),
        type: 'unknown', // Will be resolved from schema
      } as VariableReference,
      id: `var-${segmentId++}`,
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < template.length) {
    const textValue = template.substring(lastIndex);
    if (textValue) {
      segments.push({
        type: 'text',
        value: textValue,
        id: `text-${segmentId++}`,
      });
    }
  }

  // If no variables found, return single text segment
  if (segments.length === 0 && template) {
    segments.push({
      type: 'text',
      value: template,
      id: 'text-0',
    });
  }

  return segments;
}

/**
 * Serialize segments back to template string
 */
export function serializeTemplate(segments: TemplateSegment[]): string {
  return segments
    .map((segment) => {
      if (segment.type === 'text') {
        return segment.value as string;
      } else {
        const variable = segment.value as VariableReference;
        return `{${variable.path}}`;
      }
    })
    .join('');
}

/**
 * Extract display name from variable path
 */
function getDisplayName(path: string): string {
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1];

  // Remove array notation
  const cleanPart = lastPart.replace(/\[\d+\]/, '');

  // Convert camelCase to Title Case
  return cleanPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Determine source from path
 */
function getSourceFromPath(path: string): 'trigger' | 'action' | 'builtin' {
  // Check for built-in variables first
  if (['hookId', 'runId', 'timestamp'].includes(path)) {
    return 'builtin';
  }

  if (path.startsWith('trigger.')) {
    return 'trigger';
  } else if (path.startsWith('actions')) {
    // Check if it's actions[0] format
    const actionsMatch = /^actions\[\d+\]/.test(path);
    if (actionsMatch) {
      return 'action';
    }
  } else if (path.startsWith('action') && /^action\d+/.test(path)) {
    return 'action';
  }
  return 'trigger'; // Default fallback
}

/**
 * Extract source index from path (for actions)
 */
function getSourceIndex(path: string): number | undefined {
  const actionIndexMatch = path.match(/actions\[(\d+)\]/);
  if (actionIndexMatch) {
    return parseInt(actionIndexMatch[1], 10);
  }

  const actionAliasMatch = path.match(/^action(\d+)/);
  if (actionAliasMatch) {
    return parseInt(actionAliasMatch[1], 10);
  }

  return undefined;
}

/**
 * Escape special characters in template strings
 */
export function escapeTemplate(text: string): string {
  return text.replace(/\{/g, '{{');
}

/**
 * Unescape special characters in template strings
 */
export function unescapeTemplate(text: string): string {
  return text.replace(/\{\{/g, '{');
}

