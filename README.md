# PayloadLab: Regex & Web Vulnerability Sandbox

A production-grade, frontend-only educational security sandbox designed to test regular expressions, analyze inert sample payloads for common web vulnerabilities (XSS, SQL Injection), inspect rule-based detection heuristics, and understand defensive sanitization.

---

## 🛡️ Non-Negotiable Safety Policy

PayloadLab is built strictly for **defensive and educational** analysis:
- **No Payload Execution**: All inputs and sample strings are rendered as inert text (`textContent` / text nodes). There is **zero** `eval`, `new Function`, `innerHTML` with user or payload data, or `document.write`.
- **Persistent Notice**: A persistent safety banner is displayed across all tabs: *"DEFENSIVE EDUCATIONAL SANDBOX: Payloads are displayed as inert text and never executed."*
- **ReDoS Watchdog**: User-supplied regular expressions execute in an isolated Web Worker with a **500 ms hard timeout** to prevent catastrophic backtracking (ReDoS) from freezing the user interface.
- **Strictly Educational**: No exploit generation, payload mutators, or automated network scanning features are included.

---

## ✨ Features & Views

### 1. Regex Tester (`#regex-tester`)
- **Interactive Pattern Bar**: Full pattern input with flag toggles (`g`, `i`, `m`, `s`, `u`).
- **Live Match Highlighting**: Mirrored overlay behind a transparent textarea, building highlighted spans strictly via `document.createElement` and `span.textContent`.
- **Match Inspector**: Displays match count, execution time in milliseconds, index offsets, match lengths, and numbered/named capture groups (`$<name>`).
- **Pattern Explainer**: Token-by-token AST breakdown (Anchors `^`/`$`/`\b`, Character Classes `\d`/`\w`/`\s`, Quantifiers `*`/`+`/`?`/{n,m}, Groups `(...)`, Lookarounds, Alternation `|`, Escapes).
- **Cheatsheet Drawer**: Quick reference slide-out drawer with 1-click token insertion.
- **Bookmarks & History**: Save favorite patterns and automatically keep history of the last 10 tested expressions in `localStorage`.
- **ReDoS Protection**: Friendly warning displayed if execution exceeds 500 ms.

### 2. Payload Library (`#payload-library`)
- **Curated Textbook Library**: Inert sample payloads across XSS (script tags, image `onerror`, `javascript:` protocol, SVG `onload`, attribute breakouts) and SQL Injection (string tautologies, comment truncation, `UNION SELECT`, stacked queries, time-based `SLEEP()`).
- **Benign Look-Alikes (False Positive Teaching)**: Safe strings such as `Conan O'Brien`, `Tom & Jerry <3 you`, `SELECT a book from the shelf`, and `if (x < 10 && y > 20)` to demonstrate why naive input filters trigger false alarms.
- **Interactive Actions**: "Send to Regex Tester", "Send to Detector", and "Copy" on each payload card.
- **Search & Filter**: Search by keyword or filter by category chips (`All`, `XSS`, `SQLi`, `Benign`, `Custom`).
- **Custom Payloads**: Add your own testing strings persisted to `localStorage`.

### 3. Vulnerability Detector (`#detector`)
- **Heuristic Rule Engine**: 16+ curated detection rules for XSS and SQLi with severity ratings (`Low`, `Medium`, `High`, `Critical`) and remediation guidance.
- **Composite Risk Rating**: Visual SVG radial meter calculating risk scores and categories (`Clean`, `Low`, `Medium`, `High`, `Critical`).
- **Triggered vs Clean Breakdown**: Triggered rules display highlighted fragments and secure remediations; untriggered rules collapse into an accordion with enable/disable toggles.
- **Custom Rules**: Add custom regex detection signatures with custom severity weights.
- **Detection Limits Callout**: Prominent educational advisory explaining why regex filters are bypassable and why **Contextual Output Encoding** and **Parameterized Queries** are the only true defenses.

### 4. Sanitizer Lab (`#sanitizer-lab`)
- **Interactive Transformation Pipeline**: Toggleable and reorderable pipeline steps:
  1. *URL-Decode Input* (`decodeURIComponent`)
  2. *Unicode Normalization (NFKC) & Trim* (canonical normalization, zero-width space removal)
  3. *Strip All HTML Tags* (regex tag stripping)
  4. *Allow-List Safe Tags* (`<b>`, `<i>`, `<em>`, `<a href>`)
  5. *HTML Entity Escape* (`&`, `<`, `>`, `"`, `'`)
  6. *Remove SQL Meta-Characters* (includes security advisory warning why character blacklists fail against SQLi)
- **Side-by-Side Character-Level Diff**: Visual comparison using Longest Common Subsequence (LCS) rendering deletions in red and insertions in green.
- **Real-Time Risk Re-Assessment**: Detector automatically re-runs on both before and after text to verify risk reduction.
- **Concatenation vs Parameterization Demo**: Interactive query visualizer demonstrating how parameters prevent SQL syntax hijacking.
- **Bypass Awareness Tips**: Conceptual explanations of nested tags, multi-decode pitfalls, and non-whitespace delimiters.

