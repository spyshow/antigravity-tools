import { PromptStorage } from './storage.js';
import { PromptFilterOptions, PromptItem, RenderResult, PasteResult, PromptVariable } from './types.js';
import { interpolate, syncVariables } from './interpolator.js';
import { copyToClipboard } from './clipboard.js';

export class PromptService {
  private storage: PromptStorage;

  constructor(storage?: PromptStorage) {
    this.storage = storage || new PromptStorage();
  }

  public getStorage(): PromptStorage {
    return this.storage;
  }

  /**
   * Lists prompts matching optional filter criteria (search, category, tag, favorite).
   */
  public async listPrompts(options: PromptFilterOptions = {}): Promise<PromptItem[]> {
    let items = await this.storage.getAll();

    if (options.category) {
      const catLower = options.category.toLowerCase().trim();
      items = items.filter(p => p.category.toLowerCase() === catLower);
    }

    if (options.tag) {
      const tagLower = options.tag.toLowerCase().trim();
      items = items.filter(p => p.tags.some(t => t.toLowerCase() === tagLower));
    }

    if (options.favoriteOnly) {
      items = items.filter(p => p.favorite === true);
    }

    if (options.search) {
      const query = options.search.toLowerCase().trim();
      items = items.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query)) ||
        p.category.toLowerCase().includes(query) ||
        p.template.toLowerCase().includes(query)
      );
    }

    // Sort: favorites first, then by usageCount descending, then title
    return items.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
      return a.title.localeCompare(b.title);
    });
  }

  /**
   * Retrieves a prompt by ID or case-insensitive exact title match.
   */
  public async getPrompt(idOrTitle: string): Promise<PromptItem | undefined> {
    const direct = await this.storage.get(idOrTitle);
    if (direct) return direct;

    const all = await this.storage.getAll();
    const needle = idOrTitle.toLowerCase().trim();
    return all.find(p => p.id.toLowerCase() === needle || p.title.toLowerCase() === needle);
  }

  /**
   * Saves or updates a prompt in the library.
   * Automatically extracts and syncs template variables.
   */
  public async savePrompt(input: {
    id?: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    template: string;
    variables?: PromptVariable[];
    favorite?: boolean;
  }): Promise<PromptItem> {
    const now = new Date().toISOString();
    let promptId = input.id;

    if (!promptId) {
      // Auto-generate clean slug from title
      promptId = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `prompt-${Date.now()}`;
    }

    const existing = await this.storage.get(promptId);

    // Sync variables from template
    const vars = syncVariables(input.template, input.variables || existing?.variables || []);

    const item: PromptItem = {
      id: promptId,
      title: input.title.trim(),
      description: (input.description || existing?.description || '').trim(),
      category: (input.category || existing?.category || 'General').trim(),
      tags: Array.isArray(input.tags)
        ? Array.from(new Set(input.tags.map(t => t.trim().toLowerCase()).filter(Boolean)))
        : (existing?.tags || []),
      template: input.template,
      variables: vars,
      favorite: input.favorite !== undefined ? input.favorite : (existing?.favorite || false),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      usageCount: existing ? existing.usageCount : 0
    };

    await this.storage.set(item);
    return item;
  }

  /**
   * Deletes a prompt by ID.
   */
  public async deletePrompt(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  /**
   * Toggles the favorite status of a prompt.
   */
  public async toggleFavorite(id: string): Promise<PromptItem | undefined> {
    const prompt = await this.storage.get(id);
    if (!prompt) return undefined;

    prompt.favorite = !prompt.favorite;
    prompt.updatedAt = new Date().toISOString();
    await this.storage.set(prompt);
    return prompt;
  }

  /**
   * Renders a prompt template with provided variables without modifying clipboard.
   */
  public async renderPrompt(idOrTitle: string, values: Record<string, string> = {}): Promise<RenderResult> {
    const prompt = await this.getPrompt(idOrTitle);
    if (!prompt) {
      throw new Error(`Prompt not found with id or title: "${idOrTitle}"`);
    }

    const { rendered, variablesUsed, missingVariables } = interpolate(prompt.template, prompt.variables, values);

    return {
      promptId: prompt.id,
      title: prompt.title,
      rendered,
      variablesUsed,
      missingVariables
    };
  }

  /**
   * Core feature: Renders the prompt, copies it directly to the system clipboard,
   * and increments the prompt's usage counter.
   */
  public async pastePrompt(idOrTitle: string, values: Record<string, string> = {}): Promise<PasteResult> {
    const prompt = await this.getPrompt(idOrTitle);
    if (!prompt) {
      throw new Error(`Prompt not found with id or title: "${idOrTitle}"`);
    }

    const renderRes = await this.renderPrompt(idOrTitle, values);

    // Copy to system clipboard
    const clipRes = await copyToClipboard(renderRes.rendered);

    // Update usage count
    prompt.usageCount = (prompt.usageCount || 0) + 1;
    prompt.updatedAt = new Date().toISOString();
    await this.storage.set(prompt);

    return {
      ...renderRes,
      copiedToClipboard: clipRes.success,
      clipboardMethod: clipRes.method,
      message: clipRes.success
        ? `Prompt "${prompt.title}" was rendered and copied to your clipboard! Ready to paste into Antigravity chat or editor.`
        : `Prompt "${prompt.title}" was rendered, but clipboard write failed: ${clipRes.message}`
    };
  }

  /**
   * Returns all unique categories and tags with counts.
   */
  public async getCategoriesAndTags(): Promise<{
    categories: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    totalPrompts: number;
  }> {
    const prompts = await this.storage.getAll();
    const catMap = new Map<string, number>();
    const tagMap = new Map<string, number>();

    for (const p of prompts) {
      const cat = p.category || 'General';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);

      for (const t of p.tags || []) {
        tagMap.set(t, (tagMap.get(t) || 0) + 1);
      }
    }

    const categories = Array.from(catMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const tags = Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      categories,
      tags,
      totalPrompts: prompts.length
    };
  }

  /**
   * Exports entire prompt library to JSON string.
   */
  public async exportJson(): Promise<string> {
    const prompts = await this.storage.getAll();
    return JSON.stringify(prompts, null, 2);
  }

  /**
   * Imports prompts from JSON string (merge or replace).
   */
  public async importJson(jsonStr: string, mode: 'merge' | 'replace' = 'merge'): Promise<{ imported: number; total: number }> {
    const parsed = JSON.parse(jsonStr);
    const items: PromptItem[] = Array.isArray(parsed) ? parsed : (parsed.prompts || []);

    if (mode === 'replace') {
      await this.storage.reset();
      for (const item of items) {
        await this.storage.set(item);
      }
    } else {
      for (const item of items) {
        await this.storage.set(item);
      }
    }

    const all = await this.storage.getAll();
    return {
      imported: items.length,
      total: all.length
    };
  }
}
