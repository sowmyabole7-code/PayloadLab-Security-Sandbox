/**
 * Regex Tester View
 * Safe overlay match highlighting, token explainer, capture groups,
 * ReDoS watchdog handling, cheatsheet drawer, and pattern history.
 */

import { runRegexTest } from '../regexEngine/regexRunner.js';
import { explainPattern } from '../regexEngine/patternExplainer.js';
import { el, setSafeText, createIcon, copyToClipboard, showToast } from './domUtils.js';

const HISTORY_STORAGE_KEY = 'payloadlab_regex_history';
const SAVED_STORAGE_KEY = 'payloadlab_regex_saved';

let currentPattern = '<\\s*script[^>]*>[\\s\\S]*?<\\/\\s*script\\s*>';
let currentFlags = 'gi';
let currentTestString = "User input: Hello world!\n<script>alert('XSS')</script>\nAnother line with Conan O'Brien";
let isRunning = false;

export function initRegexView() {
  const patternInput = document.getElementById('regex-pattern-input');
  const testTextarea = document.getElementById('regex-test-input');
  const highlightLayer = document.getElementById('regex-highlight-layer');
  const flagToggles = document.querySelectorAll('.flag-toggle[data-flag]');
  const copyPatternBtn = document.getElementById('regex-copy-pattern-btn');
  const savePatternBtn = document.getElementById('regex-save-pattern-btn');
  const cheatsheetBtn = document.getElementById('regex-cheatsheet-btn');

  // Load initial values
  if (patternInput) patternInput.value = currentPattern;
  if (testTextarea) testTextarea.value = currentTestString;
  updateFlagTogglesUI();

  // Synchronize scroll between textarea and highlight layer
  if (testTextarea && highlightLayer) {
    const syncScroll = () => {
      highlightLayer.scrollTop = testTextarea.scrollTop;
      highlightLayer.scrollLeft = testTextarea.scrollLeft;
    };
    testTextarea.addEventListener('scroll', syncScroll);
    window.addEventListener('resize', syncScroll);
  }

  // Input listeners
  let debounceTimer;
  const triggerRun = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentPattern = patternInput.value;
      currentTestString = testTextarea.value;
      executeTest();
    }, 150);
  };

  if (patternInput) patternInput.addEventListener('input', triggerRun);
  if (testTextarea) testTextarea.addEventListener('input', triggerRun);

  // Flag toggles
  flagToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const flag = btn.getAttribute('data-flag');
      if (currentFlags.includes(flag)) {
        currentFlags = currentFlags.replace(flag, '');
      } else {
        currentFlags += flag;
      }
      updateFlagTogglesUI();
      triggerRun();
    });
  });

  // Copy & Save pattern buttons
  if (copyPatternBtn) {
    copyPatternBtn.addEventListener('click', () => {
      const fullRegex = `/${currentPattern}/${currentFlags}`;
      copyToClipboard(fullRegex, 'Regex copied to clipboard!');
    });
  }

  if (savePatternBtn) {
    savePatternBtn.addEventListener('click', () => {
      savePatternToStorage(currentPattern, currentFlags);
      renderSavedPatterns();
      showToast('Pattern saved to bookmarks!', 'success');
    });
  }

  if (cheatsheetBtn) {
    cheatsheetBtn.addEventListener('click', openCheatsheetDrawer);
  }

  // Initialize drawers and history
  initCheatsheet();
  renderHistory();
  renderSavedPatterns();

  // Initial execution
  executeTest();
}

function updateFlagTogglesUI() {
  const flagToggles = document.querySelectorAll('.flag-toggle[data-flag]');
  flagToggles.forEach((btn) => {
    const flag = btn.getAttribute('data-flag');
    btn.classList.toggle('active', currentFlags.includes(flag));
  });
}

/**
 * Execute regex test through Web Worker with 500ms timeout
 */
