/**
 * Learn Hub View
 * Educational deep dives into web application vulnerabilities, secure coding principles,
 * and regex security pitfalls with actionable Do / Don't code comparisons.
 */

import { el, createIcon, createBadge } from './domUtils.js';

export const LEARN_MODULES = [
  {
    id: 'learn-xss',
    title: 'Cross-Site Scripting (XSS)',
    subtitle: 'Stored, Reflected, and DOM-based Attacks',
    badge: 'XSS',
    severity: 'High',
    overview:
      'Cross-Site Scripting occurs when untrusted input is included in dynamic web pages without proper validation or contextual output encoding. This allows attackers to execute arbitrary scripts in the victim browser session to steal cookies, hijack accounts, or alter page content.',
    variants: [
      { name: 'Reflected XSS', desc: 'Payload is delivered via URL parameters or form inputs and immediately reflected by the server without storage.' },
      { name: 'Stored XSS', desc: 'Payload is permanently stored in a database or comment feed and executed whenever other users view the infected page.' },
      { name: 'DOM-based XSS', desc: 'Vulnerability exists entirely in client-side JavaScript when an untrusted source (e.g. location.hash) flows into an execution sink (e.g. element.innerHTML).' }
    ],
    dodont: {
      dontTitle: "DON'T: Inject raw strings into innerHTML or template literals",
      dontCode: `// VULNERABLE: Direct HTML interpolation
userGreeting.innerHTML = "Welcome back, " + user.name + "!";
// If user.name is "<img src=x onerror=alert(1)>", script executes!`,
      doTitle: "DO: Use safe textContent or framework data-binding",
      doCode: `// SECURE: Browser renders input strictly as inert text
userGreeting.textContent = "Welcome back, " + user.name + "!";
// The tags are rendered literally and will NEVER execute.`
    }
  },
  {
    id: 'learn-sqli',
    title: 'SQL Injection (SQLi)',
    subtitle: 'Tautologies, UNION Extraction, and Blind Techniques',
    badge: 'SQLi',
    severity: 'Critical',
    overview:
      'SQL Injection occurs when user input is concatenated directly into SQL command strings instead of being passed as bound parameters. Attackers can alter the logical structure of queries, bypass authentication, dump sensitive database tables, or execute administrative commands.',
    variants: [
      { name: 'Tautologies', desc: "Injecting boolean logic like ' OR '1'='1 to force database WHERE clauses to always evaluate to TRUE." },
      { name: 'UNION Select', desc: 'Joining query results with secondary tables (e.g. users, credit_cards) to extract confidential data in one request.' },
      { name: 'Blind / Time-Based', desc: 'Inferring database schema and data character-by-character using delayed responses (SLEEP(5)) or conditional error responses.' }
    ],
    dodont: {
      dontTitle: "DON'T: Concatenate user input into SQL queries",
      dontCode: `// VULNERABLE: String concatenation builds dynamic SQL
const sql = "SELECT * FROM users WHERE email = '" + req.body.email + "';";
db.query(sql); // Attackers can inject quotes and commands`,
      doTitle: 'DO: Use Parameterized Queries (Prepared Statements)',
      doCode: `// SECURE: Query structure is pre-compiled before data is bound
const sql = "SELECT * FROM users WHERE email = ?";
db.query(sql, [req.body.email]); // Parameters cannot alter query syntax!`
    }
  },
  {
    id: 'learn-encoding-vs-filtering',
    title: 'Output Encoding vs Input Filtering',
    subtitle: 'Why Contextual Encoding Trumps Blacklist Filtering',
    badge: 'Architecture',
    severity: 'High',
    overview:
      'Attempting to sanitize malicious characters with regex blocklists almost always fails because attackers find alternative encodings, nested tags, or unusual syntax. Contextual output encoding guarantees that characters like <, >, and & are rendered inert in their exact display context.',
    variants: [
      { name: 'HTML Body Context', desc: 'Requires escaping &, <, >, ", \'' },
      { name: 'HTML Attribute Context', desc: 'Requires strict quote containment and attribute character entity encoding.' },
      { name: 'JavaScript Variable Context', desc: 'Requires JSON serialization with Unicode escaping (\\u003Cscript\\u003E).' }
    ],
    dodont: {
      dontTitle: "DON'T: Rely on regex replacement for sanitization",
      dontCode: `// NAIVE & BYPASSABLE: Single-pass tag stripping
function sanitize(input) {
  return input.replace(/<script>/gi, '');
}
// Bypass: "<scr<script>ipt>" becomes "<script>" after one pass!`,
      doTitle: 'DO: Encode contextually or use audited DOMPurify',
      doCode: `// SECURE: Context-aware HTML entity encoding
function encodeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}`
    }
  },
  {
    id: 'learn-parameterization',
    title: 'Parameterized Queries & Prepared Statements',
    subtitle: 'The Separation of Code and Data',
    badge: 'Defense',
    severity: 'Critical',
    overview:
      'In a prepared statement, the database engine compiles and optimizes the SQL query plan before any user input is considered. When user data is subsequently bound, the database treats it strictly as literal values, rendering SQL syntax manipulation impossible.',
    variants: [
      { name: 'Pre-compilation', desc: 'The database parses SQL semantics into an abstract syntax tree once.' },
      { name: 'Type Binding', desc: 'Parameters have explicit datatypes (string, integer, date) enforced by the driver.' },
      { name: 'Zero Syntax Interpretation', desc: "Characters like quotes (') and dashes (--) inside the parameter have no syntactic meaning." }
    ],
    dodont: {
      dontTitle: "DON'T: Try to escape single quotes manually",
      dontCode: `// FRAGILE: Custom escape functions miss multi-byte / unicode bypasses
const safeEmail = email.replace(/'/g, "''");
const query = "SELECT * FROM users WHERE email = '" + safeEmail + "'";`,
      doTitle: 'DO: Let the database driver handle parameter binding',
      doCode: `// SECURE: Fully separated data binding
const stmt = db.prepare("SELECT * FROM users WHERE email = ? AND role = ?");
stmt.execute([email, role]);`
    }
  },
  {
    id: 'learn-csp',
    title: 'Content Security Policy (CSP)',
    subtitle: 'Defense-in-Depth for the Modern Browser',
    badge: 'Headers',
    severity: 'Medium',
    overview:
      'Content Security Policy is an HTTP header that restricts where resources (scripts, styles, images) can be loaded and executed from. Even if an attacker finds an XSS injection hole, a strict CSP prevents inline script execution and stops data exfiltration to unauthorized domains.',
    variants: [
      { name: 'default-src', desc: "Fallback directive controlling default sources for all resource types (e.g. 'self')." },
      { name: 'script-src', desc: "Defines valid script sources; disabling 'unsafe-inline' neutralizes reflected/stored script tags." },
      { name: 'Nonces & Hashes', desc: 'Allows specific, cryptographically random inline scripts while blocking unauthorized injected scripts.' }
    ],
    dodont: {
      dontTitle: "DON'T: Use overly permissive CSP with unsafe-inline",
      dontCode: `<!-- INEFFECTIVE CSP: Permits injected inline scripts -->
Content-Security-Policy: default-src * 'unsafe-inline' 'unsafe-eval';`,
      doTitle: 'DO: Enforce strict nonces and disable unsafe-inline',
      doCode: `<!-- SECURE CSP: Only allows scripts with matching server nonce -->
Content-Security-Policy: default-src 'self'; script-src 'nonce-rAnd0m123' 'strict-dynamic'; object-src 'none';`
    }
  },
  {
    id: 'learn-regex-pitfalls',
    title: 'Regular Expression Pitfalls in Security',
    subtitle: 'Greedy vs Lazy, Anchor Traps, and ReDoS',
    badge: 'Regex',
    severity: 'Critical',
    overview:
      'Regular expressions are easy to write but treacherous to secure. Improper anchors allow attackers to prepend or append malicious strings; greedy quantifiers cause unexpected over-matching; and nested quantifiers can crash servers via Catastrophic Backtracking (ReDoS).',
    variants: [
      { name: 'Catastrophic Backtracking (ReDoS)', desc: 'Nested quantifiers like (a+)+$ cause exponential computation time (O(2^n)) on non-matching strings.' },
      { name: 'Missing Anchors (^ and $)', desc: 'A regex like /admin/ matches "not_an_admin" because it does not anchor to start and end.' },
      { name: 'Greedy Over-Matching', desc: '<.*> matches from the first < to the LAST > in the entire document, gobbling innocent tags in between.' }
    ],
    dodont: {
      dontTitle: "DON'T: Write nested quantifiers without atomic boundaries",
      dontCode: `// VULNERABLE TO REDOS: (a+)+$
const re = /([a-zA-Z0-9]+)+$/;
re.test("aaaaaaaaaaaaaaaaaaaaaaaaaaaa!"); // Freezes JavaScript thread for minutes!`,
      doTitle: 'DO: Use flat character classes and strict timeouts',
      doCode: `// SECURE: Linear time O(n) regex with boundary
const re = /^[a-zA-Z0-9]+$/;
re.test("aaaaaaaaaaaaaaaaaaaaaaaaaaaa!"); // Returns false in <0.01ms!`
    }
  }
];

