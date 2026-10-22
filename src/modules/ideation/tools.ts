import { MCPToolDefinition, MCPToolResult } from '../../types.js';
import { IdeationService } from './service.js';
import { IdeationStorage } from './storage.js';

export function createIdeationTools(): MCPToolDefinition[] {
  return [
    {
      name: 'ideation_analyze',
      description: 'Perform deep codebase ideation and multi-pillar audit (Aperant-inspired): discovers code-revealed feature ideas, performance bottlenecks, security vulnerabilities, and code quality debt.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace root directory (defaults to current working directory).'
          },
          saveToWorkspace: {
            type: 'boolean',
            description: 'Whether to save report to .antigravity/ideation.json (default: true).'
          }
        }
      }
    },
    {
      name: 'ideation_get',
      description: 'Retrieve the latest active ideation report, health scores, and discovered improvements.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace root directory.'
          }
        }
      }
    },
    {
      name: 'ideation_promote_to_roadmap',
      description: 'Promote an ideation finding (e.g. "ci-001", "perf-001", "sec-001") directly into the active MoSCoW Roadmap as an actionable feature ticket.',
      inputSchema: {
        type: 'object',
        properties: {
          ideaId: {
            type: 'string',
            description: 'Unique ID of the ideation item to promote (e.g., "ci-001", "sec-001").'
          },
          workspacePath: {
            type: 'string',
            description: 'Workspace root directory.'
          }
        },
        required: ['ideaId']
      }
    },
    {
      name: 'ideation_export_markdown',
      description: 'Export the complete ideation report and health scores into IDEATION.md in the workspace root.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace root directory.'
          }
        }
      }
    }
  ];
}

export function createIdeationToolHandler(
  service: IdeationService,
  storage: IdeationStorage
) {
  return async (name: string, args: Record<string, any>): Promise<MCPToolResult> => {
    try {
      const wsPath = args.workspacePath ? String(args.workspacePath) : process.cwd();

      switch (name) {
        case 'ideation_analyze': {
          const report = await service.generateReport(wsPath);
          if (args.saveToWorkspace !== false) {
            await storage.saveReport(report, wsPath);
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(report, null, 2)
              }
            ]
          };
        }

        case 'ideation_get': {
          let report = await storage.getReport(wsPath);
          if (!report) {
            report = await service.generateReport(wsPath);
            await storage.saveReport(report, wsPath);
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(report, null, 2)
              }
            ]
          };
        }

        case 'ideation_promote_to_roadmap': {
          const ideaId = String(args.ideaId);
          const result = await storage.promoteIdeaToRoadmap(ideaId, wsPath);
          return {
            content: [
              {
                type: 'text',
                text: result.message
              }
            ]
          };
        }

        case 'ideation_export_markdown': {
          let report = await storage.getReport(wsPath);
          if (!report) {
            report = await service.generateReport(wsPath);
            await storage.saveReport(report, wsPath);
          }
          const md = service.exportToMarkdown(report);
          const savedPath = await storage.exportMarkdownFile(md, wsPath);

          return {
            content: [
              {
                type: 'text',
                text: `Successfully exported IDEATION.md to: ${savedPath}\n\n${md.slice(0, 500)}...`
              }
            ]
          };
        }

        default:
          return {
            isError: true,
            content: [{ type: 'text', text: `Unknown tool: ${name}` }]
          };
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error in ${name}: ${err?.message || String(err)}` }]
      };
    }
  };
}
