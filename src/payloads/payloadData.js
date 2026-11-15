/**
 * Curated Inert Sample Payloads for Educational Testing
 * NOTE: These strings are strictly for educational pattern testing and are never executed.
 */

export const DEFAULT_PAYLOADS = [
  // ---------------------------------------------------------------------------
  // XSS Payloads
  // ---------------------------------------------------------------------------
  {
    id: 'xss-script-tag',
    name: 'Classic Script Tag',
    category: 'XSS',
    severity: 'High',
    payload: "<script>alert('XSS')</script>",
    description: 'Direct HTML tag injection that executes arbitrary JavaScript when rendered directly into an HTML page without contextual encoding.'
  },
  {
    id: 'xss-img-onerror',
    name: 'Image OnError Inline Handler',
    category: 'XSS',
    severity: 'High',
    payload: '<img src=x onerror=alert(1)>',
    description: 'Uses a broken image source URL to force the onerror event handler to trigger immediately upon DOM rendering.'
  },
  {
    id: 'xss-javascript-uri',
    name: 'JavaScript Pseudo-Protocol URI',
    category: 'XSS',
    severity: 'High',
    payload: 'javascript:alert(document.cookie)',
    description: 'Injected into href or src attributes. If a user clicks the link or an iframe loads it, JavaScript executes within the victim session context.'
  },
  {
    id: 'xss-svg-onload',
    name: 'SVG Onload Event Trigger',
    category: 'XSS',
    severity: 'High',
    payload: '<svg onload=alert(1)>',
    description: 'SVG XML elements support inline onload event handlers that fire when the graphic element finishes loading, bypassing basic <img> or <script> filters.'
  },
  {
    id: 'xss-attribute-breakout',
    name: 'Input Attribute Quote Breakout',
    category: 'XSS',
    severity: 'Critical',
    payload: '" onfocus="alert(1)" autofocus="',
    description: 'Closes an existing HTML attribute value with a quote and injects an autofocus/onfocus handler pair requiring no user interaction.'
  },
  {
    id: 'xss-iframe-src',
    name: 'Iframe JavaScript Source',
    category: 'XSS',
    severity: 'High',
    payload: '<iframe src="javascript:alert(1)"></iframe>',
    description: 'Embeds an inline frame pointing to a javascript: protocol URI, bypassing standard anchor tag sanitizers.'
  },
  {
    id: 'xss-body-onload',
    name: 'Body Tag Event Injection',
    category: 'XSS',
    severity: 'Medium',
    payload: '<body onload=alert(1)>',
    description: 'Injects into the root body tag to trigger execution upon document initialization.'
  },
  {
    id: 'xss-encoded-tag',
    name: 'URL-Encoded Script Vector',
    category: 'XSS',
    severity: 'High',
    payload: '%3Cscript%3Ealert(1)%3C/script%3E',
    description: 'URL-encoded representation of a script tag. Vulnerable if an application blindly decodes the string before reflecting it in an HTML response.'
  },

  // ---------------------------------------------------------------------------
  // SQL Injection Payloads
  // ---------------------------------------------------------------------------
  {
    id: 'sqli-tautology-quote',
    name: 'String Tautology (Always True)',
    category: 'SQLi',
    severity: 'Critical',
    payload: "' OR '1'='1",
    description: 'Breaks out of single quotes and adds an OR condition that always evaluates to TRUE, bypassing authentication or dumping all records.'
  },
  {
    id: 'sqli-comment-truncation',
    name: 'Auth Bypass with Comment Truncation',
    category: 'SQLi',
    severity: 'Critical',
    payload: "admin'--",
    description: 'Specifies the admin user and uses SQL comment delimiter (--) to truncate the remainder of the query (such as password verification).'
  },
  {
    id: 'sqli-hash-comment',
    name: 'MySQL Hash Comment Bypass',
    category: 'SQLi',
    severity: 'Critical',
    payload: "admin'#",
    description: 'Uses the MySQL-specific hash (#) comment syntax to truncate the remainder of a dynamic query.'
  },
  {
    id: 'sqli-union-select',
    name: 'UNION SELECT Column Extraction',
    category: 'SQLi',
    severity: 'High',
    payload: "' UNION SELECT null, username, password FROM users--",
    description: 'Appends an additional SELECT statement to an existing query to extract sensitive data from other tables into the response.'
  },
  {
    id: 'sqli-stacked-query',
    name: 'Stacked Query (Command Execution)',
    category: 'SQLi',
    severity: 'Critical',
    payload: "1; DROP TABLE logs;--",
    description: 'Terminates the primary SQL query with a semicolon and executes a subsequent destructive command (supported in MSSQL, PostgreSQL).'
  },
  {
    id: 'sqli-time-sleep',
    name: 'Blind Time-Based SLEEP Injection',
    category: 'SQLi',
    severity: 'High',
    payload: "' OR SLEEP(5)--",
    description: 'Forces the database server to pause execution for 5 seconds. Used in blind SQL injection to infer data based on response latency.'
  },
  {
    id: 'sqli-numeric-tautology',
    name: 'Numeric Field Tautology',
    category: 'SQLi',
    severity: 'Critical',
    payload: "1 OR 1=1",
    description: 'Exploits unquoted numeric input in WHERE clauses (e.g., SELECT * FROM products WHERE id = 1 OR 1=1).'
  },
  {
    id: 'sqli-inline-comment',
    name: 'Inline Comment Keyword Obfuscation',
    category: 'SQLi',
    severity: 'Medium',
    payload: "admin' /**/OR/**/ '1'='1",
    description: 'Uses inline C-style comments (/**/) instead of whitespace to bypass naive regex filters that expect standard space characters.'
  },

  // ---------------------------------------------------------------------------
  // Benign Look-Alikes (False Positive Teaching)
  // ---------------------------------------------------------------------------
  {
    id: 'benign-obrien',
    name: "Apostrophe in Name (O'Brien)",
    category: 'Benign',
    severity: 'Benign',
    payload: "Conan O'Brien",
    description: 'Legitimate Irish or Scottish surname containing an apostrophe. Naive regex filters that flag any single quote will reject valid user names.'
  },
  {
    id: 'benign-heart-text',
    name: 'Emoticon with Angle Bracket (<3 you)',
    category: 'Benign',
    severity: 'Benign',
    payload: "Thanks so much, <3 you all!",
    description: 'Uses the "<" symbol as an emoticon. Naive tag filters looking for "<" alone will flag this harmless text as a potential XSS vector.'
  },
  {
    id: 'benign-select-book',
    name: 'English Sentence with SQL Keywords',
    category: 'Benign',
    severity: 'Benign',
    payload: "Please SELECT a book FROM the shelf OR request an update",
    description: 'Contains words "SELECT", "FROM", "OR" in ordinary English. Demonstrates why matching bare keywords without SQL punctuation yields false positives.'
  },
  {
    id: 'benign-math-comparison',
    name: 'Mathematical Comparison Expression',
    category: 'Benign',
    severity: 'Benign',
    payload: "if (x < 10 && y > 20) return true;",
    description: 'Standard programming logic containing angle brackets and logical ANDs. Not an HTML injection or SQL exploit.'
  },
  {
    id: 'benign-discount-price',
    name: 'Price & Percentage String',
    category: 'Benign',
    severity: 'Benign',
    payload: "Special deal: $49.99 (50% OFF) -- while stocks last!",
    description: 'Legitimate commercial text with currency symbols, percent signs, and double hyphens (--). Demonstrates that "--" alone is not necessarily SQLi.'
  },
  {
    id: 'benign-safe-html-quote',
    name: 'Quoted Search Term',
    category: 'Benign',
    severity: 'Benign',
    payload: 'Searching for "security best practices 2026"',
    description: 'User search query wrapped in double quotes. Demonstrates standard user intent that naive input filters often break.'
  }
];
