import { loadAISettings } from './settings.js';

export class AINotConfiguredError extends Error {
  constructor() {
    super('No Gemini API key configured. Add one in the AI Settings (⚙) panel or set the GEMINI_API_KEY environment variable.');
    this.name = 'AINotConfiguredError';
  }
}

/**
 * Minimal Gemini REST client that requests strict JSON output.
 */
export async function generateJson<T = any>(systemInstruction: string, userPrompt: string, timeoutMs = 240000): Promise<T> {
  const { geminiApiKey, model } = loadAISettings();
  if (!geminiApiKey) throw new AINotConfiguredError();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4
        }
      }),
      signal: controller.signal
    });

    const raw = await res.text();
    if (!res.ok) {
      let msg = raw.slice(0, 400);
      try { msg = JSON.parse(raw)?.error?.message || msg; } catch {}
      throw new Error(`Gemini API error (${res.status}): ${msg}`);
    }

    const data = JSON.parse(raw);
    const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('');
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || 'empty response';
      throw new Error(`Gemini returned no content (${reason}).`);
    }
    return parseJsonLoose<T>(text);
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error(`Gemini request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function parseJsonLoose<T = any>(text: string): T {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error('AI response was not valid JSON.');
  }
}
