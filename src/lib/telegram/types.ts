/**
 * Types for Telegram rich text formatting
 */

export type FormatType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'pre'
  | 'spoiler'
  | 'link'
  | 'variable';

export interface TextNode {
  type: 'text';
  content: string;
}

export interface FormatNode {
  type: FormatType;
  children?: MarkupNode[];
  content?: string; // For code and pre
  url?: string; // For links
  language?: string; // For pre/code blocks
  path?: string; // For variables
  display?: string; // For variables
}

export type MarkupNode = TextNode | FormatNode;

export interface TelegramEntity {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'pre' | 'spoiler' | 'text_link';
  offset: number; // UTF-16 code units
  length: number; // UTF-16 code units
  language?: string; // For 'pre' type
  url?: string; // For 'text_link' type
}

export interface TelegramMessage {
  text: string; // Plain text without markup
  entities: TelegramEntity[];
}

export interface ParsedMarkup {
  nodes: MarkupNode[];
  plainText: string;
}

