/**
 * Safe Character-Level Diff Generator
 * Produces DOM elements with strictly safe textContent nodes (zero innerHTML).
 */

/**
 * Computes character-level differences between before and after strings
 * using Longest Common Subsequence (LCS).
 * @param {string} a - Original string
 * @param {string} b - Modified/sanitized string
 * @returns {Array<{type: 'same'|'del'|'ins', text: string}>}
 */
export function computeDiff(a, b) {
  if (a === b) {
    return [{ type: 'same', text: a }];
  }

  // Safety cap on string length for quadratic LCS
  if (a.length > 1500 || b.length > 1500) {
    // Fast line/prefix fallback for huge texts
    return [
      { type: 'del', text: a },
      { type: 'ins', text: b }
    ];
  }

  const m = a.length;
  const n = b.length;

  // LCS Matrix
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (a[i] === b[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to find edits
  const rawDiff = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      rawDiff.push({ type: 'same', text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({ type: 'ins', text: b[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({ type: 'del', text: a[i - 1] });
      i--;
    }
  }

  rawDiff.reverse();

  // Compress adjacent tokens of the same type
  const collapsed = [];
  for (const item of rawDiff) {
    const last = collapsed[collapsed.length - 1];
    if (last && last.type === item.type) {
      last.text += item.text;
    } else {
      collapsed.push({ type: item.type, text: item.text });
    }
  }

  return collapsed;
}

/**
 * Safely renders the 'Before' view showing unchanged and deleted characters.
 * STRICT: uses document.createElement and textContent only.
 */
export function renderBeforeDiff(diffTokens, containerElement) {
  while (containerElement.firstChild) {
    containerElement.removeChild(containerElement.firstChild);
  }

  if (diffTokens.length === 0) {
    containerElement.appendChild(document.createTextNode('(empty)'));
    return;
  }

  for (const token of diffTokens) {
    if (token.type === 'ins') {
      // Not present in 'Before'
      continue;
    }

    if (token.type === 'del') {
      const span = document.createElement('span');
      span.className = 'diff-del';
      span.textContent = token.text;
      containerElement.appendChild(span);
    } else {
      containerElement.appendChild(document.createTextNode(token.text));
    }
  }
}

/**
 * Safely renders the 'After' view showing unchanged and inserted characters.
 * STRICT: uses document.createElement and textContent only.
 */
export function renderAfterDiff(diffTokens, containerElement) {
  while (containerElement.firstChild) {
    containerElement.removeChild(containerElement.firstChild);
  }

  if (diffTokens.length === 0) {
    containerElement.appendChild(document.createTextNode('(empty)'));
    return;
  }

  for (const token of diffTokens) {
    if (token.type === 'del') {
      // Not present in 'After'
      continue;
    }

    if (token.type === 'ins') {
      const span = document.createElement('span');
      span.className = 'diff-ins';
      span.textContent = token.text;
      containerElement.appendChild(span);
    } else {
      containerElement.appendChild(document.createTextNode(token.text));
    }
  }
}
