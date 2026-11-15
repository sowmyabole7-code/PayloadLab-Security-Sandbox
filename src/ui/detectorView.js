/**
 * Vulnerability Detector View
 * Risk meter gauge, rule triggering inspection, collapsible untriggered rules,
 * rule enable/disable toggles, custom rule creation modal, and detection limits callout.
 */

import { getAllRules, toggleRuleEnabled, saveCustomRule } from '../rules/detectionRules.js';
import { evaluatePayload } from '../rules/detectorEngine.js';
import { el, createBadge, createIcon, setSafeText, showToast } from './domUtils.js';

let currentDetectorInput = "<script>alert('XSS')</script>\n' OR '1'='1";

export function initDetectorView() {
  const textarea = document.getElementById('detector-input-textarea');
  const analyzeBtn = document.getElementById('detector-analyze-btn');
  const addRuleBtn = document.getElementById('detector-add-rule-btn');

  if (textarea) {
    textarea.value = currentDetectorInput;
    let timer;
    textarea.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        currentDetectorInput = textarea.value;
        runDetection();
      }, 200);
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      if (textarea) currentDetectorInput = textarea.value;
      runDetection();
    });
  }

  if (addRuleBtn) {
    addRuleBtn.addEventListener('click', openAddRuleModal);
  }

  initCustomRuleModal();
  runDetection();
}

/**
 * Run evaluation and update UI
 */
export function runDetection() {
  const result = evaluatePayload(currentDetectorInput);
  updateRiskMeterUI(result);
  renderTriggeredRulesUI(result.triggeredRules);
  renderUntriggeredRulesUI(result.untriggeredRules);
}

/**
 * Update the SVG Risk Gauge and text indicators
 */
function updateRiskMeterUI(result) {
  const scoreVal = document.getElementById('risk-gauge-score');
  const titleBadge = document.getElementById('risk-level-badge');
  const desc = document.getElementById('risk-summary-desc');
  const circleBar = document.getElementById('risk-gauge-bar');

  if (scoreVal) setSafeText(scoreVal, result.score);
  if (titleBadge) {
    titleBadge.className = `badge ${result.riskClass}`;
    setSafeText(titleBadge, result.riskLevel);
  }

  if (desc) {
    if (result.triggeredRules.length === 0) {
      setSafeText(desc, 'No suspicious patterns detected by the active rules.');
    } else {
      setSafeText(
        desc,
        `Triggered ${result.triggeredRules.length} of ${result.totalEvaluated} active rules. Review matched patterns and remediations below.`
      );
    }
  }

  if (circleBar) {
    // Circle radius is 38, circumference is 2 * PI * 38 ≈ 238.76
    const circumference = 238.76;
    const offset = circumference - (result.percentage / 100) * circumference;
    circleBar.style.strokeDasharray = `${circumference} ${circumference}`;
    circleBar.style.strokeDashoffset = offset;
    circleBar.style.stroke = result.riskColor;
  }
}

/**
 * Render Triggered Rules Cards
 */
