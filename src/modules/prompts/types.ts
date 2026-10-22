export interface PromptVariable {
  name: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  template: string;
  variables: PromptVariable[];
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface PromptFilterOptions {
  category?: string;
  tag?: string;
  search?: string;
  favoriteOnly?: boolean;
}

export interface RenderResult {
  promptId: string;
  title: string;
  rendered: string;
  variablesUsed: Record<string, string>;
  missingVariables: string[];
}

export interface PasteResult extends RenderResult {
  copiedToClipboard: boolean;
  clipboardMethod: string;
  message: string;
}
