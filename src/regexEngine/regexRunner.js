/**
 * Regex Runner with 500ms Watchdog Timeout
 * Manages the Web Worker lifecycle and aborts catastrophic backtracking patterns.
 */

let workerInstance = null;
let currentTaskId = 0;
let pendingTask = null;
const WATCHDOG_TIMEOUT_MS = 500;

/**
 * Initialize or re-create worker instance
 */
function getWorker() {
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('../worker/regexWorker.js', import.meta.url), {
        type: 'module'
      });
    } catch {
      // Fallback for browsers or protocols where module workers from URL might need standard URL
      try {
        workerInstance = new Worker('./src/worker/regexWorker.js');
      } catch (err) {
        console.warn('Web Worker initialization failed, creating Blob worker fallback', err);
        workerInstance = createBlobWorkerFallback();
      }
    }

    workerInstance.onmessage = handleWorkerMessage;
    workerInstance.onerror = handleWorkerError;
  }
  return workerInstance;
}

/**
 * Handle worker message
 */
function handleWorkerMessage(e) {
  const data = e.data;
  if (pendingTask && pendingTask.taskId === data.taskId) {
    clearTimeout(pendingTask.timeoutTimer);
    const { resolve } = pendingTask;
    pendingTask = null;
    resolve(data);
  }
}

/**
 * Handle unexpected worker error
 */
function handleWorkerError(err) {
  if (pendingTask) {
    clearTimeout(pendingTask.timeoutTimer);
    const { reject } = pendingTask;
    pendingTask = null;
    terminateAndResetWorker();
    reject(new Error(err.message || 'Worker thread error'));
  }
}

/**
 * Terminate current worker and clear reference
 */
function terminateAndResetWorker() {
  if (workerInstance) {
    try {
      workerInstance.terminate();
    } catch (e) {
      console.warn('Error terminating worker:', e);
    }
    workerInstance = null;
  }
}

/**
 * Executes a regex test with a hard 500ms timeout
 * @param {string} pattern - Regular expression pattern
 * @param {string} flags - Flags e.g. 'gim'
 * @param {string} testString - The test string
 * @returns {Promise<object>} Result object with matches or timeout/syntax error
 */
export function runRegexTest(pattern, flags, testString) {
  return new Promise((resolve) => {
    // Basic pre-validation: check if regex syntax itself compiles quickly
    try {
      new RegExp(pattern, flags);
    } catch (syntaxErr) {
      return resolve({
        success: false,
        isSyntaxError: true,
        error: syntaxErr.message
      });
    }

    const taskId = ++currentTaskId;
    const worker = getWorker();

    // Set 500ms Watchdog
    const timeoutTimer = setTimeout(() => {
      terminateAndResetWorker();
      pendingTask = null;
      resolve({
        success: false,
        timedOut: true,
        error: 'Pattern too slow (possible catastrophic backtracking). Watchdog terminated execution after 500ms.'
      });
    }, WATCHDOG_TIMEOUT_MS);

    pendingTask = {
      taskId,
      timeoutTimer,
      resolve
    };

    worker.postMessage({
      taskId,
      pattern,
      flags,
      testString
    });
  });
}

/**
 * Fallback Blob Worker if local environment prevents direct file loading
 */
function createBlobWorkerFallback() {
  const workerCode = `
    self.onmessage = function(e) {
      const { taskId, pattern, flags, testString } = e.data;
      const startTime = performance.now();
      try {
        const rx = new RegExp(pattern, flags);
        const matches = [];
        const isGlobal = flags.includes('g');
        if (isGlobal) {
          let match;
          let lastIndex = -1;
          const MAX_MATCHES = 1000;
          while ((match = rx.exec(testString)) !== null) {
            matches.push({
              match: match[0],
              index: match.index,
              length: match[0].length,
              numberedGroups: Array.from(match).slice(1).map((val, idx) => ({ index: idx + 1, value: val !== undefined ? val : null })),
              namedGroups: match.groups ? { ...match.groups } : null
            });
            if (rx.lastIndex === lastIndex) { rx.lastIndex++; }
            lastIndex = rx.lastIndex;
            if (matches.length >= MAX_MATCHES) break;
          }
        } else {
          const match = rx.exec(testString);
          if (match) {
            matches.push({
              match: match[0],
              index: match.index,
              length: match[0].length,
              numberedGroups: Array.from(match).slice(1).map((val, idx) => ({ index: idx + 1, value: val !== undefined ? val : null })),
              namedGroups: match.groups ? { ...match.groups } : null
            });
          }
        }
        const execTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
        self.postMessage({ taskId, success: true, matches, count: matches.length, execTimeMs });
      } catch (err) {
        self.postMessage({ taskId, success: false, error: err.message || String(err), isSyntaxError: true });
      }
    };
  `;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}