async function executeTest() {
  if (isRunning) return;
  isRunning = true;

  const validityContainer = document.getElementById('regex-validity-status');
  const matchSummary = document.getElementById('regex-match-summary');
  const matchList = document.getElementById('regex-match-list');
  const highlightLayer = document.getElementById('regex-highlight-layer');
  const explainerContainer = document.getElementById('regex-explainer-tokens');

  // Update token explainer immediately
  renderExplainer(currentPattern, explainerContainer);

  if (!currentPattern) {
    setSafeText(validityContainer, 'Enter a pattern to begin testing.');
    validityContainer.className = 'validity-status';
    clearHighlight(highlightLayer, currentTestString);
    renderEmptyMatches(matchList, 'No pattern provided.');
    setSafeText(matchSummary, '0 matches');
    isRunning = false;
    return;
  }

  try {
    const result = await runRegexTest(currentPattern, currentFlags, currentTestString);

    if (result.timedOut) {
      // ReDoS Catastrophic Backtracking Timeout!
      validityContainer.className = 'validity-status validity-timeout';
      setSafeText(
        validityContainer,
        'Pattern too slow (possible catastrophic backtracking). Watchdog terminated execution after 500ms.'
      );
      showToast('Pattern too slow (possible catastrophic backtracking)', 'warning', 5000);
      setSafeText(matchSummary, 'Timed out');
      clearHighlight(highlightLayer, currentTestString);
      renderEmptyMatches(matchList, 'Execution timed out (500ms limit). Review quantifiers for nested repetition.');
    } else if (!result.success && result.isSyntaxError) {
      // Syntax Error
      validityContainer.className = 'validity-status validity-invalid';
      setSafeText(validityContainer, `Syntax Error: ${result.error}`);
      setSafeText(matchSummary, 'Invalid regex');
      clearHighlight(highlightLayer, currentTestString);
      renderEmptyMatches(matchList, `Invalid regular expression: ${result.error}`);
    } else if (result.success) {
      // Success
      validityContainer.className = 'validity-status validity-valid';
      setSafeText(
        validityContainer,
        `Valid Regular Expression (${result.count} ${result.count === 1 ? 'match' : 'matches'} in ${result.execTimeMs}ms)`
      );
      setSafeText(matchSummary, `${result.count} ${result.count === 1 ? 'match' : 'matches'} (${result.execTimeMs}ms)`);

      // Record to history if valid and non-empty
      addToHistory(currentPattern, currentFlags);

      // Render Highlights
      renderHighlightSpans(highlightLayer, currentTestString, result.matches);

      // Render Match List
      renderMatches(matchList, result.matches);
    }
  } catch (err) {
    validityContainer.className = 'validity-status validity-invalid';
    setSafeText(validityContainer, `Unexpected execution error: ${err.message}`);
  } finally {
    isRunning = false;
  }
}

/**
 * Safely renders highlighted spans in overlay container using textContent
 */
function renderHighlightSpans(layer, fullText, matches) {
  while (layer.firstChild) {
    layer.removeChild(layer.firstChild);
  }

  if (!matches || matches.length === 0) {
    layer.appendChild(document.createTextNode(fullText));
    return;
  }

  let cursor = 0;
  for (let idx = 0; idx < matches.length; idx++) {
    const m = matches[idx];
    if (m.index > cursor) {
      layer.appendChild(document.createTextNode(fullText.slice(cursor, m.index)));
    }

    if (m.length > 0) {
      const matchSpan = document.createElement('span');
      matchSpan.className = idx % 2 === 0 ? 'match-highlight' : 'match-highlight-alt';
      matchSpan.textContent = m.match;
      layer.appendChild(matchSpan);
      cursor = m.index + m.length;
    } else {
      cursor = m.index;
    }
  }

  if (cursor < fullText.length) {
    layer.appendChild(document.createTextNode(fullText.slice(cursor)));
  }
}

function clearHighlight(layer, text) {
  while (layer.firstChild) {
    layer.removeChild(layer.firstChild);
  }
  layer.appendChild(document.createTextNode(text));
}

/**
 * Render match details cards
 */
function renderMatches(container, matches) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (!matches || matches.length === 0) {
    renderEmptyMatches(container, 'No matches found in the test string.');
    return;
  }

  matches.forEach((m, idx) => {
    const item = el('div', { className: 'match-item' });

    const header = el('div', { className: 'match-item-header' }, [
      el('strong', {}, [`Match #${idx + 1}`]),
      el('span', {}, [`Index: ${m.index} | Length: ${m.length}`])
    ]);

    const snippet = el('div', { className: 'match-text-snippet' }, [m.match]);

    item.appendChild(header);
    item.appendChild(snippet);

    // Numbered & Named Capture Groups
    const hasNumbered = m.numberedGroups && m.numberedGroups.length > 0;
    const hasNamed = m.namedGroups && Object.keys(m.namedGroups).length > 0;

    if (hasNumbered || hasNamed) {
      const groupsContainer = el('div', { className: 'capture-groups-list' });

      if (hasNumbered) {
        m.numberedGroups.forEach((g) => {
          const chip = el('span', { className: 'group-chip' }, [
            el('strong', {}, [`Group ${g.index}: `]),
            g.value !== null ? g.value : el('em', { textContent: 'null' })
          ]);
          groupsContainer.appendChild(chip);
        });
      }

      if (hasNamed) {
        for (const [name, val] of Object.entries(m.namedGroups)) {
          const chip = el('span', { className: 'group-chip' }, [
            el('strong', {}, [`$<${name}>: `]),
            val !== undefined ? val : el('em', { textContent: 'undefined' })
          ]);
          groupsContainer.appendChild(chip);
        }
      }

      item.appendChild(groupsContainer);
    }

    container.appendChild(item);
  });
}