function renderTriggeredRulesUI(rules) {
  const container = document.getElementById('detector-triggered-list');
  const countBadge = document.getElementById('detector-triggered-count');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  if (countBadge) setSafeText(countBadge, `${rules.length} Triggered`);

  if (rules.length === 0) {
    const cleanBox = el('div', { className: 'card', style: { padding: '24px', textAlign: 'center' } }, [
      createIcon('check', 32),
      el('div', { className: 'card-title', style: { justifyContent: 'center', marginTop: '8px' }, textContent: 'No Signatures Triggered' }),
      el('p', { className: 'card-subtitle', style: { marginTop: '4px' }, textContent: 'Input does not match any active XSS or SQLi heuristic patterns.' })
    ]);
    container.appendChild(cleanBox);
    return;
  }

  rules.forEach((rule) => {
    const card = el('div', { className: 'rule-card rule-card-triggered' });

    // Header
    const header = el('div', { className: 'rule-card-header' }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        el('strong', { style: { fontSize: '15px' }, textContent: rule.name }),
        createBadge(rule.category),
        createBadge(rule.severity)
      ]),
      el('span', { className: 'badge badge-category', textContent: `${rule.matchCount} matched` })
    ]);

    // Description
    const desc = el('p', { style: { fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }, textContent: rule.description });

    // Matched fragments (Rendered strictly as inert text)
    const matchesBox = el('div', { className: 'rule-matches' });
    matchesBox.appendChild(el('strong', { style: { display: 'block', marginBottom: '4px', color: 'var(--color-danger)' }, textContent: 'Matched Pattern Fragments:' }));

    rule.matches.slice(0, 5).forEach((m) => {
      const matchRow = el('div', { style: { fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '2px 0' } }, [
        el('span', { style: { color: 'var(--color-text-dim)' }, textContent: `[index ${m.index}]: ` }),
        el('span', { style: { backgroundColor: 'var(--color-danger-subtle)', padding: '1px 4px', borderRadius: '3px' }, textContent: m.matchedText })
      ]);
      matchesBox.appendChild(matchRow);
    });

    // Secure Remediation
    const remediation = el('div', { className: 'remediation-box' }, [
      createIcon('shield', 14),
      el('strong', { textContent: ' Secure Remediation: ' }),
      document.createTextNode(rule.remediation)
    ]);

    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(matchesBox);
    card.appendChild(remediation);

    container.appendChild(card);
  });
}

/**
 * Render Untriggered Rules Accordion
 */
function renderUntriggeredRulesUI(rules) {
  const container = document.getElementById('detector-untriggered-list');
  const countBadge = document.getElementById('detector-untriggered-count');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  if (countBadge) setSafeText(countBadge, `${rules.length} Clean`);

  rules.forEach((rule) => {
    const row = el('div', {
      className: 'card',
      style: { padding: '10px 14px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
    });

    const left = el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
      el('input', {
        type: 'checkbox',
        id: `rule-chk-${rule.id}`,
        checked: rule.enabled !== false,
        onchange: (e) => {
          toggleRuleEnabled(rule.id, e.target.checked);
          runDetection();
        }
      }),
      el('label', { htmlFor: `rule-chk-${rule.id}`, style: { fontSize: '13px', cursor: 'pointer' }, textContent: rule.name }),
      createBadge(rule.category)
    ]);

    const right = el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
      createBadge(rule.severity)
    ]);

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);
  });
}

/**
 * Custom Rule Modal
 */
function initCustomRuleModal() {
  const modal = document.getElementById('custom-rule-modal');
  const closeBtn = document.getElementById('custom-rule-close-btn');
  const cancelBtn = document.getElementById('custom-rule-cancel-btn');
  const form = document.getElementById('custom-rule-form');

  const closeModal = () => {
    if (modal) modal.classList.remove('open');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('custom-rule-name')?.value || 'Custom Rule';
      const category = document.getElementById('custom-rule-category')?.value || 'Custom';
      const severity = document.getElementById('custom-rule-severity')?.value || 'Medium';
      const regex = document.getElementById('custom-rule-regex')?.value || '';
      const flags = document.getElementById('custom-rule-flags')?.value || 'i';
      const description = document.getElementById('custom-rule-desc')?.value || 'Custom security rule.';
      const remediation = document.getElementById('custom-rule-remediation')?.value || 'Apply secure coding defenses.';

      try {
        new RegExp(regex, flags);
      } catch (err) {
        showToast(`Invalid Regular Expression: ${err.message}`, 'danger');
        return;
      }

      saveCustomRule({ name, category, severity, regex, flags, description, remediation });
      runDetection();
      closeModal();
      form.reset();
      showToast('Custom detection rule registered!', 'success');
    });
  }
}

function openAddRuleModal() {
  const modal = document.getElementById('custom-rule-modal');
  if (modal) modal.classList.add('open');
}

/**
 * Public method to set input string from library
 */
export function setDetectorInput(text) {
  const textarea = document.getElementById('detector-input-textarea');
  if (textarea) {
    textarea.value = text;
    currentDetectorInput = text;
    runDetection();
  }
}
