/**
 * Text-Formatierung für Chat-Nachrichten
 * Unterstützt: Bold, Italic, Links, Mentions
 * 
 * SECURITY: Verwendet DOMPurify für XSS-Schutz
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Formatiert Text mit Markdown-ähnlicher Syntax
 * - **bold** oder __bold__
 * - *italic* oder _italic_
 * - [Link Text](URL)
 * - @username (Mentions)
 * 
 * SECURITY: HTML wird mit DOMPurify sanitized
 */
export function formatChatText(text: string): string {
  if (!text) return '';
  
  let formatted = text;
  
  // Escape HTML
  formatted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Links: [Text](URL)
  formatted = formatted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
  );
  
  // URLs (wenn nicht bereits als Link formatiert)
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    (match) => {
      if (!match.includes('href=')) {
        return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="chat-link">${match}</a>`;
      }
      return match;
    }
  );
  
  // Bold: **text** oder __text__
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic: *text* oder _text_ (aber nicht wenn Teil eines Links)
  formatted = formatted.replace(/(?<!<[^>]*)\*([^*]+)\*(?!\w)/g, '<em>$1</em>');
  formatted = formatted.replace(/(?<!<[^>]*)_([^_]+)_(?!\w)/g, '<em>$1</em>');
  
  // Mentions: @username
  formatted = formatted.replace(
    /@(\w+)/g,
    '<span class="chat-mention">@$1</span>'
  );
  
  // Zeilenumbrüche
  formatted = formatted.replace(/\n/g, '<br>');
  
  // SECURITY: Sanitize mit DOMPurify um XSS zu verhindern
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS: ['strong', 'em', 'a', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Extrahiert URLs aus Text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Extrahiert Mentions (@username) aus Text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)]; // Duplikate entfernen
}

/**
 * Prüft ob Text Links enthält
 */
export function containsLinks(text: string): boolean {
  return /(https?:\/\/[^\s]+)/.test(text);
}

/**
 * Prüft ob Text Mentions enthält
 */
export function containsMentions(text: string): boolean {
  return /@\w+/.test(text);
}

