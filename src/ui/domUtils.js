/**
 * Safe DOM Utilities
 * STRICT DEFENSIVE POLICY:
 * - NEVER uses innerHTML with user, regex, or payload data.
 * - All text is attached via .textContent or document.createTextNode.
 * - Structured elements are built with document.createElement and attribute setters.
 */

/**
 * Creates an element with optional attributes and children
 * @param {string} tag
 * @param {object} attrs
 * @param {Array<Node|string>} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, val] of Object.entries(attrs)) {
    if (key.startsWith('on') && typeof val === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, val);
    } else if (key === 'className') {
      element.className = val;
    } else if (key === 'textContent') {
      element.textContent = val;
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(element.style, val);
    } else if (val !== undefined && val !== null) {
      element.setAttribute(key, val);
    }
  }

  for (const child of children) {
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * Clears and sets safe text content on an element
 */
export function setSafeText(element, text) {
  if (!element) return;
  element.textContent = String(text ?? '');
}

/**
 * Create a severity badge element
 * @param {'Low'|'Medium'|'High'|'Critical'|'Benign'|'Clean'|string} severity
 */
export function createBadge(severity) {
  const sev = String(severity || '').toLowerCase();
  let badgeClass = 'badge-category';

  if (sev.includes('critical')) badgeClass = 'badge-critical';
  else if (sev.includes('high')) badgeClass = 'badge-high';
  else if (sev.includes('medium')) badgeClass = 'badge-medium';
  else if (sev.includes('low')) badgeClass = 'badge-low';
  else if (sev.includes('benign') || sev.includes('clean')) badgeClass = 'badge-clean';

  return el('span', { className: `badge ${badgeClass}` }, [severity]);
}

/**
 * Safe icon builder (uses Lucide icon or SVG fallback)
 */
export function createIcon(iconName, size = 16) {
  const span = el('span', {
    className: 'icon-wrapper',
    'aria-hidden': 'true',
    style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
  });

  // SVG Paths for core Lucide icons to guarantee zero network dependency
  const svgMap = {
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    alertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    bookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    helpCircle: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    arrowUp: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    arrowDown: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>'
  };

  const svgInner = svgMap[iconName] || svgMap.helpCircle;
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgInner}</svg>`,
    'image/svg+xml'
  );
  const svg = doc.documentElement;
  span.appendChild(svg);
  return span;
}

/**
 * Copy text to clipboard safely and display toast
 */
export async function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    showToast(successMessage, 'success');
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    showToast('Failed to copy text', 'danger');
  }
}

/**
 * Toast Notification System
 */
export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = el('div', { id: 'toast-container', className: 'toast-container' });
    document.body.appendChild(container);
  }

  const toast = el('div', { className: `toast toast-${type}` }, [
    createIcon(type === 'success' ? 'check' : type === 'danger' ? 'alertTriangle' : 'helpCircle', 16),
    el('span', { textContent: message })
  ]);

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }, duration);
}
