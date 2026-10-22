import test from 'node:test';
import assert from 'node:assert';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { PromptStorage } from '../modules/prompts/storage.js';

test('PromptStorage initializes with default seed prompts if file does not exist', async () => {
  const tempFile = path.join(os.tmpdir(), `test_prompts_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.json`);

  try {
    const storage = new PromptStorage(tempFile);
    const prompts = await storage.getAll();

    assert.ok(prompts.length > 0, 'Should load seed prompts');
    const seniorReview = prompts.find(p => p.id === 'code-review-senior');
    assert.ok(seniorReview, 'Seed should contain code-review-senior');
    assert.strictEqual(seniorReview?.category, 'Review');
    assert.ok(fs.existsSync(tempFile), 'Should write file to disk on first run');
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

test('PromptStorage saves, retrieves, and deletes custom prompt', async () => {
  const tempFile = path.join(os.tmpdir(), `test_prompts_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.json`);

  try {
    const storage = new PromptStorage(tempFile);
    await storage.load();

    await storage.set({
      id: 'custom-test',
      title: 'Custom Prompt',
      description: 'Testing custom prompt',
      category: 'Testing',
      tags: ['test'],
      template: 'Run test {{suite}}',
      variables: [{ name: 'suite', defaultValue: 'all' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    });

    const item = await storage.get('custom-test');
    assert.ok(item);
    assert.strictEqual(item?.title, 'Custom Prompt');

    const deleted = await storage.delete('custom-test');
    assert.strictEqual(deleted, true);

    const recheck = await storage.get('custom-test');
    assert.strictEqual(recheck, undefined);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});
