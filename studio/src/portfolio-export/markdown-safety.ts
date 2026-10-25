/**
 * Render untrusted learner/source text as literal text inside authored Markdown.
 * Keep newlines for readability, but prevent user material from introducing
 * headings, links/images, blockquotes, code, rules or list structures.
 * This does not validate the claims in that text or sanitize arbitrary HTML.
 */
export function escapePortfolioMarkdown(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(/([\\`*_{}\[\]()#!|~])/g, '\\$1')
    // Escape a list/rule marker only at the start of a physical line.
    .replace(/(^|\n)([ \t]{0,3})([-+])(?=\s|[-+]{2,}(?:\s|$))/g, '$1$2\\$3')
    .replace(/(^|\n)([ \t]{0,3})(\d{1,9})\.(?=\s)/g, '$1$2$3\\.');
}
