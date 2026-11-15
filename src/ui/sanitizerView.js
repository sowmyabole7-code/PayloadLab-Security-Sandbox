/**
 * Sanitizer Lab View
 * Interactive defensive pipeline with step toggles and reordering,
 * side-by-side character-level diff, real-time risk re-assessment,
 * concatenated vs parameterized query interactive demo, and bypass tips.
 */

import { DEFAULT_PIPELINE_STEPS, runSanitizerPipeline } from '../sanitizers/sanitizerPipeline.js';
import { computeDiff, renderBeforeDiff, renderAfterDiff } from '../sanitizers/diffViewer.js';
import { evaluatePayload } from '../rules/detectorEngine.js';
import { el, createIcon, createBadge, setSafeText, copyToClipboard } from './domUtils.js';

let pipelineSteps = JSON.parse(JSON.stringify(DEFAULT_PIPELINE_STEPS)).map((step, idx) => {
  // restore functions
  step.transform = DEFAULT_PIPELINE_STEPS[idx].transform;
  return step;
});

let currentSanitizerInput = "<script>alert('XSS')</script> & ' OR '1'='1";

export function initSanitizerView() {
  const inputArea = document.getElementById('sanitizer-input-textarea');
  const resetPipelineBtn = document.getElementById('sanitizer-reset-pipeline-btn');
  const copyOutputBtn = document.getElementById('sanitizer-copy-output-btn');

  if (inputArea) {
    inputArea.value = currentSanitizerInput;
    let timer;
    inputArea.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        currentSanitizerInput = inputArea.value;
        runPipelineAndUpdateUI();
      }, 200);
    });
  }

  if (resetPipelineBtn) {
    resetPipelineBtn.addEventListener('click', () => {
      pipelineSteps = JSON.parse(JSON.stringify(DEFAULT_PIPELINE_STEPS)).map((step, idx) => {
        step.transform = DEFAULT_PIPELINE_STEPS[idx].transform;
        return step;
      });
      renderPipelineStepList();
      runPipelineAndUpdateUI();
    });
  }

  if (copyOutputBtn) {
    copyOutputBtn.addEventListener('click', () => {
      const { finalOutput } = runSanitizerPipeline(currentSanitizerInput, pipelineSteps);
      copyToClipboard(finalOutput, 'Sanitized output copied as inert text!');
    });
  }

  renderPipelineStepList();
  runPipelineAndUpdateUI();
  initQueryComparisonDemo();
}

/**
 * Render Pipeline Steps List with toggles and up/down reorder buttons
 */
function renderPipelineStepList() {
  const container = document.getElementById('pipeline-steps-container');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  pipelineSteps.forEach((step, index) => {
    const item = el('div', {
      className: `pipeline-step-item ${step.enabled ? 'active' : ''}`
    });

    // Left: reorder handles + checkbox + step name
    const left = el('div', { className: 'pipeline-step-left' }, [
      el('div', { className: 'step-order-handle' }, [
        el(
          'button',
          {
            className: 'step-order-btn',
            title: 'Move Step Up',
            disabled: index === 0,
            onclick: () => moveStep(index, -1)
          },
          [createIcon('arrowUp', 12)]
        ),
        el(
          'button',
          {
            className: 'step-order-btn',
            title: 'Move Step Down',
            disabled: index === pipelineSteps.length - 1,
            onclick: () => moveStep(index, 1)
          },
          [createIcon('arrowDown', 12)]
        )
      ]),
      el('input', {
        type: 'checkbox',
        id: `step-toggle-${step.id}`,
        checked: step.enabled,
        onchange: (e) => {
          step.enabled = e.target.checked;
          renderPipelineStepList();
          runPipelineAndUpdateUI();
        }
      }),
      el('div', {}, [
        el('label', {
          htmlFor: `step-toggle-${step.id}`,
          style: { fontWeight: '600', cursor: 'pointer', display: 'block' },
          textContent: `${index + 1}. ${step.name}`
        }),
        el('div', { style: { fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }, textContent: step.description })
      ])
    ]);

    item.appendChild(left);

    // Warning callout if step is a dangerous/naive approach (like SQL meta strip)
    if (step.warning && step.enabled) {
      const warnPill = el(
        'span',
        {
          className: 'badge badge-high',
          title: step.warning,
          style: { cursor: 'help' }
        },
        [createIcon('alertTriangle', 12), 'Naive Filter']
      );
      item.appendChild(warnPill);
    }

    container.appendChild(item);
  });
}

