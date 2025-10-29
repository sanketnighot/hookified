/**
 * Markup parser for Telegram formatting
 *
 * Supports:
 * - Bold: **text**
 * - Italic: *text*
 * - Underline: __text__
 * - Strikethrough: ~~text~~
 * - Code: `code`
 * - Pre: ```language\ncode\n```
 * - Spoiler: ||text||
 * - Links: [text](url)
 * - Variables: {variable.path}
 */

import { FormatNode, MarkupNode } from './types';

/**
 * Parse markup text into AST nodes
 */
export function parseMarkup(text: string): MarkupNode[] {
  if (!text) return [];

  const nodes: MarkupNode[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    // Check for variable first (highest priority)
    const variableMatch = text.slice(currentPos).match(/^\{([^}]+)\}/);
    if (variableMatch) {
      const path = variableMatch[1];
      nodes.push({
        type: 'variable',
        path,
        display: path.split('.').pop() || path,
      } as FormatNode);
      currentPos += variableMatch[0].length;
      continue;
    }

    // Check for code block (```)
    const codeBlockMatch = text.slice(currentPos).match(/^```(\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      nodes.push({
        type: 'pre',
        language: codeBlockMatch[1] || '',
        content: codeBlockMatch[2],
      } as FormatNode);
      currentPos += codeBlockMatch[0].length;
      continue;
    }

    // Check for inline code (`)
    const inlineCodeMatch = text.slice(currentPos).match(/^`([^`\n]+)`/);
    if (inlineCodeMatch) {
      nodes.push({
        type: 'code',
        content: inlineCodeMatch[1],
      } as FormatNode);
      currentPos += inlineCodeMatch[0].length;
      continue;
    }

    // Check for link [text](url)
    const linkMatch = text.slice(currentPos).match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const url = linkMatch[2];

      // Parse link text for nested formatting
      const linkChildren = parseMarkup(linkText);
      nodes.push({
        type: 'link',
        url,
        children: linkChildren.length > 0 ? linkChildren : [{ type: 'text', content: linkText }],
      } as FormatNode);
      currentPos += linkMatch[0].length;
      continue;
    }

    // Check for spoiler ||
    const spoilerMatch = text.slice(currentPos).match(/^\|\|([^|]+)\|\|/);
    if (spoilerMatch) {
      const spoilerText = spoilerMatch[1];
      const spoilerChildren = parseMarkup(spoilerText);
      nodes.push({
        type: 'spoiler',
        children: spoilerChildren.length > 0 ? spoilerChildren : [{ type: 'text', content: spoilerText }],
      } as FormatNode);
      currentPos += spoilerMatch[0].length;
      continue;
    }

    // Check for bold **
    const boldMatch = text.slice(currentPos).match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      const boldText = boldMatch[1];
      const boldChildren = parseMarkup(boldText);
      nodes.push({
        type: 'bold',
        children: boldChildren.length > 0 ? boldChildren : [{ type: 'text', content: boldText }],
      } as FormatNode);
      currentPos += boldMatch[0].length;
      continue;
    }

    // Check for italic * (must not be followed by *)
    const italicMatch = text.slice(currentPos).match(/^\*([^*\n]+)\*/);
    if (italicMatch) {
      const italicText = italicMatch[1];
      const italicChildren = parseMarkup(italicText);
      nodes.push({
        type: 'italic',
        children: italicChildren.length > 0 ? italicChildren : [{ type: 'text', content: italicText }],
      } as FormatNode);
      currentPos += italicMatch[0].length;
      continue;
    }

    // Check for underline __
    const underlineMatch = text.slice(currentPos).match(/^__([^_]+)__/);
    if (underlineMatch) {
      const underlineText = underlineMatch[1];
      const underlineChildren = parseMarkup(underlineText);
      nodes.push({
        type: 'underline',
        children: underlineChildren.length > 0 ? underlineChildren : [{ type: 'text', content: underlineText }],
      } as FormatNode);
      currentPos += underlineMatch[0].length;
      continue;
    }

    // Check for strikethrough ~~
    const strikethroughMatch = text.slice(currentPos).match(/^~~([^~]+)~~/);
    if (strikethroughMatch) {
      const strikethroughText = strikethroughMatch[1];
      const strikethroughChildren = parseMarkup(strikethroughText);
      nodes.push({
        type: 'strikethrough',
        children: strikethroughChildren.length > 0 ? strikethroughChildren : [{ type: 'text', content: strikethroughText }],
      } as FormatNode);
      currentPos += strikethroughMatch[0].length;
      continue;
    }

    // Regular text - collect until next special character
    const nextSpecial = text.slice(currentPos).search(/[\*_`~|\{\[]|```/);
    if (nextSpecial === -1) {
      // No more special characters
      const remainingText = text.slice(currentPos);
      if (remainingText) {
        nodes.push({ type: 'text', content: remainingText });
      }
      break;
    }

    if (nextSpecial > 0) {
      const textContent = text.slice(currentPos, currentPos + nextSpecial);
      nodes.push({ type: 'text', content: textContent });
      currentPos += nextSpecial;
    } else {
      // Special character is at current position, skip it
      nodes.push({ type: 'text', content: text[currentPos] });
      currentPos += 1;
    }
  }

  return nodes;
}

/**
 * Serialize AST nodes back to markup text
 */
export function serializeToMarkup(nodes: MarkupNode[]): string {
  return nodes.map(node => serializeNode(node)).join('');
}

function serializeNode(node: MarkupNode): string {
  if (node.type === 'text') {
    return node.content;
  }

  const formatNode = node as FormatNode;

  switch (formatNode.type) {
    case 'bold':
      return `**${serializeToMarkup(formatNode.children || [])}**`;

    case 'italic':
      return `*${serializeToMarkup(formatNode.children || [])}*`;

    case 'underline':
      return `__${serializeToMarkup(formatNode.children || [])}__`;

    case 'strikethrough':
      return `~~${serializeToMarkup(formatNode.children || [])}~~`;

    case 'code':
      return `\`${formatNode.content || ''}\``;

    case 'pre':
      const lang = formatNode.language || '';
      return `\`\`\`${lang}\n${formatNode.content || ''}\n\`\`\``;

    case 'spoiler':
      return `||${serializeToMarkup(formatNode.children || [])}||`;

    case 'link':
      const linkText = formatNode.children ? serializeToMarkup(formatNode.children) : '';
      return `[${linkText}](${formatNode.url || ''})`;

    case 'variable':
      return `{${formatNode.path || ''}}`;

    default:
      return '';
  }
}

/**
 * Extract plain text from AST nodes (for entity offset calculation)
 */
export function extractPlainText(nodes: MarkupNode[]): string {
  return nodes.map(node => extractNodeText(node)).join('');
}

function extractNodeText(node: MarkupNode): string {
  if (node.type === 'text') {
    return node.content;
  }

  const formatNode = node as FormatNode;

  switch (formatNode.type) {
    case 'code':
    case 'pre':
      return formatNode.content || '';

    case 'variable':
      return formatNode.display || formatNode.path || '';

    default:
      return formatNode.children ? extractPlainText(formatNode.children) : '';
  }
}

