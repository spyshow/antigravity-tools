import test from 'node:test';
import assert from 'node:assert';
import { extractVariablesFromTemplate, interpolate, syncVariables } from '../modules/prompts/interpolator.js';

test('extractVariablesFromTemplate extracts variables with and without defaults', () => {
  const tmpl = 'Hello {{name:World}}, you are reviewing {{language:TypeScript}} in {{project}}';
  const vars = extractVariablesFromTemplate(tmpl);

  assert.strictEqual(vars.length, 3);
  assert.strictEqual(vars[0].name, 'name');
  assert.strictEqual(vars[0].defaultValue, 'World');
  assert.strictEqual(vars[0].required, false);

  assert.strictEqual(vars[1].name, 'language');
  assert.strictEqual(vars[1].defaultValue, 'TypeScript');

  assert.strictEqual(vars[2].name, 'project');
  assert.strictEqual(vars[2].defaultValue, undefined);
  assert.strictEqual(vars[2].required, true);
});

test('interpolate fills provided values', () => {
  const tmpl = 'Review {{language:JavaScript}} file {{file}}';
  const vars = extractVariablesFromTemplate(tmpl);

  const res = interpolate(tmpl, vars, { language: 'Rust', file: 'main.rs' });
  assert.strictEqual(res.rendered, 'Review Rust file main.rs');
  assert.strictEqual(res.variablesUsed['language'], 'Rust');
  assert.strictEqual(res.variablesUsed['file'], 'main.rs');
  assert.strictEqual(res.missingVariables.length, 0);
});

test('interpolate falls back to default values when empty or undefined', () => {
  const tmpl = 'Format in {{style:standard}}';
  const vars = extractVariablesFromTemplate(tmpl);

  const res = interpolate(tmpl, vars, {});
  assert.strictEqual(res.rendered, 'Format in standard');
  assert.strictEqual(res.variablesUsed['style'], 'standard');
});

test('syncVariables preserves existing variable metadata', () => {
  const tmpl = 'Task: {{action}} on {{target}}';
  const existing = [
    { name: 'action', description: 'Action to perform', defaultValue: 'build', required: false }
  ];

  const synced = syncVariables(tmpl, existing);
  assert.strictEqual(synced.length, 2);
  const actionVar = synced.find(v => v.name === 'action');
  assert.strictEqual(actionVar?.description, 'Action to perform');
  assert.strictEqual(actionVar?.defaultValue, 'build');
});
