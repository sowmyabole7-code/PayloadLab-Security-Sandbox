/**
 * Tab Navigation Controller
 * Manages active view switching and deep-linking via hash routes.
 */

const VALID_TABS = ['regex-tester', 'payload-library', 'detector', 'sanitizer-lab', 'learn'];

export function initTabs(onTabChange) {
  const tabButtons = document.querySelectorAll('.tab-btn[data-tab]');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      setActiveTab(tabId);
      if (typeof onTabChange === 'function') {
        onTabChange(tabId);
      }
    });
  });

  // Handle URL hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (VALID_TABS.includes(hash)) {
      setActiveTab(hash);
      if (typeof onTabChange === 'function') {
        onTabChange(hash);
      }
    }
  });

  // Initialize initial tab from hash or default to 'regex-tester'
  const initialHash = window.location.hash.replace('#', '');
  if (VALID_TABS.includes(initialHash)) {
    setActiveTab(initialHash);
  } else {
    setActiveTab('regex-tester');
  }
}

export function setActiveTab(tabId) {
  if (!VALID_TABS.includes(tabId)) return;

  // Update tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn[data-tab]');
  tabButtons.forEach((btn) => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  // Update tab panels
  const panels = document.querySelectorAll('.tab-panel');
  panels.forEach((panel) => {
    const isTarget = panel.id === `tab-${tabId}`;
    panel.classList.toggle('active', isTarget);
    panel.hidden = !isTarget;
  });

  // Update URL hash without jumping
  if (window.location.hash !== `#${tabId}`) {
    history.replaceState(null, '', `#${tabId}`);
  }
}
