/**
 * Detection Rules Engine
 * 16+ Curated Security Detection Rules for XSS and SQL Injection analysis.
 * Stored with metadata, severity weights, and defense-in-depth remediations.
 */

export const DEFAULT_RULES = [
  // ---------------------------------------------------------------------------
  // XSS Rules
  // ---------------------------------------------------------------------------
  {
    id: 'rule-xss-script-tag',
    name: 'Explicit Script Tag',
    category: 'XSS',
    severity: 'Critical',
    weight: 4,
    regex: '<\\s*script[^>]*>[\\s\\S]*?(<\\s*\\/\\s*script\\s*>)?|<\\s*script[^>]*\\/?>',
    flags: 'i',
    description: 'Detects opening or self-closing <script> HTML tags capable of inline JavaScript execution.',
    remediation: 'Never reflect raw user input into HTML context. Use HTML entity encoding (e.g. textContent in JS or modern framework templating).'
  },
  {
    id: 'rule-xss-inline-event',
    name: 'Inline DOM Event Handler',
    category: 'XSS',
    severity: 'High',
    weight: 3,
    regex: '\\b(on(?:error|load|click|mouse(?:over|enter|down)|focus|blur|change|submit|input))\\s*=',
    flags: 'i',
    description: 'Detects HTML inline event handler attributes like onerror=, onload=, onfocus=.',
    remediation: 'Use a strict Content Security Policy (CSP) that disables unsafe-inline scripts. Validate or strip unapproved attributes with a DOMPurify sanitizer.'
  },
  {
    id: 'rule-xss-javascript-uri',
    name: 'JavaScript Pseudo-Protocol',
    category: 'XSS',
    severity: 'High',
    weight: 3,
    regex: 'javascript\\s*:\\s*[^\\s"\'>]+',
    flags: 'i',
    description: 'Detects "javascript:" URI scheme used in href, src, or formaction attributes to execute scripts upon link interaction.',
    remediation: 'Validate URLs against an allow-list of schemes (http:, https:, mailto:). Never allow dynamic javascript: schemes in navigable attributes.'
  },
  {
    id: 'rule-xss-svg-tag',
    name: 'SVG Vector with Inline Scripting',
    category: 'XSS',
    severity: 'High',
    weight: 3,
    regex: '<\\s*svg[^>]*\\b(onload|onerror|onfocus)\\b[^>]*>',
    flags: 'i',
    description: 'Detects SVG elements with embedded event handler triggers.',
    remediation: 'Sanitize SVGs using XML-aware sanitizers or serve uploaded SVGs with Content-Type: image/svg+xml and Content-Security-Policy: default-src \'none\'.'
  },
  {
    id: 'rule-xss-iframe-injection',
    name: 'Iframe Tag Embedding',
    category: 'XSS',
    severity: 'Medium',
    weight: 2,
    regex: '<\\s*iframe[^>]*\\bsrc\\s*=[^>]*>',
    flags: 'i',
    description: 'Detects injected <iframe> tags used for clickjacking or loading external malicious frames.',
    remediation: 'Disallow raw iframe injection in user content; use strict frame-src CSP and sandbox attributes if iframes are necessary.'
  },
  {
    id: 'rule-xss-url-encoded-script',
    name: 'URL-Encoded Script Tag (%3Cscript%3E)',
    category: 'XSS',
    severity: 'High',
    weight: 3,
    regex: '%3c\\s*script|%3c%2f\\s*script',
    flags: 'i',
    description: 'Detects percent-encoded HTML script tags (<script> encoded as %3Cscript%3E), targeting multi-decode vulnerabilities.',
    remediation: 'Ensure decoding is performed only once at the HTTP ingestion boundary, never recursively before rendering.'
  },
  {
    id: 'rule-xss-data-uri',
    name: 'Data URI with HTML/JS MIME Type',
    category: 'XSS',
    severity: 'Medium',
    weight: 2,
    regex: 'data\\s*:\\s*(?:text\\/html|application\\/javascript)[^,]*base64',
    flags: 'i',
    description: 'Detects data: URIs conveying base64-encoded HTML or JavaScript payloads.',
    remediation: 'Reject data: URIs in resource attributes; enforce CSP directives: object-src \'none\', frame-src \'none\'.'
  },
  {
    id: 'rule-xss-expression',
    name: 'CSS Expression / Dynamic Property',
    category: 'XSS',
    severity: 'Medium',
    weight: 2,
    regex: 'expression\\s*\\([^)]*\\)|-moz-binding\\s*:',
    flags: 'i',
    description: 'Detects legacy CSS expressions and bindings that trigger script execution in older or embedded rendering engines.',
    remediation: 'Do not allow arbitrary user-supplied style attributes; sanitize CSS properties.'
  },

  // ---------------------------------------------------------------------------
  // SQL Injection Rules
  // ---------------------------------------------------------------------------
  {
    id: 'rule-sqli-tautology',
    name: 'Boolean Tautology (OR 1=1 / OR \'1\'=\'1\')',
    category: 'SQLi',
    severity: 'Critical',
    weight: 4,
    regex: '(?:\\bor\\b|\\band\\b)\\s+[\'"]?([0-9a-z]+)[\'"]?\\s*=\\s*[\'"]?\\1[\'"]?',
    flags: 'i',
    description: 'Detects SQL boolean tautology injection where an OR or AND expression compares identical operands to force evaluation to TRUE.',
    remediation: 'Always use Parameterized Queries (Prepared Statements). Parameters are treated strictly as data literals and cannot alter SQL logic.'
  },
  {
    id: 'rule-sqli-sql-comment',
    name: 'SQL Comment Delimiters (-- / # / /* */)',
    category: 'SQLi',
    severity: 'High',
    weight: 3,
    regex: '(?:--[\\s\\r\\n]+|--$|#|\\/\\*[\\s\\S]*?\\*\\/)',
    flags: 'm',
    description: 'Detects SQL comment syntax used to truncate remaining syntax of a dynamic query (e.g. bypassing password checks).',
    remediation: 'Parameterized queries prevent attackers from terminating SQL statements with comment tokens.'
  },
  {
    id: 'rule-sqli-union-select',
    name: 'UNION SELECT Injection',
    category: 'SQLi',
    severity: 'Critical',
    weight: 4,
    regex: '\\bunion\\b\\s+(?:all\\s+)?\\bselect\\b',
    flags: 'i',
    description: 'Detects UNION SELECT clauses used to merge results from the main query with another arbitrary table in the database.',
    remediation: 'Use Prepared Statements and an ORM. Ensure database users have least-privilege permissions.'
  },
  {
    id: 'rule-sqli-stacked-queries',
    name: 'Stacked Query Semicolon Execution',
    category: 'SQLi',
    severity: 'Critical',
    weight: 4,
    regex: ';\\s*(?:drop|alter|insert|update|delete|truncate|grant|exec)\\b',
    flags: 'i',
    description: 'Detects semicolon delimiter followed by dangerous SQL DDL/DML commands to execute secondary statements.',
    remediation: 'Disable multi-statement queries in database connection strings and use parameterized queries.'
  },
  {
    id: 'rule-sqli-sleep-benchmark',
    name: 'Time-Based Blind SQLi Functions',
    category: 'SQLi',
    severity: 'High',
    weight: 3,
    regex: '\\b(?:sleep|benchmark|waitfor\\s+delay|pg_sleep)\\s*\\(',
    flags: 'i',
    description: 'Detects time-delay functions used in blind SQL injection attacks to exfiltrate data bit-by-bit.',
    remediation: 'Use prepared queries and set restrictive database query execution timeouts.'
  },
  {
    id: 'rule-sqli-information-schema',
    name: 'Database Metadata Extraction (INFORMATION_SCHEMA)',
    category: 'SQLi',
    severity: 'High',
    weight: 3,
    regex: '\\binformation_schema\\.(?:tables|columns|schemata)\\b|\\bsys\\.objects\\b',
    flags: 'i',
    description: 'Detects queries targeting internal database catalogs and system schema tables during reconnaissance.',
    remediation: 'Restrict access to metadata tables using role-based permissions and prepare all queries.'
  },
  {
    id: 'rule-sqli-hex-literal',
    name: 'Hexadecimal SQL String Literal',
    category: 'SQLi',
    severity: 'Medium',
    weight: 2,
    regex: '\\b0x[0-9a-fA-F]{4,}\\b',
    flags: '',
    description: 'Detects hexadecimal literals commonly used to smuggle SQL payloads without quotes or whitespace.',
    remediation: 'Do not assemble SQL queries via string concatenation regardless of encoding.'
  },
  {
    id: 'rule-sqli-char-concat',
    name: 'Dynamic CHAR() Concatenation Function',
    category: 'SQLi',
    severity: 'Medium',
    weight: 2,
    regex: '\\b(?:char|chr)\\s*\\(\\s*[0-9]+(?:\\s*,\\s*[0-9]+)*\\s*\\)',
    flags: 'i',
    description: 'Detects CHAR(...) function calls used to construct strings dynamically without single quotes.',
    remediation: 'Enforce parameterized queries where data types are strictly bound.'
  }
];

