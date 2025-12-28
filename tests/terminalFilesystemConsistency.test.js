import test from 'node:test';
import assert from 'node:assert/strict';

import { hostFilesystems } from '../lib/terminalFilesystem.js';

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function walkAndAssertNamesMatchKeys({ host, node, absPath }) {
  assert.ok(node, `[${host}] missing node at ${absPath}`);
  assert.ok(isObject(node), `[${host}] node at ${absPath} must be an object`);
  assert.ok(node.type === 'file' || node.type === 'directory', `[${host}] node at ${absPath} has invalid type`);
  assert.equal(typeof node.name, 'string', `[${host}] node at ${absPath} must have string name`);

  if (node.type !== 'directory') return;

  if (!node.contents) return;
  assert.ok(isObject(node.contents), `[${host}] directory contents at ${absPath} must be an object`);

  for (const [key, child] of Object.entries(node.contents)) {
    const childPath = absPath === '/' ? `/${key}` : `${absPath}/${key}`;
    assert.equal(
      child?.name,
      key,
      `[${host}] directory entry key "${key}" must match child.name "${child?.name}" at ${childPath}`
    );
    walkAndAssertNamesMatchKeys({ host, node: child, absPath: childPath });
  }
}

test('filesystem seed: directory entry keys match node.name (all hosts)', () => {
  for (const [host, root] of Object.entries(hostFilesystems)) {
    assert.ok(root, `[${host}] missing filesystem root`);
    assert.equal(root.type, 'directory', `[${host}] root must be a directory`);
    assert.equal(root.name, '/', `[${host}] root name must be "/"`);
    walkAndAssertNamesMatchKeys({ host, node: root, absPath: '/' });
  }
});


