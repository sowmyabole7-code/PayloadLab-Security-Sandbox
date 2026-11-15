/**
 * Payload Library View
 * Curated textbook payloads, benign look-alikes for false positive education,
 * category filters, search, custom payload modal, and cross-tab dispatching.
 */

import { getAllPayloads, saveCustomPayload, deleteCustomPayload } from '../payloads/payloadStore.js';
import { el, createBadge, createIcon, copyToClipboard, showToast } from './domUtils.js';

let activeCategory = 'all';
let searchQuery = '';
let onSendToRegexCallback = null;
let onSendToDetectorCallback = null;

export function initLibraryView({ onSendToRegex, onSendToDetector }) {
  onSendToRegexCallback = onSendToRegex;
  onSendToDetectorCallback = onSendToDetector;

  const searchInput = document.getElementById('payload-search-input');
  const chipButtons = document.querySelectorAll('.filter-chip[data-category]');
  const addPayloadBtn = document.getElementById('add-custom-payload-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderPayloadCards();
    });
  }

  chipButtons.forEach((chip) => {
    chip.addEventListener('click', () => {
      chipButtons.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.getAttribute('data-category');
      renderPayloadCards();
    });
  });

  if (addPayloadBtn) {
    addPayloadBtn.addEventListener('click', openAddPayloadModal);
  }

  initCustomPayloadModal();
  renderPayloadCards();
}

export function renderPayloadCards() {
  const container = document.getElementById('payload-grid-container');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  const allPayloads = getAllPayloads();
  const filtered = allPayloads.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery) ||
      item.payload.toLowerCase().includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    const emptyState = el('div', { className: 'empty-state', style: { gridColumn: '1 / -1' } }, [
      createIcon('search', 32),
      el('div', { className: 'empty-state-title', textContent: 'No payloads match your criteria' }),
      el('div', { className: 'empty-state-desc', textContent: 'Try adjusting your search query or category filter.' })
    ]);
    container.appendChild(emptyState);
    return;
  }

  filtered.forEach((item) => {
    const card = el('div', { className: 'card payload-card' });

    // Top section: title & badges
    const top = el('div', { className: 'payload-card-top' }, [
      el('div', { className: 'payload-card-title-row' }, [
        el('div', { className: 'payload-name', textContent: item.name }),
        el('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [
          createBadge(item.category),
          createBadge(item.severity)
        ])
      ]),
      // Inert Monospace Code Block
      el('div', { className: 'code-block', style: { minHeight: '52px' } }, [item.payload]),
      // Danger note
      el('div', { className: 'payload-danger-note', textContent: item.description })
    ]);

    // Bottom action buttons
    const actions = el('div', { className: 'payload-card-actions' });

    // Custom delete button if custom
    if (item.isCustom) {
      const deleteBtn = el(
        'button',
        {
          className: 'btn btn-outline btn-xs',
          title: 'Delete custom payload',
          onclick: () => {
            deleteCustomPayload(item.id);
            renderPayloadCards();
            showToast('Custom payload deleted', 'info');
          }
        },
        [createIcon('x', 14)]
      );
      actions.appendChild(deleteBtn);
    }

    const copyBtn = el(
      'button',
      {
        className: 'btn btn-outline btn-sm',
        title: 'Copy payload to clipboard',
        onclick: () => copyToClipboard(item.payload, 'Payload copied as inert text!')
      },
      [createIcon('copy', 14), 'Copy']
    );

    const sendToRegexBtn = el(
      'button',
      {
        className: 'btn btn-secondary btn-sm',
        title: 'Send to Regex Tester',
        onclick: () => {
          if (onSendToRegexCallback) {
            onSendToRegexCallback(item.payload);
          }
        }
      },
      [createIcon('code', 14), 'Test Regex']
    );

    const sendToDetectorBtn = el(
      'button',
      {
        className: 'btn btn-primary btn-sm',
        title: 'Send to Vulnerability Detector',
        onclick: () => {
          if (onSendToDetectorCallback) {
            onSendToDetectorCallback(item.payload);
          }
        }
      },
      [createIcon('shield', 14), 'Analyze']
    );

    actions.appendChild(copyBtn);
    actions.appendChild(sendToRegexBtn);
    actions.appendChild(sendToDetectorBtn);

    card.appendChild(top);
    card.appendChild(actions);

    container.appendChild(card);
  });
}

function initCustomPayloadModal() {
  const modalBackdrop = document.getElementById('custom-payload-modal');
  const closeBtn = document.getElementById('custom-payload-close-btn');
  const cancelBtn = document.getElementById('custom-payload-cancel-btn');
  const form = document.getElementById('custom-payload-form');

  const closeModal = () => {
    if (modalBackdrop) modalBackdrop.classList.remove('open');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('custom-payload-name')?.value || 'Custom Test String';
      const category = document.getElementById('custom-payload-category')?.value || 'Custom';
      const severity = document.getElementById('custom-payload-severity')?.value || 'Medium';
      const payload = document.getElementById('custom-payload-text')?.value || '';
      const description = document.getElementById('custom-payload-desc')?.value || 'Custom sample test string.';

      if (!payload.trim()) {
        showToast('Payload string cannot be empty', 'warning');
        return;
      }

      saveCustomPayload({ name, category, severity, payload, description });
      renderPayloadCards();
      closeModal();
      form.reset();
      showToast('Custom payload saved to library!', 'success');
    });
  }
}

function openAddPayloadModal() {
  const modalBackdrop = document.getElementById('custom-payload-modal');
  if (modalBackdrop) modalBackdrop.classList.add('open');
}
