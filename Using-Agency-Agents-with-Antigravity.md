# Using Agency Agents with Antigravity

**Date**: October 22, 2026 at 11:12 AM
**Turns**: 2
**Source**: [Gemini Chat](https://gemini.google.com/app/560bef6ce9120a1e)

---

## Turn 1

### 🤖 Assistant

Save the following script as **`setup-agency-antigravity.sh`** in the root of any project folder.
Because you are installing the agents via the **Agency Agents Windows App**, this script automatically searches across **Windows User Profiles** (via WSL `/mnt/c/Users/...` or Git Bash), standard `~/.gemini/` global folders, and local `.agents/skills/` folders to locate your installed `agency-*` skills—without modifying a single `SKILL.md` file (so your Windows app ledger stays **100% Current with zero drift**).

### 1. The Generator Script (`setup-agency-antigravity.sh`)

```bash
#!/usr/bin/env bash
# ==============================================================================
# Agency Agents x Google Antigravity Project Bootstrapper
# Generates:
#   1. docs/agency-registry.md               (Dynamic index of all installed agents)
#   2. .agents/workflows/agency-pipeline.md  (Universal multi-agent router workflow)
#   3. .agents/rules/inter-agent-calling.md  (Always-on agent-to-agent delegation rule)
# ==============================================================================

set -euo pipefail

echo "🚀 Bootstrapping Agency Agents Multi-Agent Pipeline for Antigravity..."

# 1. Create required project directories
mkdir -p docs .agents/workflows .agents/rules

# 2. Discover all possible Antigravity skill directories (Project, Linux/WSL, Git Bash, Windows Host)
declare -a SKILL_DIRS=()

# Local project skills
[ -d ".agents/skills" ] && SKILL_DIRS+=(".agents/skills")

# Standard HOME paths (Git Bash / Native / WSL home)
[ -d "$HOME/.gemini/antigravity/skills" ] && SKILL_DIRS+=("$HOME/.gemini/antigravity/skills")
[ -d "$HOME/.gemini/config/skills" ] && SKILL_DIRS+=("$HOME/.gemini/config/skills")

# Windows Host User Profile paths (when running inside WSL2 after installing via Windows App)
if [ -d "/mnt/c/Users" ]; then
  for win_user in /mnt/c/Users/*; do
    [ -d "$win_user/.gemini/antigravity/skills" ] && SKILL_DIRS+=("$win_user/.gemini/antigravity/skills")
    [ -d "$win_user/.gemini/config/skills" ] && SKILL_DIRS+=("$win_user/.gemini/config/skills")
    [ -d "$win_user/AppData/Roaming/antigravity/skills" ] && SKILL_DIRS+=("$win_user/AppData/Roaming/antigravity/skills")
  done
fi

# 3. Generate docs/agency-registry.md
REGISTRY_FILE="docs/agency-registry.md"
TMP_ROWS=$(mktemp)
AGENT_COUNT=0

for dir in "${SKILL_DIRS[@]}"; do
  for skill_file in "$dir"/agency-*/SKILL.md; do
    [ -f "$skill_file" ] || continue
    slug=$(basename "$(dirname "$skill_file")")
    
    # Extract description from YAML frontmatter and strip quotes/carriage returns
    desc=$(grep -i -m 1 '^description:' "$skill_file" 2>/dev/null | sed -E 's/^description:[[:space:]]*//I; s/^["'\'']//; s/["'\'']$//; s/\r$//' || true)
    [ -z "$desc" ] && desc="Specialized Agency Agent persona ($slug)"
    
    # Escape any pipe characters so Markdown table doesn't break
    desc=$(echo "$desc" | sed 's/|/\\|/g')
    
    echo "| \`$slug\` | $desc | \`$skill_file\` |" >> "$TMP_ROWS"
  done
done

{
  echo "# Agency Agents Master Registry"
  echo ""
  echo "> Auto-generated index of installed \`agency-*\` skills available to Antigravity."
  echo "> Any agent can summon another specialist from this table using the \`[CALL_AGENT]\` protocol."
  echo ""
  echo "| Skill Slug | Specialty & Trigger Description | Skill Path |"
  echo "| :--- | :--- | :--- |"
  if [ -s "$TMP_ROWS" ]; then
    # Deduplicate by skill slug (column 1)
    sort -u -t '|' -k2,2 "$TMP_ROWS"
  else
    echo "| *No agents detected yet* | Install agents via the Agency Agents Windows App to `.agents/skills/` or `~/.gemini/antigravity/skills/`, then re-run `./setup-agency-antigravity.sh` | \`N/A\` |"
  fi
} > "$REGISTRY_FILE"

if [ -s "$TMP_ROWS" ]; then
  AGENT_COUNT=$(sort -u -t '\vert{}' -k2,2 "$TMP_ROWS" | wc -l | tr -d ' ')
fi
rm -f "$TMP_ROWS"

echo "✅ Generated $REGISTRY_FILE ($AGENT_COUNT unique agency-* skills indexed)"

# 4. Generate .agents/workflows/agency-pipeline.md
PIPELINE_FILE=".agents/workflows/agency-pipeline.md"
cat << 'EOF' > "$PIPELINE_FILE"
---
description: Dynamic multi-agent router and recursive handoff pipeline across all installed Agency Agents
---

# Universal Agency Pipeline (Dynamic Multi-Agent Router)

You are operating as the **Agency Multi-Agent Runtime**. You have access to all installed `agency-*` skills indexed in `docs/agency-registry.md`.

## Phase 1: Triage & Squad Assembly
1. Activate skill `agency-agents-orchestrator` (or `agency-project-shepherd`).
2. Read `docs/agency-registry.md` to inspect all available specialist slugs and their exact file paths.
3. Analyze the user's request and select the optimal specialist squad across divisions:
   - **Product & PM:** `agency-project-shepherd`, `agency-senior-project-manager`, `agency-product-manager`, `agency-sprint-prioritizer`, `agency-trend-researcher`, `agency-feedback-synthesizer`
   - **Design & UX:** `agency-ux-architect`, `agency-ui-designer`, `agency-ux-researcher`, `agency-brand-guardian`, `agency-ui-finish-gate-reviewer`, `agency-whimsy-injector`
   - **Engineering & Architecture:** `agency-codebase-onboarding-engineer`, `agency-backend-architect`, `agency-frontend-developer`, `agency-database-optimizer`, `agency-ai-engineer`, `agency-devops-automator`, `agency-security-engineer`, `agency-autonomous-optimization-architect`, `agency-rapid-prototyper`, `agency-senior-developer`, `agency-technical-writer`
   - **Specialized & MCP:** `agency-workflow-architect`, `agency-mcp-builder`, `agency-zk-steward`, `agency-identity-graph-operator`
   - **Testing & Quality Gates:** `agency-code-reviewer`, `agency-api-tester`, `agency-performance-benchmarker`, `agency-evidence-collector`, `agency-reality-checker`
   - **Domain Specialists:** Select any other matching `agency-*` slug listed in `docs/agency-registry.md`.
4. Create or update `docs/active-spec.md` with:
   - Scope & Technical Architecture Contract
   - Ordered Agent Execution Queue (`[ ] agency-<slug> — Deliverable`)
   - Section `## Sub-Agent Consultations` for dynamic handoffs

## Phase 2: Sequential & On-Demand Agent Execution Loop
For each assigned agent in the `docs/active-spec.md` queue:
1. **Load Persona:** Open the agent's `SKILL.md` path listed in `docs/agency-registry.md` and strictly adopt its **Identity**, **Critical Rules**, and **Technical Deliverables**.
2. **Execute Deliverable:** Perform the scoped work using `docs/active-spec.md` as the shared source of truth, then mark the agent `[x]` in `docs/active-spec.md`.
3. **Evaluate Dynamic Handoff (`[CALL_AGENT]`):**
   - If the active agent hits a sub-problem outside its core specialty (e.g., `agency-frontend-developer` needs an API endpoint adjusted, or `agency-backend-architect` needs a query optimized or threat-modeled), it MUST emit:
     `[CALL_AGENT: agency-<target-slug> | REASON: <why> | TASK: <specific sub-task> | RETURN_TO: agency-<current-slug>]`
   - Immediately pause the current agent, read the target agent's `SKILL.md` from `docs/agency-registry.md`, execute the sub-task, log the result under `## Sub-Agent Consultations` in `docs/active-spec.md`, and resume `RETURN_TO`.

## Phase 3: Adversarial Verification Gate
1. Once all queued and dynamically called agents finish, activate `agency-code-reviewer` and `agency-reality-checker`.
2. Audit all modified files and outputs against `docs/active-spec.md` and run verification checks.
3. If `agency-reality-checker` identifies any defects or missing edge cases, automatically trigger `[CALL_AGENT: agency-<responsible-specialist>]` to remediate before closing the task.
EOF

echo "✅ Generated $PIPELINE_FILE (invoke via /agency-pipeline)"

# 5. Generate .agents/rules/inter-agent-calling.md
RULE_FILE=".agents/rules/inter-agent-calling.md"
cat << 'EOF' > "$RULE_FILE"
---
trigger: always_on
description: Enables any active agency-* skill to dynamically summon and delegate sub-tasks to other installed agency-* skills
---

# Inter-Agent Calling & Delegation Protocol

Whenever you are operating under an `agency-*` skill (or handling a complex engineering task) and encounter a sub-problem that falls into another specialist's domain:

1. **Lookup Specialist:** Check `docs/agency-registry.md` to find the best-suited `agency-<role-slug>` and its `SKILL.md` path.
2. **Announce Delegation:** Output the delegation banner:
   > 🔄 **`[CALL_AGENT: agency-<target-slug>]`** — *Delegating sub-task: [brief description]*
3. **Load & Execute:** Read the target agent's `SKILL.md` file, adopt its persona constraints and quality checklist, and complete the sub-task.
4. **Return Control:** If called from an active parent agent, output:
   > ↩️ **`[RETURN_TO: agency-<parent-slug>]`** — *Sub-task complete, resuming primary workflow*
   and continue the parent agent's task using the specialist's output.
EOF

echo "✅ Generated $RULE_FILE (always-on inter-agent calling enabled)"
echo ""
echo "🎉 Setup Complete!"
echo "   • Indexed Agents : $AGENT_COUNT (saved in docs/agency-registry.md)"
echo "   • Slash Command  : /agency-pipeline"
echo "   • Auto-Handoffs  : Active via .agents/rules/inter-agent-calling.md"

```

### 2. How to Run It in Your Project
After installing your agents (either globally or into your project) using the **Agency Agents Windows App**, open your terminal (WSL2 or Git Bash) in your project's root folder and run:

```bash
chmod +x setup-agency-antigravity.sh
./setup-agency-antigravity.sh

```

### What Happens When You Run It:

- **Finds Windows & WSL Skills Automatically:** Whether the Windows app installed the skills into `C:\Users\<You>\.gemini\antigravity\skills\`, your WSL `~/.gemini/` folder, or your project's `.agents/skills/` folder, the script locates every `SKILL.md` file and builds `docs/agency-registry.md` with the exact file path to each agent.
- **Zero Ledger Drift:** It never modifies the `SKILL.md` files themselves, so the Agency Agents Windows GUI will continue to show all 282 agents as **Current**.
- **Re-run Anytime:** If you install or remove agents in the Windows app later, just run `./setup-agency-antigravity.sh` again to refresh the registry table.

## Turn 2

### 👤 User

Yes, and also an agency-readme.md file that explains step by step how to use it in Antigravity or other programs, to call the agents' Orchestrator to do a project or a feature or research, etc., or to call a single agent. (MUST BE A STEP BY STEP, consider the user has 0 knowledge)

### 🤖 Assistant

Save either the **PowerShell script (`setup-agency-antigravity.ps1`)** or the **updated Bash script (`setup-agency-antigravity.sh`)** in your project's root folder.
Both scripts automatically create **four files** in your project:

1. `docs/agency-registry.md` — The master phonebook of all your installed agents.
2. `.agents/workflows/agency-pipeline.md` — The `/agency-pipeline` slash command.
3. `.agents/rules/inter-agent-calling.md` — The rule that lets agents call other agents for help.
4. `agency-readme.md` — A complete, zero-knowledge, step-by-step beginner's manual for using the Orchestrator and individual agents in Antigravity, Cursor, Claude Code, and Windsurf.

### Option 1: Native Windows PowerShell Script (`setup-agency-antigravity.ps1`)
Save this file as **`setup-agency-antigravity.ps1`** in your main project folder. To run it, open PowerShell in your project folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-agency-antigravity.ps1

```

```powershell
# ==============================================================================
# Agency Agents x Google Antigravity Project Bootstrapper (PowerShell)
# Generates:
#   1. docs/agency-registry.md               (Dynamic index of all installed agents)
#   2. .agents/workflows/agency-pipeline.md  (Universal multi-agent router workflow)
#   3. .agents/rules/inter-agent-calling.md  (Always-on agent-to-agent delegation rule)
#   4. agency-readme.md                      (Zero-knowledge step-by-step user guide)
# ==============================================================================

$ErrorActionPreference = "Stop"
Write-Host "Bootstrapping Agency Agents Multi-Agent System..." -ForegroundColor Cyan

# 1. Create required project directories
New-Item -ItemType Directory -Force -Path "docs", ".agents/workflows", ".agents/rules" | Out-Null

# 2. Discover all possible Antigravity skill directories
$SkillDirs = @(
    (Join-Path $PWD ".agents\skills"),
    (Join-Path $env:USERPROFILE ".gemini\antigravity\skills"),
    (Join-Path $env:USERPROFILE ".gemini\config\skills"),
    (Join-Path $env:APPDATA "antigravity\skills")
) | Where-Object { Test-Path $_ }

# 3. Scan installed agents and build docs/agency-registry.md
$RegistryFile = "docs/agency-registry.md"
$Agents = @{}

foreach ($dir in$SkillDirs) {
    $skillFiles = Get-ChildItem -Path$dir -Filter "SKILL.md" -Recurse -ErrorAction SilentlyContinue |
                  Where-Object { $_.Directory.Name -like "agency-*" }
    foreach ($file in$skillFiles) {
        $slug =$file.Directory.Name
        if (-not $Agents.ContainsKey($slug)) {$desc = "Specialized Agency Agent persona ($slug)"
            $lines = Get-Content -Path$file.FullName -TotalCount 20 -ErrorAction SilentlyContinue
            foreach ($line in$lines) {
                if ($line -match '^description:\s*(.+)$') {
                    $desc =$Matches[1].Trim().Trim('"').Trim("'")
                    break
                }
            }
            $desc =$desc -replace '\|', '\|'
            $relPath =$file.FullName -replace '\\', '/'
            $Agents[$slug] = "| ``$slug`` | $desc | ``$relPath`` |"
        }
    }
}

$RegistryContent = @(
    "# Agency Agents Master Registry",
    "",
    "> Auto-generated index of installed ``agency-*`` skills available to Antigravity and AI IDEs.",
    "> Any agent can summon another specialist from this table using the ``[CALL_AGENT]`` protocol.",
    "",
    "| Skill Slug | Specialty & Trigger Description | Skill Path |",
    "| :--- | :--- | :--- |"
)

if ($Agents.Count -gt 0) {
    $SortedRows = $Agents.Keys | Sort-Object | ForEach-Object { $Agents[$_] }
    $RegistryContent += $SortedRows
} else {
    $RegistryContent += "| *No agents detected yet* | Install agents via the Agency Agents Windows App, then re-run ``.\setup-agency-antigravity.ps1`` | ``N/A`` |"
}

$RegistryContent -join "`n" | Set-Content -Path $RegistryFile -Encoding UTF8
Write-Host "Generated $RegistryFile ($($Agents.Count) unique agency-* skills indexed)" -ForegroundColor Green

# 4. Generate .agents/workflows/agency-pipeline.md
$PipelineFile = ".agents/workflows/agency-pipeline.md"
$PipelineContent = @'
---
description: Dynamic multi-agent router and recursive handoff pipeline across all installed Agency Agents
---

# Universal Agency Pipeline (Dynamic Multi-Agent Router)

You are operating as the **Agency Multi-Agent Runtime**. You have access to all installed `agency-*` skills indexed in `docs/agency-registry.md`.

## Phase 1: Triage & Squad Assembly
1. Activate skill `agency-agents-orchestrator` (or `agency-project-shepherd`).
2. Read `docs/agency-registry.md` to inspect all available specialist slugs and their exact file paths.
3. Analyze the user's request (New Project, Feature, Bugfix, or Research) and select the optimal specialist squad across divisions:
   - **Product & PM:** `agency-project-shepherd`, `agency-senior-project-manager`, `agency-product-manager`, `agency-sprint-prioritizer`, `agency-trend-researcher`, `agency-feedback-synthesizer`
   - **Design & UX:** `agency-ux-architect`, `agency-ui-designer`, `agency-ux-researcher`, `agency-brand-guardian`, `agency-ui-finish-gate-reviewer`, `agency-whimsy-injector`
   - **Engineering & Architecture:** `agency-codebase-onboarding-engineer`, `agency-backend-architect`, `agency-frontend-developer`, `agency-database-optimizer`, `agency-ai-engineer`, `agency-devops-automator`, `agency-security-engineer`, `agency-autonomous-optimization-architect`, `agency-rapid-prototyper`, `agency-senior-developer`, `agency-technical-writer`
   - **Specialized & MCP:** `agency-workflow-architect`, `agency-mcp-builder`, `agency-zk-steward`, `agency-identity-graph-operator`
   - **Testing & Quality Gates:** `agency-code-reviewer`, `agency-api-tester`, `agency-performance-benchmarker`, `agency-evidence-collector`, `agency-reality-checker`
   - **Domain Specialists:** Select any other matching `agency-*` slug listed in `docs/agency-registry.md`.
4. Create or update `docs/active-spec.md` with:
   - Scope & Technical Architecture Contract
   - Ordered Agent Execution Queue (`[ ] agency-<slug> — Deliverable`)
   - Section `## Sub-Agent Consultations` for dynamic handoffs

## Phase 2: Sequential & On-Demand Agent Execution Loop
For each assigned agent in the `docs/active-spec.md` queue:
1. **Load Persona:** Open the agent's `SKILL.md` path listed in `docs/agency-registry.md` and strictly adopt its **Identity**, **Critical Rules**, and **Technical Deliverables**.
2. **Execute Deliverable:** Perform the scoped work using `docs/active-spec.md` as the shared source of truth, then mark the agent `[x]` in `docs/active-spec.md`.
3. **Evaluate Dynamic Handoff (`[CALL_AGENT]`):**
   - If the active agent hits a sub-problem outside its core specialty (e.g., `agency-frontend-developer` needs an API endpoint adjusted, or `agency-backend-architect` needs a query optimized or threat-modeled), it MUST emit:
     `[CALL_AGENT: agency-<target-slug> | REASON: <why> | TASK: <specific sub-task> | RETURN_TO: agency-<current-slug>]`
   - Immediately pause the current agent, read the target agent's `SKILL.md` from `docs/agency-registry.md`, execute the sub-task, log the result under `## Sub-Agent Consultations` in `docs/active-spec.md`, and resume `RETURN_TO`.

## Phase 3: Adversarial Verification Gate
1. Once all queued and dynamically called agents finish, activate `agency-code-reviewer` and `agency-reality-checker`.
2. Audit all modified files and outputs against `docs/active-spec.md` and run verification checks.
3. If `agency-reality-checker` identifies any defects or missing edge cases, automatically trigger `[CALL_AGENT: agency-<responsible-specialist>]` to remediate before closing the task.
'@
$PipelineContent \vert{} Set-Content -Path$PipelineFile -Encoding UTF8
Write-Host "Generated $PipelineFile" -ForegroundColor Green

# 5. Generate .agents/rules/inter-agent-calling.md
$RuleFile = ".agents/rules/inter-agent-calling.md"
$RuleContent = @'
---
trigger: always_on
description: Enables any active agency-* skill to dynamically summon and delegate sub-tasks to other installed agency-* skills
---

# Inter-Agent Calling & Delegation Protocol

Whenever you are operating under an `agency-*` skill (or handling a complex engineering/research task) and encounter a sub-problem that falls into another specialist's domain:

1. **Lookup Specialist:** Check `docs/agency-registry.md` to find the best-suited `agency-<role-slug>` and its `SKILL.md` path.
2. **Announce Delegation:** Output the delegation banner:
   > 🔄 **`[CALL_AGENT: agency-<target-slug>]`** — *Delegating sub-task: [brief description]*
3. **Load & Execute:** Read the target agent's `SKILL.md` file, adopt its persona constraints and quality checklist, and complete the sub-task.
4. **Return Control:** If called from an active parent agent, output:
   > ↩️ **`[RETURN_TO: agency-<parent-slug>]`** — *Sub-task complete, resuming primary workflow*
   and continue the parent agent's task using the specialist's output.
'@
$RuleContent \vert{} Set-Content -Path$RuleFile -Encoding UTF8
Write-Host "Generated $RuleFile" -ForegroundColor Green

# 6. Generate agency-readme.md (Zero-Knowledge Beginner's Guide)
$ReadmeFile = "agency-readme.md"
$ReadmeContent = @'
# Complete Beginner's Guide to Agency Agents

Welcome! This guide explains—step by step, assuming **zero prior knowledge**—how to use your 282 AI specialist agents in **Google Antigravity** (and other AI coding tools like **Cursor**, **Claude Code**, and **Windsurf**).

---

## 1. What Did We Just Set Up? (The Simple Explanation)

Think of your normal AI chat as **one general worker** who tries to do everything (design, coding, testing, marketing) all at once, often cutting corners.

With **Agency Agents**, you now have a **virtual company of 282 specialized experts** installed on your computer:
* **`agency-agents-orchestrator` / `agency-project-shepherd`**: The Boss / Project Manager who plans the work and hires the right experts.
* **`agency-backend-architect`**: The Senior Server & Database Engineer.
* **`agency-frontend-developer`**: The User Interface & Web Designer.
* **`agency-trend-researcher`**: The Market & Technology Researcher.
* **`agency-reality-checker`**: The strict Quality Assurance Inspector who tests everything and refuses to let broken work pass.

### How the Files in Your Project Work Together:
1. **`docs/agency-registry.md` (The Company Directory):** A complete list of every agent installed on your computer, what they are good at, and where their instructions live.
2. **`.agents/workflows/agency-pipeline.md` (The `/agency-pipeline` Button):** A master playbook that tells the AI how to assemble a team, write a plan in `docs/active-spec.md`, and run multiple agents in order.
3. **`.agents/rules/inter-agent-calling.md` (The Walkie-Talkie Rule):** Allows any agent who gets stuck to automatically call another specialist agent for help (`[CALL_AGENT]`) and then return to their job.

---

## 2. Step-by-Step: First-Time Setup (Do This Once)

### Step 1: Install the Agents Using the Windows App
1. Open the **Agency Agents** desktop app on Windows.
2. Click **Tools** on the left sidebar and make sure **Antigravity** (or Cursor/Claude Code) is detected.
3. To install all agents at once, browse the divisions or **Teams** tab, select the agents you want, choose **Global** (available in all projects) or **Project** (only this folder), and click **Install / Deploy**.

### Step 2: Run the Generator Script in Your Project Folder
Whenever you start a new project folder, run the setup script in that folder so the AI knows where your agents are:
* **On Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\setup-agency-antigravity.ps1

```

- **On WSL / Git Bash / Linux / Mac:**
  ```bash
  chmod +x setup-agency-antigravity.sh
  ./setup-agency-antigravity.sh
  
  ```
- **How to know it worked:** Open `docs/agency-registry.md` and verify you see a table listing your `agency-*` agents.

## 3. How to Use It in Google Antigravity (Copy-Paste Prompts)
Open your project folder inside **Google Antigravity** and open the AI Agent chat panel. Below are the exact copy-paste prompts for every situation.

### Scenario A: Build a Whole New Project from Scratch (Using the Orchestrator)
When starting from zero, you don't need to pick which agents to use. Let the **Orchestrator** pick the team, write the blueprint, and build it step by step.
**Step 1:** Click into the Antigravity chat box.**Step 2:** Copy and paste this exact prompt (replace the bracketed text with your idea):

```plaintext
/agency-pipeline
I want to build a new project from scratch: [Describe your app idea in plain English, e.g., a web dashboard that tracks factory machine temperatures and sends alerts].

1. Start as `agency-agents-orchestrator` and read `docs/agency-registry.md`.
2. Pick the best agents for Product Planning, Architecture, Frontend, Backend, and QA.
3. Write the full project blueprint and agent checklist into `docs/active-spec.md`.
4. Pause and show me the plan in `docs/active-spec.md` before writing code, or proceed phase by phase.

```
**Step 3:** Once the Orchestrator writes `docs/active-spec.md`, reply:

```plaintext
Approved. Execute Phase 2 of /agency-pipeline and let each specialist agent build their part. Remember that agents can use [CALL_AGENT] if they need help from another specialist.

```

### Scenario B: Add a New Feature to an Existing Project
When you already have code and want to add a new feature safely without breaking existing files:
**Copy and paste this prompt:**

```plaintext
/agency-pipeline
I want to add a new feature to this project: [Describe the feature, e.g., Add a PDF export button to the reports page that includes charts and summary tables].

First, use `agency-codebase-onboarding-engineer` to inspect how our current project is structured. Then have `agency-project-shepherd` write the implementation steps into `docs/active-spec.md`, and run the required engineering and QA agents to build and test it.

```

### Scenario C: Do Deep Research, Architecture Planning, or Market Analysis (No Code Changes)
Sometimes you don't want the AI to touch your code yet—you want it to research a technology, compare libraries, audit security, or study competitors.
**Copy and paste this prompt:**

```plaintext
Use `agency-agents-orchestrator` and read `docs/agency-registry.md`.
I need a deep research and feasibility report on: [Describe topic, e.g., The best real-time time-series database and architecture for storing 10,000 sensor readings per second].

Summon the appropriate research and architecture agents (such as `agency-trend-researcher`, `agency-backend-architect`, and `agency-database-optimizer`). Do NOT modify any application code. Write a comprehensive research report with pros, cons, and recommendations to `docs/research-report.md`.

```

### Scenario D: Call a Single Specialist Agent Directly
When you have a small, specific task (like fixing a slow database query, polishing a button's design, or reviewing code for bugs), you don't need the whole team—just call **one** agent by name.
**How to find the agent's name:** Open `docs/agency-registry.md` and press `Ctrl+F` to search for a keyword (like `database`, `security`, `frontend`, `ui`, `devops`).
**Copy-paste examples for calling a single agent:**

- **To build or fix a UI screen:**
  ```plaintext
  Activate `agency-frontend-developer`. Redesign the settings page component so it is mobile-friendly, accessible, and has clean loading states.
  
  ```
- **To design an API or backend service:**
  ```plaintext
  Activate `agency-backend-architect`. Design the REST API endpoints and database schema for user role permissions.
  
  ```
- **To speed up slow database queries:**
  ```plaintext
  Activate `agency-database-optimizer`. Inspect our database queries and add the proper indexes to make the dashboard load faster.
  
  ```
- **To audit your code for bugs and fake placeholders before releasing:**
  ```plaintext
  Activate `agency-reality-checker`. Review all files we changed today, check for edge cases or unfinished TODOs, and run the tests.
  
  ```

### Scenario E: How Agents Call Other Agents Automatically (`[CALL_AGENT]`)
Because `.agents/rules/inter-agent-calling.md` is active in your project, **you don't have to babysit single agents.**
For example, if you ask `agency-frontend-developer` to build a login form, and it realizes the backend password-check route is missing a security token, it will automatically output:

> 🔄 **`[CALL_AGENT: agency-security-engineer]`** — *Delegating sub-task: Verify JWT token cookie security settings*
It will read the Security Engineer's `SKILL.md` file, solve the security issue, and then switch right back to `agency-frontend-developer` to finish your login form.
You can also explicitly remind any agent in chat:

> *"Start with `agency-frontend-developer`, and feel free to call any other agent from `docs/agency-registry.md` if you need backend or database changes."*

## 4. How to Use This Setup in Other Programs (Cursor, Claude Code, Windsurf)
Even though `.agents/workflows/` and `.agents/rules/` are built natively for **Google Antigravity**, the exact same files work in **Cursor**, **Claude Code**, **Windsurf**, and **GitHub Copilot**! Here is how to trigger them in those tools:

### In Cursor IDE

1. Open Cursor Chat (`Ctrl+L` or `Ctrl+I` for Composer/Agent mode).
2. Type `@` and reference the workflow and rule files directly:
   ```plaintext
   Follow the instructions in @.agents/workflows/agency-pipeline.md and @.agents/rules/inter-agent-calling.md using the agent list in @docs/agency-registry.md.
   Task: [Describe your project, feature, or research task]
   
   ```
3. *(Optional Shortcut)* Copy `.agents/rules/inter-agent-calling.md` into `.cursor/rules/inter-agent-calling.mdc` so Cursor loads it automatically on every chat.

### In Claude Code (CLI)

1. In your terminal, start `claude`.
2. Tell Claude to read your pipeline file:
   ```plaintext
   Read .agents/workflows/agency-pipeline.md, .agents/rules/inter-agent-calling.md, and docs/agency-registry.md, then run the pipeline for: [Your task]
   
   ```
3. *(Optional Shortcut)* Add this single line to your project's `CLAUDE.md` file so Claude Code always knows about your 282 agents:
   ```markdown
   Always follow `.agents/rules/inter-agent-calling.md` and consult `docs/agency-registry.md` when delegating to `agency-*` specialist skills.
   
   ```

### In Windsurf

1. Open Windsurf Cascade chat.
2. Reference `@docs/agency-registry.md` and `@.agents/workflows/agency-pipeline.md` in your prompt, or copy `.agents/rules/inter-agent-calling.md` into `.windsurfrules` in your project root.

## 5. Quick Troubleshooting FAQ

- **`docs/agency-registry.md` says "No agents detected yet":** Open the **Agency Agents Windows App**, make sure you actually clicked **Install** next to Antigravity (or installed them to your project folder), and then run `setup-agency-antigravity.ps1` (or `.sh`) again.
- **The AI forgets what previous agents did during a big project:** Tell the AI: *"Read `docs/active-spec.md` to see the current plan and what previous agents already finished, then continue with the next uncompleted `[ ]` agent in the queue."*
- **I installed new agents in the Windows App—how do I update my project?** Just run `.\setup-agency-antigravity.ps1` (or `./setup-agency-antigravity.sh`) again. It safely updates `docs/agency-registry.md` without erasing your code. '@ $ReadmeContent \vert{} Set-Content -Path$ReadmeFile -Encoding UTF8 Write-Host "Generated $ReadmeFile (Zero-knowledge beginner's guide)" -ForegroundColor Green
Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "  1. Open 'agency-readme.md' for your step-by-step copy-paste guide."
Write-Host "  2. Indexed Agents : $($Agents.Count) (saved in docs/agency-registry.md)"
Write-Host "  3. Slash Command  : /agency-pipeline"

```

---

### Option 2: Updated Bash Script (`setup-agency-antigravity.sh`)

If you prefer running the script inside **Git Bash** or **WSL2**, here is the updated `.sh` script that also generates `agency-readme.md` alongside the registry, pipeline, and delegation rules:

```bash
#!/usr/bin/env bash
# ==============================================================================
# Agency Agents x Google Antigravity Project Bootstrapper (Bash / WSL / Git Bash)
# Generates:
#   1. docs/agency-registry.md               (Dynamic index of all installed agents)
#   2. .agents/workflows/agency-pipeline.md  (Universal multi-agent router workflow)
#   3. .agents/rules/inter-agent-calling.md  (Always-on agent-to-agent delegation rule)
#   4. agency-readme.md                      (Zero-knowledge step-by-step user guide)
# ==============================================================================

set -euo pipefail

echo "🚀 Bootstrapping Agency Agents Multi-Agent System..."

# 1. Create required project directories
mkdir -p docs .agents/workflows .agents/rules

# 2. Discover all possible Antigravity skill directories
declare -a SKILL_DIRS=()
[ -d ".agents/skills" ] && SKILL_DIRS+=(".agents/skills")
[ -d "$HOME/.gemini/antigravity/skills" ] && SKILL_DIRS+=("$HOME/.gemini/antigravity/skills")
[ -d "$HOME/.gemini/config/skills" ] && SKILL_DIRS+=("$HOME/.gemini/config/skills")

if [ -d "/mnt/c/Users" ]; then
  for win_user in /mnt/c/Users/*; do
    [ -d "$win_user/.gemini/antigravity/skills" ] && SKILL_DIRS+=("$win_user/.gemini/antigravity/skills")
    [ -d "$win_user/.gemini/config/skills" ] && SKILL_DIRS+=("$win_user/.gemini/config/skills")
    [ -d "$win_user/AppData/Roaming/antigravity/skills" ] && SKILL_DIRS+=("$win_user/AppData/Roaming/antigravity/skills")
  done
fi

# 3. Generate docs/agency-registry.md
REGISTRY_FILE="docs/agency-registry.md"
TMP_ROWS=$(mktemp)
AGENT_COUNT=0

for dir in "${SKILL_DIRS[@]}"; do
  for skill_file in "$dir"/agency-*/SKILL.md; do
    [ -f "$skill_file" ] || continue
    slug=$(basename "$(dirname "$skill_file")")
    desc=$(grep -i -m 1 '^description:' "$skill_file" 2>/dev/null | sed -E 's/^description:[[:space:]]*//I; s/^["'\'']//; s/["'\'']$//; s/\r$//' || true)
    [ -z "$desc" ] && desc="Specialized Agency Agent persona ($slug)"
    desc=$(echo "$desc" | sed 's/|/\\|/g')
    echo "| \`$slug\` | $desc | \`$skill_file\` |" >> "$TMP_ROWS"
  done
done

{
  echo "# Agency Agents Master Registry"
  echo ""
  echo "> Auto-generated index of installed \`agency-*\` skills available to Antigravity and AI IDEs."
  echo "> Any agent can summon another specialist from this table using the \`[CALL_AGENT]\` protocol."
  echo ""
  echo "| Skill Slug | Specialty & Trigger Description | Skill Path |"
  echo "| :--- | :--- | :--- |"
  if [ -s "$TMP_ROWS" ]; then
    sort -u -t '|' -k2,2 "$TMP_ROWS"
  else
    echo "| *No agents detected yet* | Install agents via the Agency Agents Windows App, then re-run \`./setup-agency-antigravity.sh\` | \`N/A\` |"
  fi
} > "$REGISTRY_FILE"

if [ -s "$TMP_ROWS" ]; then
  AGENT_COUNT=$(sort -u -t '\vert{}' -k2,2 "$TMP_ROWS" | wc -l | tr -d ' ')
fi
rm -f "$TMP_ROWS"

echo "✅ Generated $REGISTRY_FILE ($AGENT_COUNT unique agency-* skills indexed)"

# 4. Generate .agents/workflows/agency-pipeline.md
cat << 'EOF' > ".agents/workflows/agency-pipeline.md"
---
description: Dynamic multi-agent router and recursive handoff pipeline across all installed Agency Agents
---

# Universal Agency Pipeline (Dynamic Multi-Agent Router)

You are operating as the **Agency Multi-Agent Runtime**. You have access to all installed `agency-*` skills indexed in `docs/agency-registry.md`.

## Phase 1: Triage & Squad Assembly
1. Activate skill `agency-agents-orchestrator` (or `agency-project-shepherd`).
2. Read `docs/agency-registry.md` to inspect all available specialist slugs and their exact file paths.
3. Analyze the user's request (New Project, Feature, Bugfix, or Research) and select the optimal specialist squad across divisions:
   - **Product & PM:** `agency-project-shepherd`, `agency-senior-project-manager`, `agency-product-manager`, `agency-sprint-prioritizer`, `agency-trend-researcher`, `agency-feedback-synthesizer`
   - **Design & UX:** `agency-ux-architect`, `agency-ui-designer`, `agency-ux-researcher`, `agency-brand-guardian`, `agency-ui-finish-gate-reviewer`, `agency-whimsy-injector`
   - **Engineering & Architecture:** `agency-codebase-onboarding-engineer`, `agency-backend-architect`, `agency-frontend-developer`, `agency-database-optimizer`, `agency-ai-engineer`, `agency-devops-automator`, `agency-security-engineer`, `agency-autonomous-optimization-architect`, `agency-rapid-prototyper`, `agency-senior-developer`, `agency-technical-writer`
   - **Specialized & MCP:** `agency-workflow-architect`, `agency-mcp-builder`, `agency-zk-steward`, `agency-identity-graph-operator`
   - **Testing & Quality Gates:** `agency-code-reviewer`, `agency-api-tester`, `agency-performance-benchmarker`, `agency-evidence-collector`, `agency-reality-checker`
   - **Domain Specialists:** Select any other matching `agency-*` slug listed in `docs/agency-registry.md`.
4. Create or update `docs/active-spec.md` with:
   - Scope & Technical Architecture Contract
   - Ordered Agent Execution Queue (`[ ] agency-<slug> — Deliverable`)
   - Section `## Sub-Agent Consultations` for dynamic handoffs

## Phase 2: Sequential & On-Demand Agent Execution Loop
For each assigned agent in the `docs/active-spec.md` queue:
1. **Load Persona:** Open the agent's `SKILL.md` path listed in `docs/agency-registry.md` and strictly adopt its **Identity**, **Critical Rules**, and **Technical Deliverables**.
2. **Execute Deliverable:** Perform the scoped work using `docs/active-spec.md` as the shared source of truth, then mark the agent `[x]` in `docs/active-spec.md`.
3. **Evaluate Dynamic Handoff (`[CALL_AGENT]`):**
   - If the active agent hits a sub-problem outside its core specialty, it MUST emit:
     `[CALL_AGENT: agency-<target-slug> | REASON: <why> | TASK: <specific sub-task> | RETURN_TO: agency-<current-slug>]`
   - Immediately pause the current agent, read the target agent's `SKILL.md` from `docs/agency-registry.md`, execute the sub-task, log the result under `## Sub-Agent Consultations` in `docs/active-spec.md`, and resume `RETURN_TO`.

## Phase 3: Adversarial Verification Gate
1. Once all queued and dynamically called agents finish, activate `agency-code-reviewer` and `agency-reality-checker`.
2. Audit all modified files and outputs against `docs/active-spec.md` and run verification checks.
3. If `agency-reality-checker` identifies any defects or missing edge cases, automatically trigger `[CALL_AGENT: agency-<responsible-specialist>]` to remediate before closing the task.
EOF

echo "✅ Generated .agents/workflows/agency-pipeline.md"

# 5. Generate .agents/rules/inter-agent-calling.md
cat << 'EOF' > ".agents/rules/inter-agent-calling.md"
---
trigger: always_on
description: Enables any active agency-* skill to dynamically summon and delegate sub-tasks to other installed agency-* skills
---

# Inter-Agent Calling & Delegation Protocol

Whenever you are operating under an `agency-*` skill (or handling a complex engineering/research task) and encounter a sub-problem that falls into another specialist's domain:

1. **Lookup Specialist:** Check `docs/agency-registry.md` to find the best-suited `agency-<role-slug>` and its `SKILL.md` path.
2. **Announce Delegation:** Output the delegation banner:
   > 🔄 **`[CALL_AGENT: agency-<target-slug>]`** — *Delegating sub-task: [brief description]*
3. **Load & Execute:** Read the target agent's `SKILL.md` file, adopt its persona constraints and quality checklist, and complete the sub-task.
4. **Return Control:** If called from an active parent agent, output:
   > ↩️ **`[RETURN_TO: agency-<parent-slug>]`** — *Sub-task complete, resuming primary workflow*
   and continue the parent agent's task using the specialist's output.
EOF

echo "✅ Generated .agents/rules/inter-agent-calling.md"

# 6. Generate agency-readme.md
cat << 'EOF' > "agency-readme.md"
# Complete Beginner's Guide to Agency Agents

Welcome! This guide explains—step by step, assuming **zero prior knowledge**—how to use your 282 AI specialist agents in **Google Antigravity** (and other AI coding tools like **Cursor**, **Claude Code**, and **Windsurf**).

---

## 1. What Did We Just Set Up? (The Simple Explanation)

Think of your normal AI chat as **one general worker** who tries to do everything (design, coding, testing, marketing) all at once, often cutting corners.

With **Agency Agents**, you now have a **virtual company of 282 specialized experts** installed on your computer:
* **`agency-agents-orchestrator` / `agency-project-shepherd`**: The Boss / Project Manager who plans the work and hires the right experts.
* **`agency-backend-architect`**: The Senior Server & Database Engineer.
* **`agency-frontend-developer`**: The User Interface & Web Designer.
* **`agency-trend-researcher`**: The Market & Technology Researcher.
* **`agency-reality-checker`**: The strict Quality Assurance Inspector who tests everything and refuses to let broken work pass.

### How the Files in Your Project Work Together:
1. **`docs/agency-registry.md` (The Company Directory):** A complete list of every agent installed on your computer, what they are good at, and where their instructions live.
2. **`.agents/workflows/agency-pipeline.md` (The `/agency-pipeline` Button):** A master playbook that tells the AI how to assemble a team, write a plan in `docs/active-spec.md`, and run multiple agents in order.
3. **`.agents/rules/inter-agent-calling.md` (The Walkie-Talkie Rule):** Allows any agent who gets stuck to automatically call another specialist agent for help (`[CALL_AGENT]`) and then return to their job.

---

## 2. Step-by-Step: First-Time Setup (Do This Once)

### Step 1: Install the Agents Using the Windows App
1. Open the **Agency Agents** desktop app on Windows.
2. Click **Tools** on the left sidebar and make sure **Antigravity** (or Cursor/Claude Code) is detected.
3. To install all agents at once, browse the divisions or **Teams** tab, select the agents you want, choose **Global** (available in all projects) or **Project** (only this folder), and click **Install / Deploy**.

### Step 2: Run the Generator Script in Your Project Folder
Whenever you start a new project folder, run the setup script in that folder so the AI knows where your agents are:
* **On Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\setup-agency-antigravity.ps1

```

- **On WSL / Git Bash / Linux / Mac:**
  ```bash
  chmod +x setup-agency-antigravity.sh
  ./setup-agency-antigravity.sh
  
  ```
- **How to know it worked:** Open `docs/agency-registry.md` and verify you see a table listing your `agency-*` agents.

## 3. How to Use It in Google Antigravity (Copy-Paste Prompts)
Open your project folder inside **Google Antigravity** and open the AI Agent chat panel. Below are the exact copy-paste prompts for every situation.

### Scenario A: Build a Whole New Project from Scratch (Using the Orchestrator)
When starting from zero, you don't need to pick which agents to use. Let the **Orchestrator** pick the team, write the blueprint, and build it step by step.
**Step 1:** Click into the Antigravity chat box.**Step 2:** Copy and paste this exact prompt (replace the bracketed text with your idea):

```plaintext
/agency-pipeline
I want to build a new project from scratch: [Describe your app idea in plain English, e.g., a web dashboard that tracks factory machine temperatures and sends alerts].

1. Start as `agency-agents-orchestrator` and read `docs/agency-registry.md`.
2. Pick the best agents for Product Planning, Architecture, Frontend, Backend, and QA.
3. Write the full project blueprint and agent checklist into `docs/active-spec.md`.
4. Pause and show me the plan in `docs/active-spec.md` before writing code, or proceed phase by phase.

```
**Step 3:** Once the Orchestrator writes `docs/active-spec.md`, reply:

```plaintext
Approved. Execute Phase 2 of /agency-pipeline and let each specialist agent build their part. Remember that agents can use [CALL_AGENT] if they need help from another specialist.

```

### Scenario B: Add a New Feature to an Existing Project
When you already have code and want to add a new feature safely without breaking existing files:
**Copy and paste this prompt:**

```plaintext
/agency-pipeline
I want to add a new feature to this project: [Describe the feature, e.g., Add a PDF export button to the reports page that includes charts and summary tables].

First, use `agency-codebase-onboarding-engineer` to inspect how our current project is structured. Then have `agency-project-shepherd` write the implementation steps into `docs/active-spec.md`, and run the required engineering and QA agents to build and test it.

```

### Scenario C: Do Deep Research, Architecture Planning, or Market Analysis (No Code Changes)
Sometimes you don't want the AI to touch your code yet—you want it to research a technology, compare libraries, audit security, or study competitors.
**Copy and paste this prompt:**

```plaintext
Use `agency-agents-orchestrator` and read `docs/agency-registry.md`.
I need a deep research and feasibility report on: [Describe topic, e.g., The best real-time time-series database and architecture for storing 10,000 sensor readings per second].

Summon the appropriate research and architecture agents (such as `agency-trend-researcher`, `agency-backend-architect`, and `agency-database-optimizer`). Do NOT modify any application code. Write a comprehensive research report with pros, cons, and recommendations to `docs/research-report.md`.

```

### Scenario D: Call a Single Specialist Agent Directly
When you have a small, specific task (like fixing a slow database query, polishing a button's design, or reviewing code for bugs), you don't need the whole team—just call **one** agent by name.
**How to find the agent's name:** Open `docs/agency-registry.md` and press `Ctrl+F` to search for a keyword (like `database`, `security`, `frontend`, `ui`, `devops`).
**Copy-paste examples for calling a single agent:**

- **To build or fix a UI screen:**
  ```plaintext
  Activate `agency-frontend-developer`. Redesign the settings page component so it is mobile-friendly, accessible, and has clean loading states.
  
  ```
- **To design an API or backend service:**
  ```plaintext
  Activate `agency-backend-architect`. Design the REST API endpoints and database schema for user role permissions.
  
  ```
- **To speed up slow database queries:**
  ```plaintext
  Activate `agency-database-optimizer`. Inspect our database queries and add the proper indexes to make the dashboard load faster.
  
  ```
- **To audit your code for bugs and fake placeholders before releasing:**
  ```plaintext
  Activate `agency-reality-checker`. Review all files we changed today, check for edge cases or unfinished TODOs, and run the tests.
  
  ```

### Scenario E: How Agents Call Other Agents Automatically (`[CALL_AGENT]`)
Because `.agents/rules/inter-agent-calling.md` is active in your project, **you don't have to babysit single agents.**
For example, if you ask `agency-frontend-developer` to build a login form, and it realizes the backend password-check route is missing a security token, it will automatically output:

> 🔄 **`[CALL_AGENT: agency-security-engineer]`** — *Delegating sub-task: Verify JWT token cookie security settings*
It will read the Security Engineer's `SKILL.md` file, solve the security issue, and then switch right back to `agency-frontend-developer` to finish your login form.
You can also explicitly remind any agent in chat:

> *"Start with `agency-frontend-developer`, and feel free to call any other agent from `docs/agency-registry.md` if you need backend or database changes."*

## 4. How to Use This Setup in Other Programs (Cursor, Claude Code, Windsurf)
Even though `.agents/workflows/` and `.agents/rules/` are built natively for **Google Antigravity**, the exact same files work in **Cursor**, **Claude Code**, **Windsurf**, and **GitHub Copilot**! Here is how to trigger them in those tools:

### In Cursor IDE

1. Open Cursor Chat (`Ctrl+L` or `Ctrl+I` for Composer/Agent mode).
2. Type `@` and reference the workflow and rule files directly:
   ```plaintext
   Follow the instructions in @.agents/workflows/agency-pipeline.md and @.agents/rules/inter-agent-calling.md using the agent list in @docs/agency-registry.md.
   Task: [Describe your project, feature, or research task]
   
   ```
3. *(Optional Shortcut)* Copy `.agents/rules/inter-agent-calling.md` into `.cursor/rules/inter-agent-calling.mdc` so Cursor loads it automatically on every chat.

### In Claude Code (CLI)

1. In your terminal, start `claude`.
2. Tell Claude to read your pipeline file:
   ```plaintext
   Read .agents/workflows/agency-pipeline.md, .agents/rules/inter-agent-calling.md, and docs/agency-registry.md, then run the pipeline for: [Your task]
   
   ```
3. *(Optional Shortcut)* Add this single line to your project's `CLAUDE.md` file so Claude Code always knows about your 282 agents:
   ```markdown
   Always follow `.agents/rules/inter-agent-calling.md` and consult `docs/agency-registry.md` when delegating to `agency-*` specialist skills.
   
   ```

### In Windsurf

1. Open Windsurf Cascade chat.
2. Reference `@docs/agency-registry.md` and `@.agents/workflows/agency-pipeline.md` in your prompt, or copy `.agents/rules/inter-agent-calling.md` into `.windsurfrules` in your project root.

## 5. Quick Troubleshooting FAQ

- **`docs/agency-registry.md` says "No agents detected yet":** Open the **Agency Agents Windows App**, make sure you actually clicked **Install** next to Antigravity (or installed them to your project folder), and then run `setup-agency-antigravity.ps1` (or `.sh`) again.
- **The AI forgets what previous agents did during a big project:** Tell the AI: *"Read `docs/active-spec.md` to see the current plan and what previous agents already finished, then continue with the next uncompleted `[ ]` agent in the queue."*
- **I installed new agents in the Windows App—how do I update my project?** Just run `.\setup-agency-antigravity.ps1` (or `./setup-agency-antigravity.sh`) again. It safely updates `docs/agency-registry.md` without erasing your code. EOF
echo "✅ Generated agency-readme.md (Zero-knowledge beginner's guide)"
echo ""
echo "🎉 Setup Complete!"
echo "   • Read Guide     : agency-readme.md"
echo "   • Indexed Agents : $AGENT_COUNT (saved in docs/agency-registry.md)"
echo "   • Slash Command  : /agency-pipeline"

```

<FollowUp label="Want me to add pre-configured slash commands for specific workflows like /agency-research or /agency-bugfix?" query="Add dedicated workflow files for /agency-research, /agency-feature, and /agency-bugfix to the generator script so I can trigger them with one word."/>

```

---

*Exported from [Voyager](https://github.com/voyager-crew/voyager)*  
*Generated on October 22, 2026 at 11:12 AM*