function renderEmptyMatches(container, msg) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  const empty = el('div', { className: 'empty-state' }, [
    el('div', { className: 'empty-state-desc', textContent: msg })
  ]);
  container.appendChild(empty);
}

/**
 * Render token explainer breakdown
 */
function renderExplainer(pattern, container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const tokens = explainPattern(pattern);
  if (tokens.length === 0) {
    container.appendChild(
      el('div', { className: 'empty-state-desc', textContent: 'Enter a pattern to see token explanation.' })
    );
    return;
  }

  const grid = el('div', { className: 'token-grid' });
  tokens.forEach((t) => {
    const row = el('div', { className: 'token-row' }, [
      el('div', { className: 'token-symbol', textContent: t.symbol }),
      el('div', { className: 'token-info' }, [
        el('span', { className: 'token-type', textContent: t.type }),
        el('span', { className: 'token-desc', textContent: t.desc })
      ])
    ]);
    grid.appendChild(row);
  });

  container.appendChild(grid);
}

/**
 * Cheatsheet Drawer Setup
 */
function initCheatsheet() {
  const closeBtn = document.getElementById('cheatsheet-close-btn');
  const backdrop = document.getElementById('cheatsheet-backdrop');

  if (closeBtn) closeBtn.addEventListener('click', closeCheatsheetDrawer);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeCheatsheetDrawer();
    });
  }

  const cheatsheetItems = [
    { token: '^', name: 'Start of string/line', example: '^admin' },
    { token: '$', name: 'End of string/line', example: '\\.php$' },
    { token: '\\b', name: 'Word boundary', example: '\\bselect\\b' },
    { token: '\\d', name: 'Any digit [0-9]', example: '\\d{1,4}' },
    { token: '\\w', name: 'Word character [a-zA-Z0-9_]', example: '\\w+' },
    { token: '\\s', name: 'Whitespace char (space, tab, nl)', example: '\\s*=' },
    { token: '.', name: 'Any character (except newline)', example: '.*?' },
    { token: '[abc]', name: 'Character set (matches a, b, or c)', example: "['\"`]" },
    { token: '[^abc]', name: 'Negated set (any char not a, b, c)', example: '[^>]+' },
    { token: '*', name: '0 or more occurrences (Greedy)', example: '\\s*' },
    { token: '+', name: '1 or more occurrences (Greedy)', example: '\\d+' },
    { token: '?', name: '0 or 1 occurrence (or makes lazy)', example: '<.*?>' },
    { token: '{n,m}', name: 'Between n and m times', example: 'a{2,5}' },
    { token: '(...)', name: 'Capturing group', example: '(javascript:)' },
    { token: '(?:...)', name: 'Non-capturing group', example: '(?:or|and)' },
    { token: '(?<name>...)', name: 'Named capture group', example: '(?<tag>\\w+)' },
    { token: '(?=...)', name: 'Positive lookahead', example: '(?=[0-9])' },
    { token: '(?!...)', name: 'Negative lookahead', example: '(?!<script)' }
  ];

  const cheatsheetBody = document.getElementById('cheatsheet-body');
  if (cheatsheetBody) {
    while (cheatsheetBody.firstChild) cheatsheetBody.removeChild(cheatsheetBody.firstChild);

    cheatsheetItems.forEach((item) => {
      const card = el('div', { className: 'card', style: { padding: '10px 14px' } }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('code', { className: 'token-symbol', textContent: item.token }),
          el('button', {
            className: 'btn btn-outline btn-xs',
            textContent: 'Insert',
            onclick: () => insertToken(item.token)
          })
        ]),
        el('div', { style: { fontSize: '12px', marginTop: '4px', fontWeight: '500' }, textContent: item.name }),
        el('div', { style: { fontSize: '11px', color: 'var(--color-text-dim)', marginTop: '2px' } }, [
          'Example: ',
          el('code', { textContent: item.example })
        ])
      ]);
      cheatsheetBody.appendChild(card);
    });
  }
}

