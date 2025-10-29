/**
 * Types for Telegram Rich Text Editor
 */

export interface EditorFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  spoiler?: boolean;
}

export interface SelectionRange {
  start: number;
  end: number;
  startContainer: Node;
  endContainer: Node;
}

