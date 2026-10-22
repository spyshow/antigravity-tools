# Antigravity Toolkit Plugin

An extensible productivity plugin for [Google Antigravity](https://antigravity.google/docs/plugins/). Built natively in TypeScript/Node.js, it provides a modular architecture for multiple developer functions, starting with a powerful **Prompt Library** with template variables, search, clipboard integration, and an interactive Web Dashboard.

---

## Features

### Function 1: Prompt Library & Template Manager
- **Save & Organize Prompts**: Store reusable developer prompts organized by categories and tags with search.
- **Dynamic Template Variables**: Embed placeholders using `{{variable}}` or `{{variable:defaultValue}}`. Variables are auto-detected, validated, and interpolated.
- **Direct Clipboard Integration**: 1-click or single tool call to render variables and copy straight to your system clipboard (ready to `Ctrl+V` into Antigravity chat or code editor).
- **Full MCP Server Integration**: Exposes 8 standard Model Context Protocol tools to Antigravity agents.
- **Interactive Web Dashboard**: Sleek local UI with search, category tabs, tag filters, variable fill modal, live preview, and import/export.

### Function 2: AI-Assisted Roadmap & Competitor Planner (Aperant Model)
- **Deep Codebase Discovery**: Automated introspection detecting project type, tech stack (TypeScript, Python, Rust, Go, etc.), target audience personas, value proposition, and technical gaps.
- **Competitor Intelligence & Pain Point Extraction**: Benchmarks direct & indirect market competitors, extracting real user complaints (Reddit, GitHub Issues, App Reviews) with severity ratings and opportunity angles.
- **MoSCoW Prioritized Phasing**: Automatically synthesizes features into 3 progressive phases (MVP Foundation, Competitor Differentiation, Ecosystem & Scale) with Must/Should/Could/Won't Have priorities.
- **Competitor Pain Point Linking**: Features explicitly link back to competitor flaw IDs (e.g., `CP-01`, `CP-02`), ensuring your product roadmap builds features that win market share.
- **Testable Acceptance Criteria & User Stories**: Every roadmap feature includes structured acceptance criteria and value-driven user stories.
- **1-Click Feature Implementation Prompts**: Generate copy-paste ready implementation prompts tailored to any feature on the roadmap.
- **One-Click ROADMAP.md Export**: Export publication-ready GitHub Flavored Markdown roadmaps directly to the repository root.

### Function 3: Codebase Ideation, Performance & Security Audits (Aperant Model)
- **4-Pillar Discovery System**:
  1. **🚀 Code-Revealed Feature Opportunities (`ci-xxx`)**: Extension opportunities naturally enabled by existing architectural patterns.
  2. **⚡ Performance Bottlenecks (`perf-xxx`)**: Synchronous I/O detection, LRU caching opportunities, and bundle size reduction.
  3. **🛡️ Security Hardening & Vulnerabilities (`sec-xxx`)**: Static risk auditing for path traversal (CWE-22), credential leaks (CWE-798), wildcard CORS (CWE-942), and DOM injection.
  4. **🧹 Code Quality & Technical Debt (`cq-xxx`)**: Detection of large files, anti-patterns, and test coverage gaps.
- **Project Health Score Matrix**: Quantitative scores (0-100) for Security Posture, Runtime Performance, Code Quality, and Innovation Potential.
- **Direct Bridge to Roadmap**: 1-click **"Promote to Roadmap"** converts any ideation discovery directly into an active, phased MoSCoW feature ticket in `roadmap.json`!
- **1-Click Remediation Prompts**: Instant copy-paste ready prompts for Antigravity AI pair programmers to fix issues or implement features.
- **One-Click IDEATION.md Export**: Render and commit publication-grade audit reports into the workspace root.
- **Extensible Modular Architecture**: Built with a clean module system (`src/modules/*`), allowing you to easily add new functions without touching core server logic.

---

## Directory Structure

Conforms strictly to the official [Antigravity Plugins Specification](https://antigravity.google/docs/plugins/):

```
antigravity_tools/
├── plugin.json                 # Antigravity Plugin manifest ($schema)
├── mcp_config.json             # MCP server connection configuration
├── skills/
│   └── prompt-library/
│       └── SKILL.md            # Agent skill instructions & tool guidelines
├── rules/
│   └── prompt-library.md       # Behavioral rules for prompt reuse
├── bin/
│   └── agy-tools.cmd           # Windows launcher
├── src/
│   ├── config.ts               # Storage path & environment resolution
│   ├── types.ts                # TypeScript interfaces & MCP schemas
│   ├── index.ts                # Library exports
│   ├── mcp-server.ts           # JSON-RPC 2.0 stdio MCP server
│   ├── cli.ts                  # CLI runner (ui, list, paste, get, mcp)
│   ├── modules/
│   │   ├── registry.ts         # Central registry for all plugin modules
│   │   └── prompts/            # Function 1: Prompts Module
│   │       ├── types.ts        # Data contracts
│   │       ├── storage.ts      # Atomic JSON storage
│   │       ├── default-prompts.ts # Seed prompts (Review, Debug, TDD, Refactor, RFC)
│   │       ├── interpolator.ts # Template parser & renderer
│   │       ├── clipboard.ts    # Cross-platform clipboard writer
│   │       ├── service.ts      # Business logic
│   │       ├── tools.ts        # MCP tools definitions
│   │       └── index.ts        # Module implementation & REST handlers
│   ├── web/
│   │   ├── server.ts           # Local dashboard HTTP server
│   │   └── public/
│   │       ├── index.html      # Responsive dashboard interface
│   │       ├── styles.css      # Dark theme UI
│   │       └── app.js          # Interactive frontend
│   └── tests/                  # Unit test suite
└── package.json
```

---

## Installation in Antigravity

Per the [Antigravity Plugin Documentation](https://antigravity.google/docs/plugins/), you can install this plugin either globally or at the workspace level:

### Option A: Install via Antigravity CLI
```bash
# In your terminal
agy plugin install d:/BackUp/programing_projects/antigravity_tools
```

### Option B: Install via Antigravity Chat TUI
In an interactive Antigravity session, run:
```bash
/plugin install d:/BackUp/programing_projects/antigravity_tools
```

### Option C: Global Manual Installation
Link or copy this folder to your global Antigravity plugins directory:
- Windows: `%USERPROFILE%\.gemini\config\plugins\antigravity-toolkit`
- macOS / Linux: `~/.gemini/config/plugins/antigravity-toolkit`

---

## Using the Prompt Library

### 1. From Antigravity Agent (MCP Tools)
When the plugin is active, Antigravity has access to:
- `prompt_list`: List all prompts with optional category, tag, or favorite filters.
- `prompt_get`: Retrieve full template and variables for a prompt.
- `prompt_search`: Search prompts by keywords.
- `prompt_render`: Render template variables into text.
- `prompt_paste`: Render template with variables and copy straight to clipboard!
- `prompt_save`: Save a new prompt (variables detected automatically).
- `prompt_delete`: Delete prompt by ID.
- `prompt_categories`: List category counts and tags.

### 2. From the Interactive Web Dashboard
Run:
```bash
npm run ui
# or
npx agy-tools ui
```
Opens your browser at `http://localhost:4321`. From here you can:
- Browse, search, and filter prompts.
- Click **Paste**: if the prompt has variables, an interactive modal lets you fill them with live preview; if not, it copies to clipboard instantly!
- Click **New Prompt**: write templates using `{{var}}` or `{{var:default}}`.
- Export/Import JSON library backups.

### 3. From the Command Line (CLI)
```bash
# List all prompts
node dist/cli.js list

# Paste a prompt to clipboard with variable substitutions
node dist/cli.js paste code-review-senior --var language=TypeScript --var target_code="src/auth.ts"

# Launch the Web Dashboard
node dist/cli.js ui
```

---

## Adding New Functions / Modules in the Future

The plugin is designed with a pluggable module registry (`src/modules/registry.ts`). To add a new function (e.g. Snippets or Documentation Generator):

1. Create a folder in `src/modules/<your-function>/` implementing the `PluginModule` interface:
   - `getTools()`: Return your MCP tool schemas.
   - `handleToolCall(toolName, args)`: Handle tool execution.
   - `handleHttpRequest(url, req, res)`: (Optional) Register REST API routes.
2. In `src/modules/registry.ts`, register your new module:
   ```typescript
   this.register(new YourNewModule());
   ```
3. Rebuild with `npm run build`. Both the MCP server and Web Dashboard will automatically expose your new function!
