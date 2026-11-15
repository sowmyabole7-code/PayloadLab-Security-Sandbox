/**
 * Sanitizer Pipeline
 * Pipeline of toggleable, reorderable defensive transformation steps.
 * Demonstrates how sanitization transforms payloads and highlights the limits
 * of naive character stripping.
 */

export const DEFAULT_PIPELINE_STEPS = [
  {
    id: 'step-url-decode',
    name: 'URL-Decode Input',
    enabled: false,
    description: 'Decodes percent-encoded characters (e.g. %3C to <) before inspection.',
    warning: null,
    transform: (text) => {
      try {
        return decodeURIComponent(text);
      } catch {
        // Fallback if malformed percent sequence
        return text.replace(/%([0-9a-fA-F]{2})/g, (_, hex) => {
          try {
            return String.fromCharCode(parseInt(hex, 16));
          } catch {
            return '%';
          }
        });
      }
    }
  },
  {
    id: 'step-unicode-norm',
    name: 'Unicode Normalization (NFKC) & Trim',
    enabled: true,
    description: 'Normalizes full-width and compatibility characters, removes zero-width invisible bytes (\\u200B-\\u200D), and trims whitespace.',
    warning: null,
    transform: (text) => {
      if (!text) return '';
      // NFKC normalization converts compatibility characters to canonical equivalents
      let normalized = text.normalize('NFKC');
      // Strip zero-width spaces, soft hyphens, and byte-order-marks
      normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
      return normalized.trim();
    }
  },
  {
    id: 'step-strip-tags',
    name: 'Strip All HTML Tags',
    enabled: false,
    description: 'Removes all HTML/XML tag markers (<...>) using a non-greedy regex pattern.',
    warning: 'Regex tag stripping can be bypassed by malformed tags, nested strings like <scr<script>ipt>, or unclosed tags in complex DOM parsers.',
    transform: (text) => {
      return text.replace(/<[^>]*>?/gm, '');
    }
  },
  {
    id: 'step-allowlist-tags',
    name: 'Allow-List Safe Tags (<b>, <i>, <a href>)',
    enabled: false,
    description: 'Permits only safe formatting tags (<b>, <i>, <em>) and <a> with valid http/https URLs, stripping event handlers and other tags.',
    warning: 'Custom allow-listing is error-prone. Use audited libraries like DOMPurify for production HTML sanitization.',
    transform: (text) => {
      // First strip all script and style blocks entirely
      let cleaned = text.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
      // Strip dangerous attributes like on* and javascript: URLs
      cleaned = cleaned.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
      cleaned = cleaned.replace(/\bhref\s*=\s*['"]?\s*javascript:[^'">\s]+/gi, 'href="#"');
      // Strip any tag that isn't b, i, em, or a
      cleaned = cleaned.replace(/<(?!\/?(?:b|i|em|a)(?=>|\s))[^>]*>/gi, '');
      return cleaned;
    }
  },
  {
    id: 'step-html-entity-escape',
    name: 'HTML Entity Escape (Standard Defense)',
    enabled: true,
    description: 'Converts &, <, >, ", and \' to inert HTML character entities (&amp;, &lt;, &gt;, &quot;, &#39;).',
    warning: null,
    transform: (text) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    }
  },
  {
    id: 'step-sql-meta-strip',
    name: 'Remove SQL Meta-Characters (Naive Filter)',
    enabled: false,
    description: 'Strips single quotes (\'), semicolons (;), and double hyphens (--).',
    warning: 'CRITICAL SECURITY NOTICE: Stripping meta-characters is NOT a valid defense against SQL Injection! It fails against numeric injection (1 OR 1=1), hex literals, multi-byte bypasses, and alternate comments (#). Parameterized Queries (Prepared Statements) are the ONLY robust defense.',
    transform: (text) => {
      return text.replace(/['";]|--/g, '');
    }
  }
];

/**
 * Execute pipeline
 * @param {string} input - raw input text
 * @param {Array} pipelineSteps - ordered list of steps
 * @returns {object} { finalOutput, stepResults }
 */
export function runSanitizerPipeline(input, pipelineSteps) {
  let current = String(input || '');
  const stepResults = [];

  for (const step of pipelineSteps) {
    if (!step.enabled) {
      continue;
    }
    const before = current;
    const after = step.transform(before);
    stepResults.push({
      stepId: step.id,
      name: step.name,
      before,
      after,
      modified: before !== after
    });
    current = after;
  }

  return {
    original: input,
    finalOutput: current,
    stepResults
  };
}
