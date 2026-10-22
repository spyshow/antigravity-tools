import * as fs from 'fs';
import * as path from 'path';
import { PromptItem } from './types.js';
import { DEFAULT_PROMPTS } from './default-prompts.js';
import { getPromptsStoragePath } from '../../config.js';

export interface StorageData {
  version: number;
  updatedAt: string;
  prompts: PromptItem[];
}

export class PromptStorage {
  private filePath: string;
  private cache: Map<string, PromptItem> = new Map();
  private loaded: boolean = false;

  constructor(customPath?: string) {
    this.filePath = customPath || getPromptsStoragePath();
  }

  public getStoragePath(): string {
    return this.filePath;
  }

  public async load(): Promise<Map<string, PromptItem>> {
    if (this.loaded) {
      return this.cache;
    }

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = await fs.promises.readFile(this.filePath, 'utf-8');
        const parsed: StorageData = JSON.parse(raw);
        this.cache.clear();
        for (const prompt of parsed.prompts) {
          this.cache.set(prompt.id, prompt);
        }
      } else {
        // First-run seed
        this.cache.clear();
        for (const prompt of DEFAULT_PROMPTS) {
          this.cache.set(prompt.id, { ...prompt });
        }
        await this.persist();
      }
    } catch (err) {
      // Fallback to default prompts in case of corrupted file
      console.error(`[PromptStorage] Error reading ${this.filePath}, falling back to defaults`, err);
      this.cache.clear();
      for (const prompt of DEFAULT_PROMPTS) {
        this.cache.set(prompt.id, { ...prompt });
      }
    }

    this.loaded = true;
    return this.cache;
  }

  public async persist(): Promise<void> {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    const data: StorageData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      prompts: Array.from(this.cache.values())
    };

    const tempFile = `${this.filePath}.${Date.now()}.tmp`;
    const jsonStr = JSON.stringify(data, null, 2);

    await fs.promises.writeFile(tempFile, jsonStr, 'utf-8');
    await fs.promises.rename(tempFile, this.filePath);
  }

  public async getAll(): Promise<PromptItem[]> {
    await this.load();
    return Array.from(this.cache.values());
  }

  public async get(id: string): Promise<PromptItem | undefined> {
    await this.load();
    return this.cache.get(id);
  }

  public async set(prompt: PromptItem): Promise<void> {
    await this.load();
    this.cache.set(prompt.id, prompt);
    await this.persist();
  }

  public async delete(id: string): Promise<boolean> {
    await this.load();
    if (!this.cache.has(id)) {
      return false;
    }
    this.cache.delete(id);
    await this.persist();
    return true;
  }

  public async reset(): Promise<void> {
    this.cache.clear();
    for (const prompt of DEFAULT_PROMPTS) {
      this.cache.set(prompt.id, { ...prompt });
    }
    await this.persist();
  }
}
