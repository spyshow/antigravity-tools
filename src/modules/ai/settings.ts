import * as fs from 'fs';
import * as path from 'path';
import { getPluginHomeDir } from '../../config.js';

export interface AISettings {
  geminiApiKey?: string;
  model: string;
}

export const DEFAULT_MODEL = 'gemini-2.5-flash';

function getSettingsPath(): string {
  if (process.env.AGY_AI_SETTINGS_PATH) return process.env.AGY_AI_SETTINGS_PATH;
  return path.join(getPluginHomeDir(), 'ai-settings.json');
}

function readFileSettings(): Partial<AISettings> {
  const p = getSettingsPath();
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {}
  return {};
}

/** Loads AI settings. Environment variables take precedence over the settings file. */
export function loadAISettings(): AISettings {
  const file = readFileSettings();
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || file.geminiApiKey || undefined,
    model: process.env.AGY_AI_MODEL || file.model || DEFAULT_MODEL
  };
}

export function saveAISettings(update: Partial<AISettings>): AISettings {
  const current = readFileSettings();
  const next: Partial<AISettings> = { ...current };
  if (update.geminiApiKey !== undefined) {
    next.geminiApiKey = update.geminiApiKey.trim() || undefined;
  }
  if (update.model !== undefined) {
    next.model = update.model.trim() || DEFAULT_MODEL;
  }
  const p = getSettingsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf8');
  return loadAISettings();
}

export function isAIConfigured(): boolean {
  return !!loadAISettings().geminiApiKey;
}

/** Public, non-secret view of the settings for the UI. */
export function describeAISettings() {
  const s = loadAISettings();
  const key = s.geminiApiKey || '';
  return {
    configured: !!key,
    model: s.model,
    keySource: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? 'environment' : key ? 'settings-file' : 'none',
    keyPreview: key ? `${key.slice(0, 4)}…${key.slice(-4)}` : ''
  };
}
