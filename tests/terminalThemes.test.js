import test from 'node:test';
import assert from 'node:assert/strict';

import { THEMES, resolveThemeSelection } from '../lib/terminalThemes.js';

test('terminal themes: registry has 12 themes', () => {
  assert.equal(Array.isArray(THEMES), true);
  assert.equal(THEMES.length, 12);
});

test('terminal themes: resolveThemeSelection supports numeric (1-based)', () => {
  const t1 = resolveThemeSelection('1');
  assert.ok(t1);
  assert.equal(t1.id, THEMES[0].id);

  const t12 = resolveThemeSelection('12');
  assert.ok(t12);
  assert.equal(t12.id, THEMES[11].id);
});

test('terminal themes: resolveThemeSelection supports id and label', () => {
  assert.equal(resolveThemeSelection('dracula')?.id, 'dracula');
  assert.equal(resolveThemeSelection('Solarized Light')?.id, 'solarized-light');
  assert.equal(resolveThemeSelection('solarized-light')?.id, 'solarized-light');
});

test('terminal themes: resolveThemeSelection returns null for unknown', () => {
  assert.equal(resolveThemeSelection(''), null);
  assert.equal(resolveThemeSelection('999'), null);
  assert.equal(resolveThemeSelection('not-a-real-theme'), null);
});


