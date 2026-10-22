import { MCPToolDefinition, MCPToolResult } from '../../types.js';
import { PromptService } from './service.js';

export function createPromptTools(): MCPToolDefinition[] {
  return [
    {
      name: 'prompt_list',
      description: 'List prompts from the Antigravity prompt library with optional filtering by category, tag, search query, or favorites.',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by prompt category (e.g., "Review", "Debugging", "Development", "Architecture", "Refactoring")'
          },
          tag: {
            type: 'string',
            description: 'Filter by a specific tag (e.g., "tdd", "security", "senior-eng")'
          },
          search: {
            type: 'string',
            description: 'Free-text search query across titles, descriptions, and prompt templates'
          },
          favoriteOnly: {
            type: 'boolean',
            description: 'If true, returns only favorite / bookmarked prompts'
          }
        }
      }
    },
    {
      name: 'prompt_get',
      description: 'Get full details of a specific prompt (including its template and variables) by ID or exact title.',
      inputSchema: {
        type: 'object',
        properties: {
          idOrTitle: {
            type: 'string',
            description: 'The unique ID or title of the prompt to retrieve'
          }
        },
        required: ['idOrTitle']
      }
    },
    {
      name: 'prompt_search',
      description: 'Quick search for prompts in the library matching keywords.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keywords or phrases'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'prompt_render',
      description: 'Render a prompt template with variable substitution without copying to clipboard.',
      inputSchema: {
        type: 'object',
        properties: {
          idOrTitle: {
            type: 'string',
            description: 'The prompt ID or title to render'
          },
          variables: {
            type: 'object',
            description: 'Key-value dictionary of variables to interpolate into the template (e.g. {"language": "TypeScript", "target_code": "..."})'
          }
        },
        required: ['idOrTitle']
      }
    },
    {
      name: 'prompt_paste',
      description: 'Render a prompt with supplied template variables and copy it directly to the system clipboard, ready to paste into Antigravity chat or code editor.',
      inputSchema: {
        type: 'object',
        properties: {
          idOrTitle: {
            type: 'string',
            description: 'The prompt ID or title to paste'
          },
          variables: {
            type: 'object',
            description: 'Key-value dictionary of variables to interpolate into the prompt'
          }
        },
        required: ['idOrTitle']
      }
    },
    {
      name: 'prompt_save',
      description: 'Save a new prompt or update an existing prompt in the library. Template variables (like {{var}} or {{var:default}}) are automatically detected.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the prompt (optional, auto-generated from title if omitted)'
          },
          title: {
            type: 'string',
            description: 'Human-readable title of the prompt'
          },
          description: {
            type: 'string',
            description: 'Short explanation of what this prompt is designed for'
          },
          category: {
            type: 'string',
            description: 'Category name (e.g., Development, Review, Architecture, Debugging, Testing)'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Keywords and tags for categorization and search'
          },
          template: {
            type: 'string',
            description: 'Prompt template text containing optional {{variable}} or {{variable:defaultValue}} placeholders'
          },
          favorite: {
            type: 'boolean',
            description: 'Whether to bookmark this prompt as favorite'
          }
        },
        required: ['title', 'template']
      }
    },
    {
      name: 'prompt_delete',
      description: 'Delete a prompt from the prompt library by its ID.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the prompt to delete'
          }
        },
        required: ['id']
      }
    },
    {
      name: 'prompt_categories',
      description: 'List all available categories and tags in the prompt library with usage counts.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }
  ];
}

export async function handlePromptToolCall(
  service: PromptService,
  toolName: string,
  args: Record<string, any>
): Promise<MCPToolResult> {
  try {
    switch (toolName) {
      case 'prompt_list': {
        const prompts = await service.listPrompts({
          category: args.category,
          tag: args.tag,
          search: args.search,
          favoriteOnly: args.favoriteOnly
        });

        const summary = prompts.map(p => ({
          id: p.id,
          title: p.title,
          category: p.category,
          tags: p.tags,
          favorite: p.favorite,
          variables: p.variables.map(v => v.name),
          usageCount: p.usageCount,
          description: p.description
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(summary, null, 2)
            }
          ]
        };
      }

      case 'prompt_get': {
        const prompt = await service.getPrompt(args.idOrTitle);
        if (!prompt) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Prompt not found: "${args.idOrTitle}"`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(prompt, null, 2)
            }
          ]
        };
      }

      case 'prompt_search': {
        const prompts = await service.listPrompts({ search: args.query });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(prompts, null, 2)
            }
          ]
        };
      }

      case 'prompt_render': {
        const res = await service.renderPrompt(args.idOrTitle, args.variables || {});
        return {
          content: [
            {
              type: 'text',
              text: res.rendered
            }
          ]
        };
      }

      case 'prompt_paste': {
        const res = await service.pastePrompt(args.idOrTitle, args.variables || {});
        return {
          content: [
            {
              type: 'text',
              text: `${res.message}\n\n--- Rendered Prompt ---\n${res.rendered}`
            }
          ]
        };
      }

      case 'prompt_save': {
        const saved = await service.savePrompt({
          id: args.id,
          title: args.title,
          description: args.description,
          category: args.category,
          tags: args.tags,
          template: args.template,
          favorite: args.favorite
        });

        return {
          content: [
            {
              type: 'text',
              text: `Prompt "${saved.title}" (ID: ${saved.id}) saved successfully with ${saved.variables.length} detected variable(s).`
            }
          ]
        };
      }

      case 'prompt_delete': {
        const ok = await service.deletePrompt(args.id);
        return {
          content: [
            {
              type: 'text',
              text: ok ? `Prompt "${args.id}" deleted successfully.` : `Prompt "${args.id}" not found.`
            }
          ]
        };
      }

      case 'prompt_categories': {
        const res = await service.getCategoriesAndTags();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2)
            }
          ]
        };
      }

      default:
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${toolName}`
            }
          ]
        };
    }
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing ${toolName}: ${err?.message || err}`
        }
      ]
    };
  }
}