export function initLearnView() {
  const container = document.getElementById('learn-cards-container');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  LEARN_MODULES.forEach((mod) => {
    const card = el('div', { className: 'card', style: { marginBottom: '24px' } });

    // Header
    const header = el('div', { className: 'card-header', style: { borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' } }, [
      el('div', {}, [
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' } }, [
          createBadge(mod.badge),
          createBadge(mod.severity),
          el('h3', { className: 'card-title', style: { fontSize: '18px' }, textContent: mod.title })
        ]),
        el('div', { className: 'card-subtitle', textContent: mod.subtitle })
      ])
    ]);

    // Overview
    const overview = el('p', {
      style: { fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6', margin: '14px 0' },
      textContent: mod.overview
    });

    // Variants list
    const variantsGrid = el('div', {
      style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '16px' }
    });

    mod.variants.forEach((v) => {
      const vBox = el('div', { className: 'card', style: { padding: '10px 14px', backgroundColor: 'var(--color-bg)' } }, [
        el('strong', { style: { fontSize: '13px', color: 'var(--color-secondary)', display: 'block', marginBottom: '2px' }, textContent: v.name }),
        el('p', { style: { fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }, textContent: v.desc })
      ]);
      variantsGrid.appendChild(vBox);
    });

    // Do / Don't Grid
    const dodontGrid = el('div', { className: 'dodont-grid' }, [
      // DON'T Card
      el('div', { className: 'dodont-card dodont-card-dont' }, [
        el('div', { className: 'dodont-header dodont-header-dont' }, [
          createIcon('alertTriangle', 14),
          el('span', { textContent: mod.dodont.dontTitle })
        ]),
        el('div', { className: 'code-block', style: { borderRadius: '0', border: 'none' } }, [mod.dodont.dontCode])
      ]),
      // DO Card
      el('div', { className: 'dodont-card dodont-card-do' }, [
        el('div', { className: 'dodont-header dodont-header-do' }, [
          createIcon('check', 14),
          el('span', { textContent: mod.dodont.doTitle })
        ]),
        el('div', { className: 'code-block', style: { borderRadius: '0', border: 'none' } }, [mod.dodont.doCode])
      ])
    ]);

    card.appendChild(header);
    card.appendChild(overview);
    card.appendChild(variantsGrid);
    card.appendChild(dodontGrid);

    container.appendChild(card);
  });
}
