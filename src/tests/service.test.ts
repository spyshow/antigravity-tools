import test from 'node:test';
import assert from 'node:assert';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { PromptStorage } from '../modules/prompts/storage.js';
import { PromptService } from '../modules/prompts/service.js';

test('PromptService filters by category, tag, and search query', async () => {
  const tempFile = path.join(os.tmpdir(), `test_service_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.json`);

  try {
    const storage = new PromptStorage(tempFile);
    const service = new PromptService(storage);

    // Filter category
    const reviewPrompts = await service.listPrompts({ category: 'Review' });
    assert.ok(reviewPrompts.length > 0);
    assert.ok(reviewPrompts.every(p => p.category.toLowerCase() === 'review'));

    // Filter tag
    const tddPrompts = await service.listPrompts({ tag: 'tdd' });
    assert.ok(tddPrompts.length > 0);
    assert.ok(tddPrompts.some(p => p.tags.includes('tdd')));

    // Search query
    const searchRes = await service.listPrompts({ search: 'diagnose' });
    assert.ok(searchRes.length > 0);
    assert.ok(searchRes.some(p => p.id === 'systematic-debugging'));
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

test('PromptService saves prompt and auto-detects variables', async () => {
  const tempFile = path.join(os.tmpdir(), `test_service_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.json`);

  try {
    const storage = new PromptStorage(tempFile);
    const service = new PromptService(storage);

    const saved = await service.savePrompt({
      title: 'API Endpoint Generator',
      category: 'Backend',
      tags: ['api', 'rest'],
      template: 'Create a {{method:GET}} endpoint for {{resource}} using {{framework:Express}}.'
    });

    assert.strictEqual(saved.id, 'api-endpoint-generator');
    assert.strictEqual(saved.variables.length, 3);
    const methodVar = saved.variables.find(v => v.name === 'method');
    assert.strictEqual(methodVar?.defaultValue, 'GET');

    // Render it
    const renderRes = await service.renderPrompt(saved.id, {
      method: 'POST',
      resource: 'users'
    });

    assert.strictEqual(renderRes.rendered, 'Create a POST endpoint for users using Express.');
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

test('PromptService pastePrompt increments usage count and renders properly', async () => {
  const tempFile = path.join(os.tmpdir(), `test_service_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.json`);

  try {
    const storage = new PromptStorage(tempFile);
    const service = new PromptService(storage);

    const initial = await service.getPrompt('code-review-senior');
    assert.ok(initial);
    const initialCount = initial.usageCount;

    const res = await service.pastePrompt('code-review-senior', {
      language: 'Go',
      target_code: 'service.go'
    });

    assert.ok(res.rendered.includes('idiomatic Go'));
    assert.ok(res.rendered.includes('service.go'));

    const updated = await service.getPrompt('code-review-senior');
    assert.strictEqual(updated?.usageCount, initialCount + 1);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});
