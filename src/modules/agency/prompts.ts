import { PromptItem } from '../prompts/types.js';

export function getAgencyDefaultPrompts(): Array<Omit<PromptItem, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>> {
  return [
    {
      title: '[Agency] Build New Project from Scratch (Orchestrator)',
      category: 'Agency Agents',
      tags: ['agency', 'orchestrator', 'pipeline', 'project-scaffold'],
      description: 'Assembles a specialist squad using agency-agents-orchestrator to plan, specify, and build a new application from scratch.',
      template: `/agency-pipeline
I want to build a new project from scratch: {{project_idea:a web dashboard that tracks factory machine temperatures and sends alerts}}.

1. Start as \`agency-agents-orchestrator\` and read \`docs/agency-registry.md\`.
2. Pick the best agents for Product Planning, Architecture, Frontend, Backend, and QA.
3. Write the full project blueprint and agent checklist into \`docs/active-spec.md\`.
4. Pause and show me the plan in \`docs/active-spec.md\` before writing code, or proceed phase by phase.`,
      variables: [
        {
          name: 'project_idea',
          description: 'Description of the application you want to build from scratch',
          required: true,
          defaultValue: 'a web dashboard that tracks factory machine temperatures and sends alerts'
        }
      ],
      favorite: true
    },
    {
      title: '[Agency] Add Feature to Project (Pipeline)',
      category: 'Agency Agents',
      tags: ['agency', 'feature', 'pipeline', 'implementation'],
      description: 'Onboards onto the codebase with agency-codebase-onboarding-engineer, plans specs with agency-project-shepherd, and runs engineering agents.',
      template: `/agency-pipeline
I want to add a new feature to this project: {{feature_description:Add a PDF export button to the reports page that includes charts and summary tables}}.

First, use \`agency-codebase-onboarding-engineer\` to inspect how our current project is structured. Then have \`agency-project-shepherd\` write the implementation steps into \`docs/active-spec.md\`, and run the required engineering and QA agents to build and test it.`,
      variables: [
        {
          name: 'feature_description',
          description: 'Description of the feature to add to the existing project',
          required: true,
          defaultValue: 'Add a PDF export button to the reports page that includes charts and summary tables'
        }
      ],
      favorite: true
    },
    {
      title: '[Agency] Deep Research & Architecture (No Code Changes)',
      category: 'Agency Agents',
      tags: ['agency', 'research', 'architecture', 'analysis'],
      description: 'Summons research and architecture specialists (trend-researcher, backend-architect) to create a feasibility and architecture report without touching code.',
      template: `Use \`agency-agents-orchestrator\` and read \`docs/agency-registry.md\`.
I need a deep research and feasibility report on: {{research_topic:The best real-time time-series database and architecture for storing 10,000 sensor readings per second}}.

Summon the appropriate research and architecture agents (such as \`agency-trend-researcher\`, \`agency-backend-architect\`, and \`agency-database-optimizer\`). Do NOT modify any application code. Write a comprehensive research report with pros, cons, and recommendations to \`docs/research-report.md\`.`,
      variables: [
        {
          name: 'research_topic',
          description: 'The topic, library, or architecture to evaluate',
          required: true,
          defaultValue: 'The best real-time time-series database and architecture for storing 10,000 sensor readings per second'
        }
      ],
      favorite: false
    },
    {
      title: '[Agency] Call Single Specialist Agent Directly',
      category: 'Agency Agents',
      tags: ['agency', 'specialist', 'direct-call'],
      description: 'Summons a specific agency specialist agent (e.g. backend-architect, frontend-developer, database-optimizer) with exact instructions.',
      template: `Activate \`{{agent_slug:agency-backend-architect}}\`. {{task_description:Design the REST API endpoints and database schema for user role permissions}}. Remember you can use [CALL_AGENT] if you need help from another specialist in \`docs/agency-registry.md\`.`,
      variables: [
        {
          name: 'agent_slug',
          description: 'The exact slug of the agency agent to summon (from docs/agency-registry.md)',
          required: true,
          defaultValue: 'agency-backend-architect'
        },
        {
          name: 'task_description',
          description: 'Detailed instructions for this specialist',
          required: true,
          defaultValue: 'Design the REST API endpoints and database schema for user role permissions'
        }
      ],
      favorite: false
    },
    {
      title: '[Agency] Adversarial Quality Gate & Reality Check',
      category: 'Agency Agents',
      tags: ['agency', 'qa', 'reality-check', 'code-review'],
      description: 'Activates agency-reality-checker and agency-code-reviewer to audit recent work for edge cases, bugs, or unfinished placeholders.',
      template: `Activate \`agency-reality-checker\` and \`agency-code-reviewer\`.
Review all files modified in {{scope:recent changes}}, check for edge cases, missing error handlers, or unfinished placeholders/TODOs, and run the automated test suite.`,
      variables: [
        {
          name: 'scope',
          description: 'Scope of files or commits to audit',
          required: false,
          defaultValue: 'recent changes'
        }
      ],
      favorite: false
    }
  ];
}
