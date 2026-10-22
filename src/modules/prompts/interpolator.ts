import { PromptVariable } from './types.js';

const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_-]+)(?::([^}]*))?\s*\}\}/g;

/**
 * Extracts all variable names and their optional default values from a template string.
 */
export function extractVariablesFromTemplate(template: string): PromptVariable[] {
  const varsMap = new Map<string, PromptVariable>();
  let match: RegExpExecArray | null;

  // Reset regex state
  VARIABLE_REGEX.lastIndex = 0;

  while ((match = VARIABLE_REGEX.exec(template)) !== null) {
    const name = match[1].trim();
    const defaultValue = match[2] !== undefined ? match[2].trim() : undefined;

    if (!varsMap.has(name)) {
      varsMap.set(name, {
        name,
        description: `Value for {{${name}}}`,
        defaultValue,
        required: defaultValue === undefined
      });
    }
  }

  return Array.from(varsMap.values());
}

/**
 * Merges explicitly defined variables with any extracted from the template.
 */
export function syncVariables(template: string, existingVariables: PromptVariable[] = []): PromptVariable[] {
  const extracted = extractVariablesFromTemplate(template);
  const existingMap = new Map(existingVariables.map(v => [v.name, v]));

  return extracted.map(ext => {
    const existing = existingMap.get(ext.name);
    if (existing) {
      return {
        name: ext.name,
        description: existing.description || ext.description,
        defaultValue: existing.defaultValue !== undefined ? existing.defaultValue : ext.defaultValue,
        required: existing.required !== undefined ? existing.required : ext.required
      };
    }
    return ext;
  });
}

/**
 * Renders a template with provided variable values.
 */
export function interpolate(
  template: string,
  variables: PromptVariable[],
  values: Record<string, string> = {}
): { rendered: string; variablesUsed: Record<string, string>; missingVariables: string[] } {
  const variablesUsed: Record<string, string> = {};
  const missingVariables: string[] = [];
  const varMetaMap = new Map(variables.map(v => [v.name, v]));

  // Also auto-detect any variables not declared in metadata
  const allVars = syncVariables(template, variables);
  for (const v of allVars) {
    if (!varMetaMap.has(v.name)) {
      varMetaMap.set(v.name, v);
    }
  }

  const rendered = template.replace(VARIABLE_REGEX, (match, varName, inlineDefault) => {
    const key = varName.trim();
    const meta = varMetaMap.get(key);

    let val = values[key];

    // Fall back to inline default if not supplied
    if (val === undefined || val === null || val === '') {
      if (inlineDefault !== undefined && inlineDefault !== '') {
        val = inlineDefault.trim();
      } else if (meta?.defaultValue !== undefined && meta.defaultValue !== '') {
        val = meta.defaultValue;
      }
    }

    if (val !== undefined && val !== null && val !== '') {
      variablesUsed[key] = String(val);
      return String(val);
    }

    if (meta?.required) {
      missingVariables.push(key);
    }

    // Keep original placeholder if no value provided
    return match;
  });

  return {
    rendered,
    variablesUsed,
    missingVariables
  };
}
