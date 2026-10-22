# 🚀 Antigravity Tools

[![Antigravity Plugin](https://img.shields.io/badge/Antigravity-Plugin-blue?style=flat-square)](https://antigravity.google/docs/plugins/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-blue?style=flat-square)](https://www.typescriptlang.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP-JSON--RPC%202.0-purple?style=flat-square)](https://modelcontextprotocol.io/)
[![Tests](https://img.shields.io/badge/Tests-22%2F22%20Passing-brightgreen?style=flat-square)]()

An extensible developer productivity suite for [Google Antigravity](https://antigravity.google/docs/plugins/). Built natively in TypeScript/Node.js, it provides a unified modular architecture accessible via Antigravity's **Plugins** sidecar aux pane, standard **Model Context Protocol (MCP)** tools, an interactive **Web Dashboard**, and a fast **CLI**.

---

## 📑 Table of Contents
- [Overview & Core Modules](#-overview--core-modules)
  - [1. 📚 Prompt Library & Dynamic Clipboard Injection](#1--prompt-library--dynamic-clipboard-injection)
  - [2. 🗺️ AI Strategic Roadmap & Competitor Planner](#2-️-ai-strategic-roadmap--competitor-planner-aperant-model)
  - [3. 💡 Codebase Ideation, Performance & Security Audits](#3--codebase-ideation-performance--security-audits-aperant-model)
  - [4. 🤖 Agency Agents Integration & Multi-Agent Handoff](#4--agency-agents-integration--multi-agent-handoff)
- [Architecture & Directory Structure](#-architecture--directory-structure)
- [Step-by-Step Installation](#-step-by-step-installation)
  - [Prerequisites](#prerequisites)
  - [Step 1: Install Dependencies](#step-1-install-dependencies)
  - [Step 2: Build the TypeScript Codebase](#step-2-build-the-typescript-codebase)
  - [Step 3: Run Automated Verification Tests](#step-3-run-automated-verification-tests)
  - [Step 4: Install to Antigravity Global Plugins Directory](#step-4-install-to-antigravity-global-plugins-directory)
  - [Step 5: Verify Plugin & Sidecar Configuration](#step-5-verify-plugin--sidecar-configuration)
- [Step-by-Step Usage Guide](#-step-by-step-usage-guide)
  - [Method 1: Interactive Sidecar Aux Pane (Plugins Menu)](#method-1-interactive-sidecar-aux-pane-plugins-menu)
  - [Method 2: Autonomous AI Agent Execution (MCP Tools)](#method-2-autonomous-ai-agent-execution-mcp-tools)
  - [Method 3: Standalone Local Web Dashboard](#method-3-standalone-local-web-dashboard)
  - [Method 4: Command-Line Interface (CLI)](#method-4-command-line-interface-cli)
- [Extending with New Modules](#-extending-with-new-modules)
- [Testing & Quality Assurance](#-testing--quality-assurance)

---

## 🌟 Overview & Core Modules

Antigravity Tools consolidates essential engineering workflows into a cohesive local-first suite:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ANTIGRAVITY TOOLS                                    │
├─────────────────────┬──────────────────────────┬───────────────────────┬───────────────┤
│ 📚 PROMPT LIBRARY   │ 🗺️ STRATEGIC ROADMAP     │ 💡 CODEBASE IDEATION  │ 🤖 AGENCY HUB │
├─────────────────────┼──────────────────────────┼───────────────────────┼───────────────┤
│ • Dynamic Templates │ • AST Repo Introspection │ • Code Improvements   │ • 280+ Agents │
│ • {{var}} Fill Form │ • Competitor Benchmarking│ • Perf Bottlenecks    │ • /pipeline   │
│ • <50ms OS Paste    │ • MoSCoW Phasing         │ • Security (CWE/OWASP)│ • [CALL_AGENT]│
│ • JSON Import/Export│ • Linked CP Insights     │ • 0-100 Health Scores │ • Registry MD │
│ • 8 MCP Tools       │ • Export ROADMAP.md      │ • Promote to Roadmap  │ • Guide A-E   │
└─────────────────────┴──────────────────────────┴───────────────────────┴───────────────┘
```

---

### 1. 📚 Prompt Library & Dynamic Clipboard Injection
- **Template Variables**: Create reusable prompts with dynamic placeholders using `{{variable}}` or `{{variable:defaultValue}}`. Placeholders are automatically parsed and surfaced in fillable forms.
- **Direct System Clipboard Injection**: Render prompts with filled variables and inject directly into your OS clipboard in under 50ms (ready to `Ctrl+V` into Antigravity chat or code editor).
- **Curated Seeds**: Pre-packaged with battle-tested software engineering prompts (Senior Code Review, Systematic Debugging, Red-Green-Refactor TDD, Architecture RFC, Safe Refactoring).
- **Organization & Backup**: Filter by category, tags, favorites, and search keywords. Full JSON import/export with merge and replace strategies.

### 2. 🗺️ AI Strategic Roadmap & Competitor Planner (Aperant Model)
Modeled directly on the autonomous architecture in [AndyMik90/Aperant](https://github.com/AndyMik90/Aperant):
- **Automated Codebase Introspection**: Deep AST scanning detecting project type (web-app, CLI, library, plugin, API), tech stack (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`), personas, value proposition, and technical debt.
- **Competitor Intelligence Benchmarking**: Identifies direct and indirect market competitors (e.g. Aperant, Cursor Composer, Continue.dev, Linear), extracting real user complaints from developer forums with severity and opportunity ratings.
- **MoSCoW Prioritized Phasing**: Synthesizes features into 3 progressive phases:
  - *Phase 1: Foundation & Core Experience*
  - *Phase 2: Competitor Differentiation & Workflow Power*
  - *Phase 3: Scale, Ecosystem & Autonomous Intelligence*
- **Competitor Pain Point Linking**: Features explicitly link back to competitor flaw IDs (`competitor_insight_ids`), ensuring you build differentiators that win market share.
- **User Stories & Acceptance Criteria**: Every feature includes target persona user stories and testable acceptance criteria checkboxes.
- **1-Click Export**: Generates a publication-grade [ROADMAP.md](file:///d:/BackUp/programing_projects/antigravity_tools/ROADMAP.md) directly in the repository root.

### 3. 💡 Codebase Ideation, Performance & Security Audits (Aperant Model)
A 4-pillar static analysis and opportunity discovery engine:
1. **🚀 Code-Revealed Feature Discoveries (`ci-xxx`)**: Opportunities that naturally emerge from extending existing architectural patterns and extension points.
2. **⚡ Performance Optimizations (`perf-xxx`)**: Detection of synchronous file I/O blocking the event loop, unpruned dependencies, and in-memory LRU caching opportunities.
3. **🛡️ Security Hardening & Vulnerabilities (`sec-xxx`)**: Static checks for path traversal (CWE-22), hardcoded credentials (CWE-798), permissive wildcard CORS (CWE-942), and unsafe DOM manipulation.
4. **🧹 Code Quality & Technical Debt (`cq-xxx`)**: Flags files exceeding 250 lines, code duplication, and test coverage gaps.
- **Quantitative Health Scores**: Live 0–100 scores for Security Posture, Runtime Performance, Code Quality, and Innovation Potential.
- **Direct Bridge to Roadmap**: 1-click **"Promote to Roadmap"** converts an ideation discovery into an active MoSCoW feature ticket in `roadmap.json`!
- **1-Click Export**: Generates a comprehensive [IDEATION.md](file:///d:/BackUp/programing_projects/antigravity_tools/IDEATION.md) report in the workspace root.

### 4. 🤖 Agency Agents Integration & Multi-Agent Handoff
Enables seamless integration with the 280+ AI specialist agents installed via the [Agency Agents desktop app](https://github.com/msitarzewski/agency-agents-app):
- **Universal Multi-Directory Scanning**: Deep-scans candidate skill directories across `%USERPROFILE%\.gemini\config\skills`, `%USERPROFILE%\.gemini\antigravity\skills`, `.agents/skills`, and `skills/`, extracting frontmatter metadata to identify all `agency-*` specialists.
- **1-Click Native TypeScript Integration**:
  - `docs/agency-registry.md`: Master directory table listing every installed agent slug, trigger description, and exact skill path.
  - `.agents/workflows/agency-pipeline.md`: The universal `/agency-pipeline` multi-agent squad assembly router.
  - `.agents/rules/inter-agent-calling.md`: The always-on `[CALL_AGENT]` delegation protocol for dynamic sub-agent consultations.
  - `agency-readme.md`: Zero-knowledge, step-by-step user guide with complete copy-paste prompts for Scenarios A through E (Orchestrator new project, Feature pipeline, Deep research, Single specialist, Reality check QA gate).
- **Prompt Library Injection**: Automatically injects 5 battle-tested Agency workflow prompts into your Prompt Library.
- **Sidecar Aux Pane Dashboard**: View installed agent count, integration checklist, and live-search through all 280+ specialists with 1-click "Copy ID" and "Call Agent" delegation snippet generator.
- **Cross-Platform Reliability**: Runs entirely in native Node.js/TypeScript—no PowerShell execution policy restrictions or platform-specific bash scripts required.

---

## 📂 Architecture & Directory Structure

Conforms strictly to the official [Antigravity Plugins Specification](https://antigravity.google/docs/plugins/):

```
antigravity_tools/
├── plugin.json                 # Antigravity Plugin manifest ($schema)
├── mcp_config.json             # MCP server connection configuration
├── package.json                # Package metadata & build scripts
├── tsconfig.json               # TypeScript configuration
├── ROADMAP.md                  # Generated strategic product roadmap
├── IDEATION.md                 # Generated codebase ideation & audit report
├── agency-readme.md            # Generated Agency Agents user guide (Scenarios A-E)
├── docs/
│   └── agency-registry.md      # Auto-generated master catalog of 280+ agency skills
├── .agents/
│   ├── workflows/
│   │   └── agency-pipeline.md  # Multi-agent orchestrator router (/agency-pipeline)
│   └── rules/
│       └── inter-agent-calling.md # [CALL_AGENT] delegation rule
├── bin/
│   └── agy-tools.cmd           # Windows CLI launcher
├── skills/                     # Antigravity agent skills
│   ├── prompt-library/SKILL.md # Skill for prompt operations
│   ├── ai-roadmap/SKILL.md     # Skill for roadmap planning
│   └── ideation/SKILL.md       # Skill for codebase audits
├── rules/
│   └── prompt-library.md       # Behavioral rules for prompt reuse
├── sidecars/
│   └── prompt_library/         # Sidecar aux pane definition
│       ├── sidecar.json        # Sidecar UI registration & entrypoint
│       ├── ui.html             # Antigravity Aux Pane webview bridge
│       └── dist/server.js      # Sidecar background HTTP server
├── src/
│   ├── types.ts                # Unified MCP & PluginModule contracts
│   ├── index.ts                # Public API entrypoint
│   ├── mcp-server.ts           # JSON-RPC 2.0 stdio MCP server
│   ├── cli.ts                  # Command-line interface runner
│   ├── config.ts               # Path & storage resolution
│   ├── modules/
│   │   ├── registry.ts         # Dynamic plugin module registry
│   │   ├── prompts/            # Module 1: Prompt Library
│   │   ├── roadmap/            # Module 2: AI Strategic Roadmap
│   │   ├── ideation/           # Module 3: Codebase Ideation & Audits
│   │   └── agency/             # Module 4: Agency Agents Integration
│   │       ├── types.ts        # Agency status & result interfaces
│   │       ├── detector.ts     # Multi-directory skill & frontmatter scanner
│   │       ├── prompts.ts      # Curated Scenarios A-E prompt templates
│   │       ├── generator.ts    # Native TS generator for registry, pipeline, rules
│   │       ├── service.ts      # File generation & prompt library injector
│   │       ├── tools.ts        # Agency MCP tools (integrate, list, status)
│   │       └── index.ts        # REST endpoints (/api/agency/*)
│   ├── web/
│   │   ├── server.ts           # HTTP server for Aux Pane & Web UI
│   │   └── public/
│   │       ├── index.html      # 4-tab interactive dashboard UI
│   │       ├── ui.html         # Aux pane webview with /preload.js bridge
│   │       ├── styles.css      # Dark-theme design tokens & layouts
│   │       └── app.js          # Reactive client application logic
│   └── tests/                  # Automated test suite (22 unit tests)
│       ├── prompts.test.ts
│       ├── roadmap.test.ts
│       ├── ideation.test.ts
│       └── agency.test.ts
```

---

## 🛠️ Step-by-Step Installation

### Prerequisites
- **Node.js**: `v18.0.0` or higher (`node -v`)
- **npm**: `v9.0.0` or higher (`npm -v`)
- **Google Antigravity**: Desktop IDE with Plugin Support

---

### Step 1: Install Dependencies
Open your terminal in the `antigravity_tools` repository root and install dependencies:

```bash
npm install
```

---

### Step 2: Build the TypeScript Codebase
Compile TypeScript sources and copy public static web assets:

```bash
npm run build
```

This compiles TypeScript to `dist/` and copies `src/web/public/` to `dist/web/public/`.

---

### Step 3: Run Automated Verification Tests
Verify that all 22 test cases across all modules pass cleanly:

```bash
npm test
```

Expected output:
```
✔ AgencyDetector discovers installed agency skills across system directories
✔ AgencyGenerator generates registry table, pipeline workflow, rules, and readme
✔ AgencyService integrates files and injects prompts into prompt library
✔ AgencyModule exposes MCP tools and handles requests
✔ CodeScanner scans workspace and discovers architecture patterns and security rules
✔ IdeationService produces 4-pillar report with health scores and markdown export
✔ IdeationStorage persists report and promotes ideation finding into active Roadmap
✔ IdeationModule exposes MCP tools and dispatches execution
✔ extractVariablesFromTemplate extracts variables with and without defaults
✔ interpolate fills provided values
✔ interpolate falls back to default values when empty or undefined
✔ syncVariables preserves existing variable metadata
✔ ProjectAnalyzer extracts accurate tech stack and project characteristics
✔ CompetitorService identifies relevant competitors and pain point opportunities
✔ RoadmapGenerator produces 3 MoSCoW phases with acceptance criteria and competitor links
✔ RoadmapStorage persists, updates feature status, and exports ROADMAP.md
✔ RoadmapModule exposes MCP tools and handles tool calls
✔ PromptService filters by category, tag, and search query
✔ PromptService saves prompt and auto-detects variables
✔ PromptService pastePrompt increments usage count and renders properly
✔ PromptStorage initializes with default seed prompts if file does not exist
✔ PromptStorage saves, retrieves, and deletes custom prompt
ℹ tests 22 | pass 22 | fail 0
```

---

### Step 4: Install to Antigravity Global Plugins Directory

Copy the built plugin to Antigravity's global plugins directory:

#### On Windows (PowerShell):
```powershell
$target = "$env:USERPROFILE\.gemini\config\plugins\antigravity-tools"
if (!(Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force }

Copy-Item -Path "dist", "src", "skills", "sidecars", "plugin.json", "package.json", "README.md" -Destination $target -Recurse -Force
```

#### On macOS / Linux:
```bash
TARGET="$HOME/.gemini/config/plugins/antigravity-tools"
mkdir -p "$TARGET"
cp -R dist src skills sidecars plugin.json package.json README.md "$TARGET"
```

---

### Step 5: Verify Plugin & Sidecar Configuration
Ensure Antigravity has enabled the plugin in `%USERPROFILE%\.gemini\config\config.json`:

```json
{
  "plugins": {
    "antigravity-tools": {
      "enabled": true
    }
  },
  "sidecars": {
    "antigravity-tools/prompt_library": {
      "projectId": "default",
      "resolvedPermissions": null,
      "schemaVersion": 1
    }
  }
}
```

Restart Antigravity or open a new session.

---

## 🚀 Step-by-Step Usage Guide

### Method 1: Interactive Sidecar Aux Pane (Plugins Menu)

1. Open **Google Antigravity**.
2. Look at the right-hand **Auxiliary Pane** (or sidebar) and click the **Plugins** icon.
3. Select **Antigravity Tools**. The interactive dashboard will load in the pane.
4. Use the top tab navigation to switch between tools:
   - **📚 Prompt Library Tab**:
     - Type in the search bar or click a category pill (`Review`, `Debugging`, `Development`, `Architecture`, `Refactoring`).
     - Click **📋 Paste** on any prompt. If the prompt contains variables (e.g. `{{target_code}}`), a modal appears with live preview. Fill in the fields and click **Copy & Paste to Clipboard**.
     - Click **➕ New Prompt** to save your own custom prompt templates.
   - **🗺️ AI Roadmap Tab**:
     - Click **🔬 1. Scan Project** to discover tech stack, personas, and existing features.
     - Click **🥊 2. Analyze Competitors** to benchmark against market alternatives and review real user complaints.
     - Click **⚡ 3. Generate Roadmap** to construct a phased MoSCoW plan.
     - Click **📄 Export ROADMAP.md** to write the roadmap directly to the repository root.
     - Click **Copy Prompt for Feature** on any card to copy an implementation prompt for the AI agent.
   - **💡 Ideation & Audits Tab**:
     - Check the **Health Score Dashboard** for Security Posture, Performance, Code Quality, and Innovation.
     - Click **💡 Run Ideation Audit** to execute a fresh static analysis.
     - Filter discoveries by category (`Features`, `Performance`, `Security`, `Code Quality`).
     - Click **➕ Promote to Roadmap** on any idea to instantly turn it into an active feature ticket in `roadmap.json`!
     - Click **📄 Export IDEATION.md** to write the full audit report to the project root.
   - **🤖 Agency Agents Tab**:
     - Inspect detected Agency skills count across Windows host and workspace directories (280+ specialists).
     - Check the real-time generated files status checklist (`docs/agency-registry.md`, `.agents/workflows/agency-pipeline.md`, `.agents/rules/inter-agent-calling.md`, `agency-readme.md`).
     - Click **⚡ Integrate Agency Agents** to generate the phonebook registry, pipeline router, and inter-agent calling rules in under 1 second.
     - Use **1-Click Prompt Shortcuts** (`🚀 New Project`, `✨ Add Feature`, `🔬 Deep Research`, `🛡️ Reality Check`) to immediately load dynamic multi-agent execution prompts.
     - Search through all 280+ specialists by name, role, or description, with 1-click **"Copy ID"** or **"Call Agent"** to copy complete `[CALL_AGENT]` delegation snippets.

---

### Method 2: Autonomous AI Agent Execution (MCP Tools)

When working with an Antigravity pair programming agent, the agent can call all tools autonomously via JSON-RPC.

#### Available MCP Tools

| Module | Tool Name | Description |
| :--- | :--- | :--- |
| **Prompts** | `prompt_list` | Filter prompts by category, tag, search query, or favorites. |
| | `prompt_get` | Get full template, variables, and metadata by ID or title. |
| | `prompt_search` | Search prompt titles, descriptions, and content. |
| | `prompt_render` | Render a prompt template with variable substitution. |
| | `prompt_paste` | Render template and copy directly to the system clipboard. |
| | `prompt_save` | Save or update a prompt with auto-detected `{{vars}}`. |
| | `prompt_delete` | Remove a prompt from the library by ID. |
| | `prompt_categories` | Retrieve all categories, tags, and usage statistics. |
| **Roadmap** | `roadmap_analyze_project` | Deep codebase introspection detecting tech stack, personas, and vision. |
| | `roadmap_analyze_competitors` | Benchmark competitors, extracting real user complaints and market gaps. |
| | `roadmap_generate` | Generate phased MoSCoW roadmap with user stories & acceptance criteria. |
| | `roadmap_get` | Retrieve active project roadmap and progress. |
| | `roadmap_update_feature` | Update feature status (`idea`, `planned`, `in_progress`, `completed`). |
| | `roadmap_export_markdown` | Export formatted `ROADMAP.md` to workspace root. |
| **Ideation** | `ideation_analyze` | 4-pillar static analysis (features, performance, security, quality). |
| | `ideation_get` | Retrieve current ideation findings and health scores. |
| | `ideation_promote_to_roadmap` | Promote an ideation discovery into an active roadmap ticket. |
| | `ideation_export_markdown` | Export formatted `IDEATION.md` to workspace root. |
| **Agency** | `agency_integrate` | 1-click integration: generates registry, pipeline, inter-agent rule, and injects prompts. |
| | `agency_list_agents` | Lists and filters all installed Agency Agent skills with full paths and metadata. |
| | `agency_status` | Returns integration status, file presence, and installed agent counts. |

#### Example Agent Prompts
- *"Analyze this project and generate an Aperant-style MoSCoW roadmap with competitor insights."*
- *"Audit the repository for performance bottlenecks and security vulnerabilities, then export IDEATION.md."*
- *"Find the senior code review prompt from my library and paste it with language=TypeScript."*
- *"Promote security finding sec-001 to the roadmap as a Must-Have feature."*
- *"Integrate installed Agency Agents into this project and show me the master registry."*
- *"Run /agency-pipeline to assemble a squad for building a real-time analytics feature."*

---

### Method 3: Standalone Local Web Dashboard

You can run the web dashboard outside Antigravity in any standard browser:

```bash
# Launch on default port 4321
npm run ui

# Or specify a custom port
node dist/cli.js ui --port 8080
```

Open `http://localhost:4321` in your browser. All features (Prompt Library, Roadmap Generator, and Ideation Audits) are fully operational.

---

### Method 4: Command-Line Interface (CLI)

The plugin provides a command-line utility for terminal workflows:

```bash
# List all prompts in library
node dist/cli.js list

# Filter prompts by category
node dist/cli.js list Review

# Render a prompt and copy directly to OS clipboard
node dist/cli.js paste code-review-senior --var language=TypeScript --var target_code="src/modules/prompts/storage.ts"

# Inspect full JSON details of a prompt
node dist/cli.js get systematic-debugging

# Run as standalone MCP server over stdio
node dist/cli.js mcp
```

---

## 🧩 Extending with New Modules

The plugin uses an extensible module registry pattern ([src/modules/registry.ts](file:///d:/BackUp/programing_projects/antigravity_tools/src/modules/registry.ts)). To add a new capability (e.g., Code Snippets, Documentation Generator, Test Suite Synthesizer):

1. Create a directory in `src/modules/<module-name>/`.
2. Implement the `PluginModule` interface from [src/types.ts](file:///d:/BackUp/programing_projects/antigravity_tools/src/types.ts):
   ```typescript
   export interface PluginModule {
     readonly id: string;
     readonly name: string;
     readonly description: string;
     getTools(): MCPToolDefinition[];
     handleToolCall(toolName: string, args: Record<string, any>): Promise<MCPToolResult>;
     handleHttpRequest?(url: URL, req: any, res: any): Promise<boolean>;
   }
   ```
3. Register your module in [src/modules/registry.ts](file:///d:/BackUp/programing_projects/antigravity_tools/src/modules/registry.ts):
   ```typescript
   this.register(new YourNewModule());
   ```
4. Run `npm run build`. Your new tools will be automatically registered in the MCP server, and any HTTP routes will be mounted on the local web server.

---

## 🧪 Testing & Quality Assurance

Antigravity Tools includes automated unit and integration tests using Node.js's native test runner (`node:test`):

```bash
# Run complete test suite
npm test

# Run build watch mode during development
npm run build:watch
```

Tests verify:
- Template variable extraction with and without fallback defaults.
- Variable interpolation and edge-case handling.
- Atomic file storage and auto-seed initialization.
- Project analyzer codebase scanning and tech stack detection.
- Competitor service pain point mapping and gap identification.
- Roadmap generator MoSCoW phasing and markdown rendering.
- Code scanner pattern discovery, security rules, and performance detection.
- Ideation service health score calculations and markdown export.
- Ideation-to-Roadmap ticket promotion bridge.
- Full MCP tool dispatching and error handling.

---

## 📄 License

MIT &copy; Antigravity Tools Authors. Designed for pair-programming excellence in Google Antigravity.
