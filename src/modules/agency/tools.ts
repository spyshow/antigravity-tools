import { MCPToolDefinition, MCPToolResult } from '../../types.js';
import { AgencyService } from './service.js';

export function createAgencyTools(): MCPToolDefinition[] {
  return [
    {
      name: 'agency_integrate',
      description: 'Bootstrap and integrate installed Agency Agents (https://github.com/msitarzewski/agency-agents-app) with the active Antigravity project: indexes all skills into docs/agency-registry.md, configures /agency-pipeline, enables inter-agent delegation [CALL_AGENT], generates agency-readme.md, and adds Agency prompts to the Prompt Library.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace root path (defaults to current working directory).'
          }
        }
      }
    },
    {
      name: 'agency_list_agents',
      description: 'List all installed agency-* specialist skills detected across project and system skill directories.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace root path.'
          }
        }
      }
    },
    {
      name: 'agency_status',
      description: 'Check whether Agency Agents are integrated into the active project and inspect generated file statuses.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace root path.'
          }
        }
      }
    }
  ];
}

export function createAgencyToolHandler(service: AgencyService) {
  return async (name: string, args: Record<string, any>): Promise<MCPToolResult> => {
    try {
      const wsPath = args.workspacePath ? String(args.workspacePath) : process.cwd();

      switch (name) {
        case 'agency_integrate': {
          const result = await service.integrate(wsPath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case 'agency_list_agents': {
          const agents = service.listAgents(wsPath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ count: agents.length, agents }, null, 2)
              }
            ]
          };
        }

        case 'agency_status': {
          const status = service.getStatus(wsPath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(status, null, 2)
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
