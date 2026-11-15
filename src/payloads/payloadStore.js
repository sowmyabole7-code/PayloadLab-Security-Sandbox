/**
 * Payload Store
 * Manages default and custom payloads with safe localStorage persistence.
 */

import { DEFAULT_PAYLOADS } from './payloadData.js';

const STORAGE_KEY = 'payloadlab_custom_payloads';

export function getAllPayloads() {
  const custom = getCustomPayloads();
  return [...DEFAULT_PAYLOADS, ...custom];
}

export function getCustomPayloads() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load custom payloads from localStorage:', e);
    return [];
  }
}

export function saveCustomPayload(payloadObj) {
  try {
    const custom = getCustomPayloads();
    const newEntry = {
      id: 'custom-' + Date.now(),
      name: payloadObj.name || 'Custom Payload',
      category: payloadObj.category || 'Custom',
      severity: payloadObj.severity || 'Medium',
      payload: String(payloadObj.payload || ''),
      description: payloadObj.description || 'User-defined custom testing sample.',
      isCustom: true
    };
    custom.push(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    return newEntry;
  } catch (e) {
    console.warn('Failed to save custom payload to localStorage:', e);
    throw new Error('Could not persist to localStorage.');
  }
}

export function deleteCustomPayload(id) {
  try {
    const custom = getCustomPayloads();
    const filtered = custom.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.warn('Failed to delete custom payload from localStorage:', e);
    return false;
  }
}

export function clearCustomPayloads() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear custom payloads:', e);
  }
}
