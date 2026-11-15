/**
 * Regex Pattern Explainer
 * Parses a regular expression string into structural tokens with educational explanations:
 * Anchors, Quantifiers, Character Classes, Groups, Alternations, and Escapes.
 */

export function explainPattern(pattern) {
  if (!pattern) return [];

  const tokens = [];
  let i = 0;
  const len = pattern.length;

  while (i < len) {
    const ch = pattern[i];

    // 1. Escaped sequences: \d, \w, \s, \b, \., etc.
    if (ch === '\\' && i + 1 < len) {
      const next = pattern[i + 1];
      const seq = ch + next;

      if (seq === '\\d') {
        tokens.push({ symbol: '\\d', type: 'Character Class', desc: 'Matches any digit [0-9]' });
        i += 2;
        continue;
      }
      if (seq === '\\D') {
        tokens.push({ symbol: '\\D', type: 'Character Class', desc: 'Matches any non-digit [^0-9]' });
        i += 2;
        continue;
      }
      if (seq === '\\w') {
        tokens.push({ symbol: '\\w', type: 'Character Class', desc: 'Matches any word character (alphanumeric + underscore)' });
        i += 2;
        continue;
      }
      if (seq === '\\W') {
        tokens.push({ symbol: '\\W', type: 'Character Class', desc: 'Matches any non-word character' });
        i += 2;
        continue;
      }
      if (seq === '\\s') {
        tokens.push({ symbol: '\\s', type: 'Character Class', desc: 'Matches any whitespace character (space, tab, newline)' });
        i += 2;
        continue;
      }
      if (seq === '\\S') {
        tokens.push({ symbol: '\\S', type: 'Character Class', desc: 'Matches any non-whitespace character' });
        i += 2;
        continue;
      }
      if (seq === '\\b') {
        tokens.push({ symbol: '\\b', type: 'Anchor', desc: 'Word boundary (between word and non-word characters)' });
        i += 2;
        continue;
      }
      if (seq === '\\B') {
        tokens.push({ symbol: '\\B', type: 'Anchor', desc: 'Non-word boundary' });
        i += 2;
        continue;
      }

      // Hex or Unicode escapes: \xHH, \uHHHH
      if (next === 'x' && i + 3 < len) {
        const hex = pattern.slice(i, i + 4);
        tokens.push({ symbol: hex, type: 'Escape Sequence', desc: `Hex-encoded byte literal ${hex}` });
        i += 4;
        continue;
      }
      if (next === 'u' && i + 5 < len) {
        const uni = pattern.slice(i, i + 6);
        tokens.push({ symbol: uni, type: 'Escape Sequence', desc: `Unicode code point literal ${uni}` });
        i += 6;
        continue;
      }

      // Escaped punctuation: \., \*, \+, \?, \/, etc.
      tokens.push({ symbol: seq, type: 'Escaped Literal', desc: `Literal character '${next}' (escaped)` });
      i += 2;
      continue;
    }

    // 2. Anchors: ^ and $
    if (ch === '^') {
      tokens.push({ symbol: '^', type: 'Anchor', desc: 'Asserts position at the beginning of the string (or line in multiline mode)' });
      i++;
      continue;
    }
    if (ch === '$') {
      tokens.push({ symbol: '$', type: 'Anchor', desc: 'Asserts position at the end of the string (or line in multiline mode)' });
      i++;
      continue;
    }

    // 3. Dot: .
    if (ch === '.') {
      tokens.push({ symbol: '.', type: 'Character Class', desc: 'Matches any character except line terminators (unless dotAll "s" flag is on)' });
      i++;
      continue;
    }

    // 4. Character Classes: [...] or [^...]
    if (ch === '[') {
      let closeIndex = pattern.indexOf(']', i + 1);
      // Handle escaped ] inside class
      while (closeIndex !== -1 && pattern[closeIndex - 1] === '\\') {
        closeIndex = pattern.indexOf(']', closeIndex + 1);
      }

      if (closeIndex !== -1) {
        const fullClass = pattern.slice(i, closeIndex + 1);
        const isNegated = fullClass.startsWith('[^');
        tokens.push({
          symbol: fullClass,
          type: 'Character Set',
          desc: isNegated
            ? `Negated set: matches any character NOT in '${fullClass.slice(2, -1)}'`
            : `Set: matches any single character in '${fullClass.slice(1, -1)}'`
        });
        i = closeIndex + 1;
        continue;
      }
    }

    // 5. Quantifiers: *, +, ?, {n}, {n,}, {n,m} (with lazy ? suffix)
    if (ch === '*' || ch === '+' || ch === '?') {
      const isLazy = pattern[i + 1] === '?';
      const symbol = isLazy ? ch + '?' : ch;
      const laziness = isLazy ? ' (Lazy / Non-greedy)' : ' (Greedy)';

      let desc = '';
      if (ch === '*') desc = `Matches 0 or more times${laziness}`;
      else if (ch === '+') desc = `Matches 1 or more times${laziness}`;
      else if (ch === '?') desc = `Matches 0 or 1 time${laziness}`;

      tokens.push({ symbol, type: 'Quantifier', desc });
      i += isLazy ? 2 : 1;
      continue;
    }

    if (ch === '{') {
      const closeBrace = pattern.indexOf('}', i);
      if (closeBrace !== -1) {
        const range = pattern.slice(i, closeBrace + 1);
        const isLazy = pattern[closeBrace + 1] === '?';
        const symbol = isLazy ? range + '?' : range;
        const laziness = isLazy ? ' (Lazy)' : ' (Greedy)';
        tokens.push({
          symbol,
          type: 'Quantifier Range',
          desc: `Matches range ${range}${laziness}`
        });
        i = closeBrace + 1 + (isLazy ? 1 : 0);
        continue;
      }
    }

    // 6. Groups: ( ... )
    if (ch === '(') {
      if (pattern.startsWith('(?<', i)) {
        const nameEnd = pattern.indexOf('>', i + 3);
        const name = nameEnd !== -1 ? pattern.slice(i + 3, nameEnd) : 'group';
        tokens.push({ symbol: `(?<${name}>...)`, type: 'Named Group', desc: `Named capturing group '<${name}>'` });
        i = nameEnd !== -1 ? nameEnd + 1 : i + 3;
        continue;
      }
      if (pattern.startsWith('(?:', i)) {
        tokens.push({ symbol: '(?:...)', type: 'Non-Capturing Group', desc: 'Groups elements together without saving the matched substring' });
        i += 3;
        continue;
      }
      if (pattern.startsWith('(?=', i)) {
        tokens.push({ symbol: '(?=...)', type: 'Lookahead', desc: 'Positive Lookahead: asserts that what immediately follows matches pattern' });
        i += 3;
        continue;
      }
      if (pattern.startsWith('(?!', i)) {
        tokens.push({ symbol: '(?!...)', type: 'Lookahead', desc: 'Negative Lookahead: asserts that what immediately follows does NOT match pattern' });
        i += 3;
        continue;
      }
      if (pattern.startsWith('(?<=', i)) {
        tokens.push({ symbol: '(?<=...)', type: 'Lookbehind', desc: 'Positive Lookbehind: asserts that what immediately precedes matches pattern' });
        i += 4;
        continue;
      }
      if (pattern.startsWith('(?<!', i)) {
        tokens.push({ symbol: '(?<!...)', type: 'Lookbehind', desc: 'Negative Lookbehind: asserts that what immediately precedes does NOT match pattern' });
        i += 4;
        continue;
      }

      tokens.push({ symbol: '( ... )', type: 'Capture Group', desc: 'Captures matched subpattern into numbered group' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ symbol: ')', type: 'Group End', desc: 'Closes preceding group' });
      i++;
      continue;
    }

    // 7. Alternation: |
    if (ch === '|') {
      tokens.push({ symbol: '|', type: 'Alternation', desc: 'Matches expression before OR after the pipe (OR operator)' });
      i++;
      continue;
    }

    // 8. Literals: group adjacent normal characters
    let literal = ch;
    while (
      i + 1 < len &&
      !['\\', '^', '$', '.', '[', '*', '+', '?', '{', '(', ')', '|'].includes(pattern[i + 1])
    ) {
      i++;
      literal += pattern[i];
    }

    tokens.push({
      symbol: literal,
      type: 'Literal String',
      desc: `Matches the exact text "${literal}"`
    });
    i++;
  }

  return tokens;
}
