/**
 * Convert markup text to Telegram message entities
 */

import { extractPlainText, parseMarkup } from './markupParser';
import { FormatNode, MarkupNode, TelegramEntity, TelegramMessage } from './types';
import { getUTF16Length } from './utf16Calculator';

/**
 * Convert markup text to Telegram message format with entities
 */
export function convertToTelegramEntities(markupText: string): TelegramMessage {
  const nodes = parseMarkup(markupText);
  const plainText = extractPlainText(nodes);
  const entities: TelegramEntity[] = [];

  // Recursively process nodes to build entities
  let currentOffset = 0;
  processNodes(nodes, entities, currentOffset, plainText);

  return {
    text: plainText,
    entities: entities.sort((a, b) => a.offset - b.offset), // Sort by offset
  };
}

/**
 * Recursively process AST nodes to build Telegram entities
 */
function processNodes(
  nodes: MarkupNode[],
  entities: TelegramEntity[],
  startOffset: number,
  plainText: string
): number {
  let offset = startOffset;

  for (const node of nodes) {
    if (node.type === 'text') {
      // Plain text - just advance offset
      const textLength = getUTF16Length(node.content);
      offset += textLength;
      continue;
    }

    const formatNode = node as FormatNode;
    const nodeStartOffset = offset;

    // Process children/content and calculate length
    let nodeLength = 0;

    if (formatNode.type === 'code' || formatNode.type === 'pre') {
      const content = formatNode.content || '';
      nodeLength = getUTF16Length(content);
      offset += nodeLength;
    } else if (formatNode.type === 'variable') {
      const display = formatNode.display || formatNode.path || '';
      nodeLength = getUTF16Length(display);
      offset += nodeLength;
      // Variables don't create entities
      continue;
    } else if (formatNode.children) {
      // Process children recursively
      const childrenEndOffset = processNodes(formatNode.children, entities, offset, plainText);
      nodeLength = childrenEndOffset - offset;
      offset = childrenEndOffset;
    }

    // Create entity for this format (variables are already handled and skipped)
    if (nodeLength > 0) {
      // Calculate offset in plain text
      const plainTextOffset = nodeStartOffset;

      const entity: TelegramEntity = {
        type: mapFormatType(formatNode.type),
        offset: plainTextOffset,
        length: nodeLength,
      };

      // Add additional properties
      if (formatNode.type === 'pre' && formatNode.language) {
        entity.language = formatNode.language;
      }

      if (formatNode.type === 'link' && formatNode.url) {
        entity.url = formatNode.url;
      }

      entities.push(entity);
    }
  }

  return offset;
}

/**
 * Map our format types to Telegram entity types
 */
function mapFormatType(formatType: string): TelegramEntity['type'] {
  switch (formatType) {
    case 'bold':
      return 'bold';
    case 'italic':
      return 'italic';
    case 'underline':
      return 'underline';
    case 'strikethrough':
      return 'strikethrough';
    case 'code':
      return 'code';
    case 'pre':
      return 'pre';
    case 'spoiler':
      return 'spoiler';
    case 'link':
      return 'text_link';
    default:
      return 'bold'; // Fallback
  }
}


