/**
 * Vulnerability Detector Engine
 * Evaluates rules against candidate input, extracts matched fragments,
 * and calculates composite risk levels.
 */

import { getAllRules } from './detectionRules.js';

export function evaluatePayload(inputStr, rules = null) {
  const activeRules = (rules || getAllRules()).filter((r) => r.enabled !== false);
  const text = String(inputStr || '');

  const triggeredRules = [];
  const untriggeredRules = [];
  let totalScore = 0;

  for (const rule of activeRules) {
    try {
      // Create regex with global flag to capture all instances safely
      const flags = rule.flags.includes('g') ? rule.flags : rule.flags + 'g';
      const rx = new RegExp(rule.regex, flags);
      const matches = [];
      let match;
      let lastIndex = -1;
      const MAX_MATCHES_PER_RULE = 50;

      while ((match = rx.exec(text)) !== null) {
        matches.push({
          matchedText: match[0],
          index: match.index,
          length: match[0].length
        });

        if (rx.lastIndex === lastIndex) {
          rx.lastIndex++;
        }
        lastIndex = rx.lastIndex;

        if (matches.length >= MAX_MATCHES_PER_RULE) break;
      }

      if (matches.length > 0) {
        totalScore += rule.weight * Math.min(matches.length, 3);
        triggeredRules.push({
          ...rule,
          matchCount: matches.length,
          matches
        });
      } else {
        untriggeredRules.push(rule);
      }
    } catch (err) {
      console.warn(`Error evaluating rule ${rule.name}:`, err);
      untriggeredRules.push(rule);
    }
  }

  // Determine Risk Category & Score Gauge percentage (0 - 100)
  let riskLevel = 'Clean';
  let riskColor = 'var(--color-success)';
  let riskClass = 'badge-clean';
  let percentage = 0;

  if (totalScore === 0) {
    riskLevel = 'Clean';
    riskColor = 'var(--color-success)';
    riskClass = 'badge-clean';
    percentage = 0;
  } else if (totalScore <= 3) {
    riskLevel = 'Low Risk';
    riskColor = 'var(--color-info)';
    riskClass = 'badge-low';
    percentage = 25;
  } else if (totalScore <= 6) {
    riskLevel = 'Medium Risk';
    riskColor = 'var(--color-warning)';
    riskClass = 'badge-medium';
    percentage = 55;
  } else if (totalScore <= 9) {
    riskLevel = 'High Risk';
    riskColor = '#FB923C';
    riskClass = 'badge-high';
    percentage = 80;
  } else {
    riskLevel = 'Critical Risk';
    riskColor = 'var(--color-danger)';
    riskClass = 'badge-critical';
    percentage = 100;
  }

  return {
    score: totalScore,
    riskLevel,
    riskColor,
    riskClass,
    percentage,
    triggeredRules,
    untriggeredRules,
    totalEvaluated: activeRules.length
  };
}