function openCheatsheetDrawer() {
  const backdrop = document.getElementById('cheatsheet-backdrop');
  if (backdrop) backdrop.classList.add('open');
}

function closeCheatsheetDrawer() {
  const backdrop = document.getElementById('cheatsheet-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}

function insertToken(token) {
  const patternInput = document.getElementById('regex-pattern-input');
  if (patternInput) {
    const start = patternInput.selectionStart;
    const end = patternInput.selectionEnd;
    const val = patternInput.value;
    patternInput.value = val.slice(0, start) + token + val.slice(end);
    patternInput.focus();
    patternInput.selectionStart = patternInput.selectionEnd = start + token.length;
    currentPattern = patternInput.value;
    executeTest();
    showToast(`Inserted token: ${token}`, 'info');
  }
}

/**
 * History & Saved Patterns
 */
function addToHistory(pattern, flags) {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    let history = raw ? JSON.parse(raw) : [];
    // Filter duplicates
    history = history.filter((h) => !(h.pattern === pattern && h.flags === flags));
    history.unshift({ pattern, flags, timestamp: Date.now() });
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    renderHistory();
  } catch (e) {
    console.warn('Failed to update regex history:', e);
  }
}

function renderHistory() {
  const container = document.getElementById('regex-history-list');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];

    if (history.length === 0) {
      container.appendChild(el('div', { className: 'empty-state-desc', textContent: 'No recent patterns.' }));
      return;
    }

    history.forEach((item) => {
      const btn = el(
        'button',
        {
          className: 'btn btn-outline btn-sm',
          style: { width: '100%', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' },
          onclick: () => loadPattern(item.pattern, item.flags)
        },
        [
          el('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, textContent: item.pattern }),
          el('span', { style: { color: 'var(--color-secondary)' }, textContent: `/${item.flags}` })
        ]
      );
      container.appendChild(btn);
    });
  } catch (e) {
    console.warn('Failed to render history:', e);
  }
}

function savePatternToStorage(pattern, flags) {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    saved.unshift({ pattern, flags, timestamp: Date.now() });
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved));
  } catch (e) {
    console.warn('Failed to save pattern:', e);
  }
}

function renderSavedPatterns() {
  const container = document.getElementById('regex-saved-list');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : [];

    if (saved.length === 0) {
      container.appendChild(el('div', { className: 'empty-state-desc', textContent: 'No bookmarked patterns.' }));
      return;
    }

    saved.forEach((item, idx) => {
      const row = el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' } }, [
        el(
          'button',
          {
            className: 'btn btn-outline btn-sm',
            style: { flex: '1', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', overflow: 'hidden' },
            onclick: () => loadPattern(item.pattern, item.flags)
          },
          [
            el('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, textContent: item.pattern }),
            el('span', { style: { color: 'var(--color-secondary)' }, textContent: `/${item.flags}` })
          ]
        ),
        el('button', {
          className: 'icon-btn',
          style: { width: '28px', height: '28px' },
          title: 'Delete bookmark',
          onclick: () => deleteSavedPattern(idx)
        }, [createIcon('x', 14)])
      ]);
      container.appendChild(row);
    });
  } catch (e) {
    console.warn('Failed to render saved patterns:', e);
  }
}

function deleteSavedPattern(index) {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    saved.splice(index, 1);
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved));
    renderSavedPatterns();
    showToast('Bookmark removed', 'info');
  } catch (e) {
    console.warn('Failed to delete bookmark:', e);
  }
}

function loadPattern(pattern, flags) {
  const patternInput = document.getElementById('regex-pattern-input');
  if (patternInput) {
    patternInput.value = pattern;
    currentPattern = pattern;
    currentFlags = flags || 'gi';
    updateFlagTogglesUI();
    executeTest();
    showToast('Pattern loaded!', 'success');
  }
}

/**
 * Public method to load input from other tabs (e.g. Payload Library)
 */
export function setRegexInputs({ pattern, flags, testString }) {
  const patternInput = document.getElementById('regex-pattern-input');
  const testTextarea = document.getElementById('regex-test-input');

  if (pattern !== undefined && patternInput) {
    patternInput.value = pattern;
    currentPattern = pattern;
  }
  if (flags !== undefined) {
    currentFlags = flags;
    updateFlagTogglesUI();
  }
  if (testString !== undefined && testTextarea) {
    testTextarea.value = testString;
    currentTestString = testString;
  }
  executeTest();
}
