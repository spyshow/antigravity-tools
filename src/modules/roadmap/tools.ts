import { MCPToolDefinition, MCPToolResult } from '../../types.js';
import { ProjectAnalyzer } from './project-analyzer.js';
import { CompetitorService } from './competitor-service.js';
import { RoadmapGenerator } from './generator.js';
import { RoadmapStorage } from './storage.js';
import { normalizeWorkspacePath, getActiveWorkspace } from '../workspace.js';

export function createRoadmapTools(): MCPToolDefinition[] {
  return [
    {
      name: 'roadmap_analyze_project',
      description: 'Perform automated deep codebase introspection (Aperant-inspired discovery): detects tech stack, project type, target personas, problem statement, existing capabilities, and gaps.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Absolute or relative path to project workspace root (defaults to current working directory).'
          }
        }
      }
    },
    {
      name: 'roadmap_analyze_competitors',
      description: 'Analyze direct and indirect competitors, extracting user pain points (with severity and source), market gaps, and differentiation opportunities for the project.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace root path to use for project discovery context.'
          }
        }
      }
    },
    {
      name: 'roadmap_generate',
      description: 'Generate an AI-assisted, phased strategic feature roadmap with MoSCoW prioritization (Must/Should/Could/Won\'t), acceptance criteria, user stories, and linked competitor insight IDs.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace directory to analyze and attach roadmap to.'
          },
          saveToWorkspace: {
            type: 'boolean',
            description: 'If true, automatically saves to .antigravity/roadmap.json (default: true).'
          }
        }
      }
    },
    {
      name: 'roadmap_get',
      description: 'Retrieve the current project roadmap, phases, features, progress, and competitor mappings.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace directory containing the roadmap.'
          }
        }
      }
    },
    {
      name: 'roadmap_update_feature',
      description: 'Update the progress status of a roadmap feature (idea | planned | in_progress | completed).',
      inputSchema: {
        type: 'object',
        properties: {
          featureId: {
            type: 'string',
            description: 'The unique feature ID (e.g., "FEAT-01") to update.'
          },
          status: {
            type: 'string',
            enum: ['idea', 'planned', 'in_progress', 'completed'],
            description: 'New status for the feature.'
          },
          workspacePath: {
            type: 'string',
            description: 'Workspace directory containing the roadmap.'
          }
        },
        required: ['featureId', 'status']
      }
    },
    {
      name: 'roadmap_export_markdown',
      description: 'Render and export the strategic roadmap into a publication-ready ROADMAP.md file in the workspace root.',
      inputSchema: {
        type: 'object',
        properties: {
          workspacePath: {
            type: 'string',
            description: 'Workspace directory where ROADMAP.md should be written.'
          }
        }
      }
    }
  ];
}

export function createRoadmapToolHandler(
  analyzer: ProjectAnalyzer,
  competitorService: CompetitorService,
  generator: RoadmapGenerator,
  storage: RoadmapStorage
) {
  return async (name: string, args: Record<string, any>): Promise<MCPToolResult> => {
    try {
      const wsPath = normalizeWorkspacePath(args.workspacePath || getActiveWorkspace());

      switch (name) {
        case 'roadmap_analyze_project': {
          const discovery = await analyzer.analyzeWorkspace(wsPath);
          await storage.saveDiscovery(discovery, wsPath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(discovery, null, 2)
              }
            ]
          };
        }

        case 'roadmap_analyze_competitors': {
          let discovery = await storage.getDiscovery(wsPath);
          if (!discovery) {
            discovery = await analyzer.analyzeWorkspace(wsPath);
            await storage.saveDiscovery(discovery, wsPath);
          }
          const analysis = await competitorService.analyzeCompetitors(discovery);
          await storage.saveCompetitorAnalysis(analysis, wsPath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(analysis, null, 2)
              }
            ]
          };
        }

        case 'roadmap_generate': {
          let discovery = await storage.getDiscovery(wsPath);
          if (!discovery) {
            discovery = await analyzer.analyzeWorkspace(wsPath);
            await storage.saveDiscovery(discovery, wsPath);
          }

          let compAnalysis = await storage.getCompetitorAnalysis(wsPath);
          if (!compAnalysis) {
            compAnalysis = await competitorService.analyzeCompetitors(discovery);
            await storage.saveCompetitorAnalysis(compAnalysis, wsPath);
          }

          const roadmap = generator.generateRoadmap(discovery, compAnalysis);
          if (args.saveToWorkspace !== false) {
            await storage.saveRoadmap(roadmap, wsPath);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(roadmap, null, 2)
              }
            ]
          };
        }

        case 'roadmap_get': {
          const roadmap = await storage.getRoadmap(wsPath);
          if (!roadmap) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ message: 'No roadmap found for workspace. Use roadmap_generate to create one.' })
                }
              ]
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(roadmap, null, 2)
              }
            ]
          };
        }

        case 'roadmap_update_feature': {
          const featureId = String(args.featureId);
          const status = args.status;
          const updatedRoadmap = await storage.updateFeatureStatus(featureId, status, wsPath);
          return {
            content: [
              {
                type: 'text',
                text: `Successfully updated feature ${featureId} to status "${status}".\nRoadmap version: ${updatedRoadmap.version}`
              }
            ]
          };
        }

        case 'roadmap_export_markdown': {
          const roadmap = await storage.getRoadmap(wsPath);
          if (!roadmap) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: 'Cannot export ROADMAP.md: No roadmap exists. Run roadmap_generate first.'
                }
              ]
            };
          }
          const competitorAnalysis = await storage.getCompetitorAnalysis(wsPath) || undefined;
          const mdContent = generator.exportToMarkdown(roadmap, competitorAnalysis);
          const savedPath = await storage.exportMarkdownFile(mdContent, wsPath);

          return {
            content: [
              {
                type: 'text',
                text: `Successfully generated and saved ROADMAP.md to: ${savedPath}\n\n${mdContent.slice(0, 500)}...`
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