const RULES_STORAGE_KEY = 'payloadlab_custom_rules';
const DISABLED_RULES_KEY = 'payloadlab_disabled_rules';

/**
 * Get all active and configured rules
 */
export function getAllRules() {
  const custom = getCustomRules();
  const disabledIds = getDisabledRuleIds();

  return [...DEFAULT_RULES, ...custom].map((rule) => ({
    ...rule,
    enabled: !disabledIds.includes(rule.id)
  }));
}

export function getDisabledRuleIds() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(DISABLED_RULES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load disabled rule ids:', e);
    return [];
  }
}

export function toggleRuleEnabled(ruleId, enabled) {
  try {
    if (typeof localStorage === 'undefined') return [];
    const disabled = getDisabledRuleIds();
    let updated;
    if (enabled) {
      updated = disabled.filter((id) => id !== ruleId);
    } else {
      updated = [...new Set([...disabled, ruleId])];
    }
    localStorage.setItem(DISABLED_RULES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to toggle rule:', e);
    return [];
  }
}

export function getCustomRules() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load custom rules:', e);
    return [];
  }
}

export function saveCustomRule(ruleObj) {
  try {
    const custom = getCustomRules();
    const newRule = {
      id: 'rule-custom-' + Date.now(),
      name: ruleObj.name || 'Custom Rule',
      category: ruleObj.category || 'Custom',
      severity: ruleObj.severity || 'Medium',
      weight: ruleObj.severity === 'Critical' ? 4 : ruleObj.severity === 'High' ? 3 : 2,
      regex: ruleObj.regex || '',
      flags: ruleObj.flags || 'i',
      description: ruleObj.description || 'Custom detection rule.',
      remediation: ruleObj.remediation || 'Inspect code and apply defense-in-depth principles.',
      isCustom: true
    };
    custom.push(newRule);
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(custom));
    return newRule;
  } catch (e) {
    console.warn('Failed to save custom rule:', e);
    throw e;
  }
}
