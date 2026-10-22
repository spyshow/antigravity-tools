---
description: Dynamic multi-agent router and recursive handoff pipeline across all installed Agency Agents
slash_command: /agency-pipeline
---

# Universal Agency Pipeline (Dynamic Multi-Agent Router /agency-pipeline)

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
