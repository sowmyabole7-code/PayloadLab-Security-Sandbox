/**
 * PayloadLab Main Bootstrap Application
 * Assembles and initializes all sandbox views, state managers, and cross-tab events.
 */

import { initTheme } from './ui/theme.js';
import { initTabs, setActiveTab } from './ui/tabs.js';
import { initRegexView, setRegexInputs } from './ui/regexView.js';
import { initLibraryView } from './ui/libraryView.js';
import { initDetectorView, setDetectorInput } from './ui/detectorView.js';
import { initSanitizerView } from './ui/sanitizerView.js';
import { initLearnView } from './ui/learnView.js';
import { getAllPayloads } from './payloads/payloadStore.js';
import { getAllRules } from './rules/detectionRules.js';
import { DEFAULT_PIPELINE_STEPS } from './sanitizers/sanitizerPipeline.js';
import { showToast, setSafeText } from './ui/domUtils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Theme (Dark security console default, light mode toggle)
  initTheme();

  // 2. Initialize Navigation Tabs
  initTabs((tabId) => {
    // Optional tab-change hooks
  });

  // 3. Initialize Regex View
  initRegexView();

  // 4. Initialize Payload Library View with cross-tab actions
  initLibraryView({
    onSendToRegex: (payloadText) => {
      setActiveTab('regex-tester');
      setRegexInputs({ testString: payloadText });
      showToast('Payload dispatched to Regex Tester!', 'info');
    },
    onSendToDetector: (payloadText) => {
      setActiveTab('detector');
      setDetectorInput(payloadText);
      showToast('Payload dispatched to Vulnerability Detector!', 'info');
    }
  });

  // 5. Initialize Vulnerability Detector View
  initDetectorView();

  // 6. Initialize Sanitizer Lab View
  initSanitizerView();

  // 7. Initialize Learn Hub View
  initLearnView();

  // 8. Update Hero Quick Stats
  updateHeroStats();

  // 9. Reset Button Handler
  const resetBtn = document.getElementById('app-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset PayloadLab back to default state? This will clear custom inputs.')) {
        try {
          localStorage.removeItem('payloadlab_regex_history');
          localStorage.removeItem('payloadlab_disabled_rules');
        } catch (e) {
          console.warn('Reset error:', e);
        }
        window.location.reload();
      }
    });
  }

  // 10. Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Esc closes any open modal or drawer
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open, .drawer-backdrop.open').forEach((el) => {
        el.classList.remove('open');
      });
    }

    // Ctrl+Enter or Cmd+Enter runs tests in active tab
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const activePanel = document.querySelector('.tab-panel.active');
      if (activePanel && activePanel.id === 'tab-regex-tester') {
        const input = document.getElementById('regex-pattern-input');
        if (input) input.dispatchEvent(new Event('input'));
        showToast('Running regex evaluation...', 'info');
      } else if (activePanel && activePanel.id === 'tab-detector') {
        const btn = document.getElementById('detector-analyze-btn');
        if (btn) btn.click();
      }
    }
  });
});

function updateHeroStats() {
  const statPayloads = document.getElementById('stat-total-payloads');
  const statRules = document.getElementById('stat-total-rules');
  const statSanitizers = document.getElementById('stat-total-sanitizers');

  if (statPayloads) setSafeText(statPayloads, getAllPayloads().length);
  if (statRules) setSafeText(statRules, getAllRules().length);
  if (statSanitizers) setSafeText(statSanitizers, DEFAULT_PIPELINE_STEPS.length);
}
