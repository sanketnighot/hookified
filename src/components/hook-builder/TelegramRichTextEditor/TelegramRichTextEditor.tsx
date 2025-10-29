"use client";

import { parseMarkup } from '@/lib/telegram/markupParser';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CodeBlockDialog } from './CodeBlockDialog';
import { FormattingToolbar } from './FormattingToolbar';
import { LinkDialog } from './LinkDialog';

interface TelegramRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TelegramRichTextEditor({
  value = '',
  onChange,
  placeholder = 'Type your message... Use toolbar to format.',
  className,
}: TelegramRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [codeBlockDialogOpen, setCodeBlockDialogOpen] = useState(false);
  const [markupText, setMarkupText] = useState(value);
  const isInitialMount = useRef(true);
  const savedSelectionRef = useRef<Range | null>(null);

  // Update editor content from markup
  const updateEditorContent = useCallback((markup: string) => {
    if (!editorRef.current) return;

    const nodes = parseMarkup(markup);
    const html = renderNodesToHTML(nodes);

    // Save cursor position
    const selection = window.getSelection();
    let cursorOffset = 0;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      cursorOffset = preCaretRange.toString().length;
    }

    editorRef.current.innerHTML = html;

    // Restore cursor position
    if (cursorOffset > 0 && selection) {
      const range = document.createRange();
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      let pos = 0;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textLength = node.textContent?.length || 0;
        if (pos + textLength >= cursorOffset) {
          range.setStart(node, cursorOffset - pos);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          break;
        }
        pos += textLength;
      }
    }
  }, []);

  // Initialize editor on mount and sync external value changes
  useEffect(() => {
    if (!editorRef.current) return;

    if (isInitialMount.current) {
      if (value) {
        updateEditorContent(value);
      }
      isInitialMount.current = false;
    } else if (value !== markupText) {
      setMarkupText(value);
      updateEditorContent(value);
    }
  }, [value, markupText, updateEditorContent]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    const html = editorRef.current.innerHTML;
    const markup = convertHTMLToMarkup(html);

    setMarkupText(markup);
    onChange(markup);
  }, [onChange]);

  // Render AST nodes to HTML
  const renderNodesToHTML = (nodes: any[]): string => {
    return nodes.map(node => {
      if (node.type === 'text') {
        return escapeHTML(node.content);
      }

      if (node.type === 'variable') {
        // Render as chip-like span
        const displayName = node.display || node.path || '';
        return `<span data-variable="${escapeHTML(node.path || '')}" contenteditable="false" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border bg-linear-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30 text-purple-300">${escapeHTML(displayName)}</span>`;
      }

      if (node.type === 'bold') {
        return `<strong>${renderNodesToHTML(node.children || [])}</strong>`;
      }
      if (node.type === 'italic') {
        return `<em>${renderNodesToHTML(node.children || [])}</em>`;
      }
      if (node.type === 'underline') {
        return `<u>${renderNodesToHTML(node.children || [])}</u>`;
      }
      if (node.type === 'strikethrough') {
        return `<s>${renderNodesToHTML(node.children || [])}</s>`;
      }
      if (node.type === 'code') {
        return `<code class="bg-white/10 px-1 py-0.5 rounded font-mono text-sm">${escapeHTML(node.content || '')}</code>`;
      }
      if (node.type === 'pre') {
        return `<pre data-language="${node.language || ''}" class="bg-white/10 p-2 rounded font-mono text-sm whitespace-pre-wrap block my-2">${escapeHTML(node.content || '')}</pre>`;
      }
      if (node.type === 'spoiler') {
        return `<span class="bg-gray-700 text-gray-700 select-all">${renderNodesToHTML(node.children || [])}</span>`;
      }
      if (node.type === 'link') {
        const linkText = renderNodesToHTML(node.children || []);
        return `<a href="${escapeHTML(node.url || '')}" class="underline text-blue-400" data-url="${escapeHTML(node.url || '')}">${linkText}</a>`;
      }

      return '';
    }).join('');
  };

  // Convert editor HTML back to markup
  const convertHTMLToMarkup = (html: string): string => {
    const tempDiv = document.createElement('div');
    // Set white-space to preserve whitespace during parsing
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.innerHTML = html;
    const markup = convertElementToMarkup(tempDiv);

    // Clean up multiple consecutive newlines (max 2)
    return markup.replace(/\n{3,}/g, '\n\n');
  };

  const convertElementToMarkup = (element: Element | ChildNode, preserveWhitespace = false): string => {
    let result = '';

    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        // Preserve all text content, including whitespace-only nodes
        result += text;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;

        // Check for variable chip
        if (el.dataset.variable) {
          result += `{${el.dataset.variable}}`;
          continue;
        }

        // Handle BR elements (line breaks)
        if (el.tagName.toLowerCase() === 'br') {
          result += '\n';
          continue;
        }

        // Handle DIV elements (may contain new lines)
        if (el.tagName.toLowerCase() === 'div' || el.tagName.toLowerCase() === 'p') {
          const children = convertElementToMarkup(el, true);
          result += children;
          // Add newline after div/p unless it's the last child
          const parent = el.parentElement;
          if (parent && el !== parent.lastElementChild) {
            result += '\n';
          }
          continue;
        }

        const tagName = el.tagName.toLowerCase();

        // Handle PRE elements (code blocks)
        if (tagName === 'pre') {
          const lang = el.dataset.language || '';
          const children = convertElementToMarkup(el, true);
          result += `\`\`\`${lang}\n${children}\n\`\`\``;
          continue;
        }

        const children = convertElementToMarkup(el, preserveWhitespace);

        if (tagName === 'strong' || tagName === 'b') {
          result += `**${children}**`;
        } else if (tagName === 'em' || tagName === 'i') {
          result += `*${children}*`;
        } else if (tagName === 'u') {
          result += `__${children}__`;
        } else if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
          result += `~~${children}~~`;
        } else if (tagName === 'code') {
          result += `\`${children}\``;
        } else if (tagName === 'pre') {
          const lang = el.dataset.language || '';
          result += `\`\`\`${lang}\n${children}\n\`\`\``;
        } else if (tagName === 'a') {
          const url = el.dataset.url || el.getAttribute('href') || '';
          result += `[${children}](${url})`;
        } else if (el.classList.contains('bg-gray-700')) {
          // Spoiler
          result += `||${children}||`;
        } else {
          result += children;
        }
      }
    }

    return result;
  };

  const escapeHTML = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Format handler
  const handleFormat = useCallback((format: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // No selection, just wrap cursor position
      insertMarkupAtCursor(formatMarkup(format, ''));
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      // Wrap selected content with formatting
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = selectedText;
      const contentNodes = Array.from(tempDiv.childNodes);

      // Create appropriate HTML wrapper based on format
      let wrapper: HTMLElement;
      switch (format) {
        case 'bold':
          wrapper = document.createElement('strong');
          break;
        case 'italic':
          wrapper = document.createElement('em');
          break;
        case 'underline':
          wrapper = document.createElement('u');
          break;
        case 'strikethrough':
          wrapper = document.createElement('s');
          break;
        case 'code':
          wrapper = document.createElement('code');
          wrapper.className = 'bg-white/10 px-1 py-0.5 rounded font-mono text-sm';
          break;
        default:
          wrapper = document.createElement('span');
      }

      // Move all content into wrapper
      contentNodes.forEach(node => wrapper.appendChild(node.cloneNode(true)));

      range.deleteContents();
      range.insertNode(wrapper);

      // Update selection to select the wrapper
      range.selectNodeContents(wrapper);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Insert format markers at cursor
      insertMarkupAtCursor(formatMarkup(format, ''));
    }

    handleInput();
  }, [handleInput]);

  const formatMarkup = (format: string, text: string): string => {
    switch (format) {
      case 'bold':
        return `**${text}**`;
      case 'italic':
        return `*${text}*`;
      case 'underline':
        return `__${text}__`;
      case 'strikethrough':
        return `~~${text}~~`;
      case 'code':
        return `\`${text}\``;
      case 'spoiler':
        return `||${text}||`;
      default:
        return text;
    }
  };

  const insertMarkupAtCursor = (markup: string) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    let range: Range;

    if (!selection || selection.rangeCount === 0) {
      // No selection, create range at end
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false); // Move to end
    } else {
      range = selection.getRangeAt(0);
    }

    // If it's a variable, create a proper span element
    const variableMatch = markup.match(/^\{([^}]+)\}$/);
    if (variableMatch) {
      const path = variableMatch[1];
      const display = path.split('.').pop() || path;
      const variableSpan = document.createElement('span');
      variableSpan.setAttribute('data-variable', path);
      variableSpan.setAttribute('contenteditable', 'false');
      variableSpan.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30 text-purple-300';
      variableSpan.textContent = display;

      range.deleteContents();
      range.insertNode(variableSpan);

      // Move cursor after variable
      const nextRange = document.createRange();
      nextRange.setStartAfter(variableSpan);
      nextRange.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(nextRange);
    } else {
      // Parse the markup and render it as HTML
      const nodes = parseMarkup(markup);
      const html = renderNodesToHTML(nodes);

      // Create a temporary container to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Check if the content contains a code block (pre element)
      const codeBlockPre = tempDiv.querySelector('pre');

      if (codeBlockPre) {
        // Create a fragment with the code block and surrounding newlines
        const fragment = document.createDocumentFragment();

        // Add a newline before if not at the start
        if (range.startOffset > 0) {
          fragment.appendChild(document.createElement('br'));
        }

        // Add the code block
        fragment.appendChild(codeBlockPre.cloneNode(true));

        // Add a newline after
        fragment.appendChild(document.createElement('br'));

        // Insert the entire fragment at once
        range.deleteContents();
        range.insertNode(fragment);

        // Move cursor after the inserted content
        const lastChild = fragment.lastChild;
        if (lastChild) {
          const nextRange = document.createRange();
          nextRange.setStartAfter(lastChild);
          nextRange.collapse(true);

          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(nextRange);
        }
      } else {
        // Regular inline content - insert normally
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        range.deleteContents();
        range.insertNode(fragment);
        range.collapse(false);

        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }

    handleInput();
  };

  // Handle link insertion
  const handleInsertLink = useCallback((text: string, url: string) => {
    // Restore saved selection if available
    if (savedSelectionRef.current && editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(savedSelectionRef.current);
        } catch (e) {
          // Selection might be invalid, create new one at end
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.addRange(range);
        }
        savedSelectionRef.current = null;
      }
    }

    const markup = `[${text}](${url})`;
    insertMarkupAtCursor(markup);
    handleInput();
  }, [handleInput]);

  // Handle code block insertion
  const handleInsertCodeBlock = useCallback((language: string, code: string) => {
    if (!editorRef.current) return;

    // Ensure editor is focused
    editorRef.current.focus();

    // Restore saved selection if available
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(savedSelectionRef.current);
        } catch (e) {
          // Selection might be invalid, create new one at end
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.addRange(range);
        }
        savedSelectionRef.current = null;
      }
    }

    // Create range at current cursor or end
    const selection = window.getSelection();
    let range: Range;

    if (!selection || selection.rangeCount === 0) {
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    } else {
      range = selection.getRangeAt(0);
    }

    const markup = `\`\`\`${language}\n${code}\n\`\`\``;

    // Parse and render the markup
    const nodes = parseMarkup(markup);
    const html = renderNodesToHTML(nodes);

    // Create temporary container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const codeBlockPre = tempDiv.querySelector('pre');

    if (codeBlockPre) {
      // Create fragment with code block and newlines
      const fragment = document.createDocumentFragment();

      // Add newline before if not at start
      if (range.startOffset > 0) {
        fragment.appendChild(document.createElement('br'));
      }

      // Add code block
      fragment.appendChild(codeBlockPre.cloneNode(true) as HTMLElement);

      // Add newline after
      fragment.appendChild(document.createElement('br'));

      // Insert fragment
      range.deleteContents();
      range.insertNode(fragment);

      // Move cursor after insertion
      const lastChild = fragment.lastChild;
      if (lastChild) {
        const nextRange = document.createRange();
        nextRange.setStartAfter(lastChild);
        nextRange.collapse(true);

        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(nextRange);
      }
    }

    handleInput();
  }, [handleInput]);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormat('underline');
          break;
        case 'e':
          e.preventDefault();
          if (e.shiftKey) {
            setCodeBlockDialogOpen(true);
          } else {
            handleFormat('code');
          }
          break;
        case 'k':
          e.preventDefault();
          setLinkDialogOpen(true);
          break;
        case 's':
          if (e.shiftKey) {
            e.preventDefault();
            handleFormat('strikethrough');
          }
          break;
        case 'p':
          if (e.shiftKey) {
            e.preventDefault();
            handleFormat('spoiler');
          }
          break;
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('keydown', handleKeyDown);
      return () => editor.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleFormat]);

  return (
    <div className={cn('border rounded-lg overflow-hidden glass', className)}>
        <FormattingToolbar
          onFormat={handleFormat}
          onInsertLink={() => setLinkDialogOpen(true)}
          onInsertCodeBlock={() => setCodeBlockDialogOpen(true)}
          onInsertVariable={(node: any) => {
            if (!node.isLeaf) return;

            // Restore saved selection or get current selection
            if (editorRef.current) {
              editorRef.current.focus();

              // Restore saved selection if available
              if (savedSelectionRef.current) {
                const selection = window.getSelection();
                if (selection) {
                  selection.removeAllRanges();
                  try {
                    selection.addRange(savedSelectionRef.current);
                  } catch (e) {
                    // Selection might be invalid, create new one at end
                    const range = document.createRange();
                    range.selectNodeContents(editorRef.current);
                    range.collapse(false);
                    selection.addRange(range);
                  }
                  savedSelectionRef.current = null;
                }
              } else {
                // No saved selection, ensure we have one
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                  const range = document.createRange();
                  range.selectNodeContents(editorRef.current);
                  range.collapse(false);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                }
              }

              // Insert the variable at current cursor position
              const markup = `{${node.path}}`;
              insertMarkupAtCursor(markup);
            }
          }}
          onClearFormatting={() => {
            // Simple implementation: just remove all formatting
            const plainText = editorRef.current?.textContent || '';
            editorRef.current && (editorRef.current.innerHTML = escapeHTML(plainText));
            setMarkupText(plainText);
            onChange(plainText);
          }}
        />

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onMouseUp={() => {
            // Save selection on mouse up (user clicks to position cursor)
            setTimeout(() => {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0 && editorRef.current) {
                const range = selection.getRangeAt(0);
                if (editorRef.current.contains(range.commonAncestorContainer)) {
                  savedSelectionRef.current = range.cloneRange();
                }
              }
            }, 0);
          }}
          onKeyUp={() => {
            // Save selection on key up (user moves cursor with keyboard)
            setTimeout(() => {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0 && editorRef.current) {
                const range = selection.getRangeAt(0);
                if (editorRef.current.contains(range.commonAncestorContainer)) {
                  savedSelectionRef.current = range.cloneRange();
                }
              }
            }, 0);
          }}
          onBlur={() => {
            // Save selection when editor loses focus (e.g., when popover opens)
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && editorRef.current) {
              const range = selection.getRangeAt(0);
              if (editorRef.current.contains(range.commonAncestorContainer)) {
                savedSelectionRef.current = range.cloneRange();
              }
            }
          }}
          onKeyDown={(e) => {
            // Handle backspace/delete on variable chips
            if (e.key === 'Backspace' || e.key === 'Delete') {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                // Check if we're about to delete a variable chip
                let nodeToDelete: HTMLElement | null = null;

                if (e.key === 'Backspace') {
                  // Look for variable chip before cursor
                  const container = range.startContainer;
                  const offset = range.startOffset;

                  if (container.nodeType === Node.TEXT_NODE && offset === 0) {
                    // At start of text node, check previous sibling
                    const prevSibling = container.previousSibling;
                    if (prevSibling && prevSibling instanceof HTMLElement && prevSibling.dataset.variable) {
                      nodeToDelete = prevSibling as HTMLElement;
                    }
                  }

                  // Also check if the start container itself is a variable chip
                  if (!nodeToDelete && container instanceof HTMLElement && container.dataset.variable) {
                    nodeToDelete = container as HTMLElement;
                  }
                } else if (e.key === 'Delete') {
                  // Look for variable chip after cursor
                  const container = range.startContainer;
                  const offset = range.startOffset;

                  if (container.nodeType === Node.TEXT_NODE && offset >= (container.textContent?.length || 0)) {
                    // At end of text node, check next sibling
                    const nextSibling = container.nextSibling;
                    if (nextSibling && nextSibling instanceof HTMLElement && nextSibling.dataset.variable) {
                      nodeToDelete = nextSibling as HTMLElement;
                    }
                  }
                }

                if (nodeToDelete) {
                  e.preventDefault();
                  nodeToDelete.remove();
                  handleInput();
                  return;
                }
              }
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(document.createTextNode(text));
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
              handleInput();
            }
          }}
          className={cn(
            'min-h-[200px] p-3 rounded-b-lg bg-background',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
            'prose prose-sm max-w-none',
            '[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through',
            '[&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded',
            '[&_a]:underline [&_a]:text-blue-400',
            'empty:before:content-[attr(data-placeholder)]',
            'empty:before:text-muted-foreground',
            'empty:before:pointer-events-none',
            'whitespace-pre-wrap', // Preserve whitespace and line breaks
          )}
          data-placeholder={placeholder}
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onInsert={handleInsertLink}
      />

      <CodeBlockDialog
        open={codeBlockDialogOpen}
        onOpenChange={setCodeBlockDialogOpen}
        onInsert={handleInsertCodeBlock}
      />
    </div>
  );
}