function moveStep(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= pipelineSteps.length) return;
  const temp = pipelineSteps[index];
  pipelineSteps[index] = pipelineSteps[newIndex];
  pipelineSteps[newIndex] = temp;
  renderPipelineStepList();
  runPipelineAndUpdateUI();
}

/**
 * Execute pipeline and update Diff + Detector Re-run
 */
function runPipelineAndUpdateUI() {
  const beforeContainer = document.getElementById('diff-before-view');
  const afterContainer = document.getElementById('diff-after-view');
  const riskBeforeBadge = document.getElementById('risk-before-badge');
  const riskAfterBadge = document.getElementById('risk-after-badge');
  const warningContainer = document.getElementById('sanitizer-warning-banner');

  const { finalOutput } = runSanitizerPipeline(currentSanitizerInput, pipelineSteps);

  // Character-level diff
  const diffTokens = computeDiff(currentSanitizerInput, finalOutput);
  if (beforeContainer) renderBeforeDiff(diffTokens, beforeContainer);
  if (afterContainer) renderAfterDiff(diffTokens, afterContainer);

  // Evaluate risk Before
  const evalBefore = evaluatePayload(currentSanitizerInput);
  if (riskBeforeBadge) {
    riskBeforeBadge.className = `badge ${evalBefore.riskClass}`;
    setSafeText(riskBeforeBadge, `${evalBefore.riskLevel} (${evalBefore.score})`);
  }

  // Evaluate risk After
  const evalAfter = evaluatePayload(finalOutput);
  if (riskAfterBadge) {
    riskAfterBadge.className = `badge ${evalAfter.riskClass}`;
    setSafeText(riskAfterBadge, `${evalAfter.riskLevel} (${evalAfter.score})`);
  }

  // Display warning if SQL meta strip is enabled
  const sqlMetaStep = pipelineSteps.find((s) => s.id === 'step-sql-meta-strip');
  if (warningContainer) {
    if (sqlMetaStep && sqlMetaStep.enabled) {
      warningContainer.style.display = 'block';
      while (warningContainer.firstChild) warningContainer.removeChild(warningContainer.firstChild);
      warningContainer.appendChild(
        el('div', { className: 'card', style: { borderLeft: '4px solid var(--color-warning)', padding: '12px 16px' } }, [
          el('strong', { style: { color: 'var(--color-warning)', display: 'block', marginBottom: '4px' }, textContent: 'Educational Security Warning:' }),
          document.createTextNode(sqlMetaStep.warning)
        ])
      );
    } else {
      warningContainer.style.display = 'none';
    }
  }
}

/**
 * Interactive Query Comparison (Concatenated vs Parameterized)
 */
function initQueryComparisonDemo() {
  const usernameInput = document.getElementById('demo-query-username-input');
  const concatQueryOutput = document.getElementById('demo-concat-query-output');
  const paramQueryOutput = document.getElementById('demo-param-query-output');
  const paramBindingsOutput = document.getElementById('demo-param-bindings-output');

  const updateQueries = () => {
    const val = usernameInput ? usernameInput.value : "admin' OR '1'='1";
    // Concatenated query (vulnerable)
    if (concatQueryOutput) {
      setSafeText(concatQueryOutput, `SELECT * FROM accounts WHERE username = '${val}' AND active = 1;`);
    }
    // Parameterized query (secure)
    if (paramQueryOutput) {
      setSafeText(paramQueryOutput, `SELECT * FROM accounts WHERE username = ? AND active = 1;`);
    }
    if (paramBindingsOutput) {
      setSafeText(paramBindingsOutput, `Bound Parameter $1: "${val}" (strictly typed string literal)`);
    }
  };

  if (usernameInput) {
    usernameInput.addEventListener('input', updateQueries);
    updateQueries();
  }
}
