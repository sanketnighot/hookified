/**
 * Utilities for calculating UTF-16 offsets for Telegram entities
 *
 * Telegram requires entity offsets and lengths to be in UTF-16 code units,
 * not Unicode code points or UTF-8 bytes.
 *
 * References:
 * - Code points in BMP (U+0000 to U+FFFF) = 1 UTF-16 code unit
 * - Code points in other planes (U+10000 to U+10FFFF) = 2 UTF-16 code units (surrogate pair)
 */

/**
 * Calculate the UTF-16 length of a string
 */
export function getUTF16Length(text: string): number {
  let length = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Check if this is a high surrogate (start of surrogate pair)
    if (code >= 0xD800 && code <= 0xDBFF) {
      // This is part of a surrogate pair, count as 2
      length += 2;
      i++; // Skip the low surrogate
    } else {
      length += 1;
    }
  }
  return length;
}

/**
 * Calculate UTF-16 offset up to a specific character index
 */
export function getUTF16Offset(text: string, charIndex: number): number {
  let offset = 0;
  const maxIndex = Math.min(charIndex, text.length);

  for (let i = 0; i < maxIndex; i++) {
    const code = text.charCodeAt(i);
    // Check if this is a high surrogate (start of surrogate pair)
    if (code >= 0xD800 && code <= 0xDBFF) {
      offset += 2;
      i++; // Skip the low surrogate
    } else {
      offset += 1;
    }
  }

  return offset;
}

/**
 * More efficient UTF-16 calculation using byte-level inspection
 * Based on Telegram's recommendation: check if byte starts with 0b11110
 */
export function getUTF16LengthFromUTF8(text: string): number {
  // Convert to UTF-8 bytes for inspection
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);

  let length = 0;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Skip continuation bytes (start with 0b10)
    if ((byte & 0xc0) === 0x80) {
      continue;
    }
    // Check if this is a 4-byte UTF-8 sequence (starts with 0b11110)
    // These represent code points > U+FFFF which need 2 UTF-16 units
    if (byte >= 0xf0) {
      length += 2;
    } else {
      length += 1;
    }
  }

  return length;
}

/**
 * Remove trailing whitespace/newlines from entity content before calculating length
 * Telegram requires: entity length must NOT include trailing whitespace/newlines
 * But the next offset MUST include leading whitespace/newlines
 */
export function trimTrailingWhitespace(text: string): string {
  return text.replace(/[\s\n\r]+$/, '');
}

