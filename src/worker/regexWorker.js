/**
 * PayloadLab Isolated Regex Web Worker
 * Runs user-supplied regexes in an isolated thread to protect the main UI
 * from catastrophic backtracking (ReDoS).
 */

self.onmessage = function (e) {
  const { taskId, pattern, flags, testString } = e.data;
  const startTime = performance.now();

  try {
    const rx = new RegExp(pattern, flags);
    const matches = [];
    const isGlobal = flags.includes('g');

    if (isGlobal) {
      let match;
      let lastIndex = -1;
      const MAX_MATCHES = 1000; // Safeguard against runaway loops

      while ((match = rx.exec(testString)) !== null) {
        matches.push(formatMatch(match));

        // Avoid infinite loop on zero-length matches
        if (rx.lastIndex === lastIndex) {
          rx.lastIndex++;
        }
        lastIndex = rx.lastIndex;

        if (matches.length >= MAX_MATCHES) {
          break;
        }
      }
    } else {
      const match = rx.exec(testString);
      if (match) {
        matches.push(formatMatch(match));
      }
    }

    const execTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    self.postMessage({
      taskId,
      success: true,
      matches,
      count: matches.length,
      execTimeMs
    });
  } catch (err) {
    self.postMessage({
      taskId,
      success: false,
      error: err.message || String(err),
      isSyntaxError: true
    });
  }
};

function formatMatch(m) {
  const namedGroups = m.groups ? { ...m.groups } : null;
  const numberedGroups = [];

  // Index 0 is the full match, 1..n are capture groups
  for (let i = 1; i < m.length; i++) {
    numberedGroups.push({
      index: i,
      value: m[i] !== undefined ? m[i] : null
    });
  }

  return {
    match: m[0],
    index: m.index,
    length: m[0].length,
    numberedGroups,
    namedGroups
  };
}