### 5. Learn Hub (`#learn`)
- Educational cards covering:
  1. *Cross-Site Scripting (XSS)*: Stored, Reflected, and DOM-based vectors.
  2. *SQL Injection (SQLi)*: Tautologies, UNION extraction, and blind delays.
  3. *Output Encoding vs Input Filtering*: Why contextual encoding succeeds where blacklists fail.
  4. *Parameterized Queries & Prepared Statements*: Separation of SQL grammar and data literals.
  5. *Content Security Policy (CSP)*: Directives, nonces, and defense-in-depth.
  6. *Regular Expression Pitfalls*: Catastrophic Backtracking (ReDoS), greedy vs lazy matching, and anchor traps.
- Each module features side-by-side **DO / DON'T** code snippets.

---

## 🎨 Design System

- **Default Theme**: Dark "security console" palette (`#0B0F1A` background, `#121827` surface, `#273149` borders, `#6366F1` indigo and `#22D3EE` cyan accents).
- **Light Theme**: High-contrast, clean mode (`#F7F8FC` background, `#FFFFFF` surface) toggled with a single click.
- **Typography**: Space Grotesk (headings), Inter (UI labels & text), JetBrains Mono (regular expressions & code).
- **Accessibility**: WCAG AA color contrast, full keyboard navigation, `prefers-reduced-motion` compliance, ARIA roles, and visible focus rings.

---

## 🚀 How to Run Locally

PayloadLab is completely self-contained with **zero required external build steps**.

### Option 1: Using the Included Node Server
```bash
# Start server on http://localhost:3000
node server.js

# Or using npm
npm start
```

### Option 2: Using Any Static Server
```bash
# Python 3
python -m http.server 8080

# Or npx serve
npx serve .
```

### Option 3: Direct File Opening
You can also open `index.html` directly in modern web browsers (Chrome, Firefox, Safari, Edge). The built-in worker includes an automatic fallback to ensure full compatibility.

---

## 📸 Interface Structure Overview

```
+-----------------------------------------------------------------------------------+
|  [SHIELD] DEFENSIVE EDUCATIONAL SANDBOX: Payloads are displayed as inert text      |
+-----------------------------------------------------------------------------------+
|  PayloadLab [SANDBOX]   [Regex Tester] [Payload Library] [Detector] [Lab] [Learn] |
|                         [Theme Toggle] [Reset Button]                             |
+-----------------------------------------------------------------------------------+
|  HERO: PayloadLab // Security Sandbox   Stats: [20+ Payloads] [16 Rules] [6 Steps]|
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Tab 1: Regex Tester]     |  [Tab 2: Payload Library]   |  [Tab 3: Detector]     |
|  - Pattern /flags/         |  - Search & Category chips  |  - Risk Meter Gauge    |
|  - Live Overlay Highlights |  - Textbook payload cards   |  - Triggered rules list|
|  - Token-by-token parser   |  - Benign look-alikes       |  - Remediation guides  |
|  - 500ms ReDoS watchdog    |  - Dispatch to Tester/Detect|  - Rule toggles        |
|                            |                             |                        |
|  [Tab 4: Sanitizer Lab]                                  |  [Tab 5: Learn Hub]    |
|  - Reorderable pipeline steps                            |  - In-depth guides     |
|  - Character-level diff (Before / After)                 |  - DO / DON'T cards    |
|  - Parameterized vs Concatenated demo                    |  - CSP & ReDoS analysis|
|                                                                                   |
+-----------------------------------------------------------------------------------+
|  Footer: WCAG AA Compliant | No Remote Execution | ReDoS Watchdog Protected       |
+-----------------------------------------------------------------------------------+
```

---

## ✅ Safety Rules Verification Checklist

| Rule | Requirement | Status | Verification Detail |
|---|---|:---:|---|
| **1** | Never execute or render payloads as HTML | **PASSED** | Codebase verified with AST scanner. All strings set via `textContent` or `document.createTextNode`. Zero `innerHTML` with user data. |
| **2** | No `eval`, `new Function`, or `document.write` | **PASSED** | Static scan confirms 0 occurrences of dynamic evaluation functions across all source modules. |
| **3** | Persistent Safety Banner | **PASSED** | Fixed header banner visible across all view tabs: `"DEFENSIVE EDUCATIONAL SANDBOX: Payloads are displayed as inert text and never executed."` |
| **4** | Web Worker 500 ms ReDoS Watchdog | **PASSED** | `src/regexEngine/regexRunner.js` runs regexes inside Web Worker with hard 500 ms cancellation watchdog. Times out and resets worker gracefully. |
| **5** | No Exploit Generation / Network Scanning | **PASSED** | Pure client-side tool with curated, textbook educational strings and defensive rules only. |
| **6** | Safe Local Storage | **PASSED** | All `localStorage` interactions are guarded by `try/catch` and `typeof localStorage !== 'undefined'`. |

---

## 📄 License
MIT License. Built strictly for defensive educational security research.
