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
2. Click **Tools** on the left sidebar and make sure **Antigravity** is detected.
3. Browse the divisions or **Teams** tab, select the agents you want, choose **Global** or **Project**, and click **Install / Deploy**.

### Step 2: Integrate via Antigravity Tools
1. Open Antigravity and open the **Antigravity Tools** sidecar aux pane (or web dashboard).
2. Switch to the **🤖 Agency Agents** tab.
3. Click **⚡ Integrate Agency Agents**.
   - It will automatically index all installed agents into `docs/agency-registry.md`.
   - It will create the `/agency-pipeline` workflow and inter-agent calling rules.
   - It will add pre-configured Agency prompts to your **Prompt Library**!

---

## 3. How to Use It in Google Antigravity (Copy-Paste Prompts)
Open your project folder inside **Google Antigravity** and open the AI Agent chat panel. Below are the exact copy-paste prompts for every situation.

### Scenario A: Build a Whole New Project from Scratch (Using the Orchestrator)
When starting from zero, you don't need to pick which agents to use. Let the **Orchestrator** pick the team, write the blueprint, and build it step by step.

**Step 1:** Click into the Antigravity chat box.
**Step 2:** Copy and paste this exact prompt (replace the bracketed text with your idea):

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

---

### Scenario B: Add a New Feature to an Existing Project
When you already have code and want to add a new feature safely without breaking existing files:

**Copy and paste this prompt:**

```plaintext
/agency-pipeline
I want to add a new feature to this project: [Describe the feature, e.g., Add a PDF export button to the reports page that includes charts and summary tables].

First, use `agency-codebase-onboarding-engineer` to inspect how our current project is structured. Then have `agency-project-shepherd` write the implementation steps into `docs/active-spec.md`, and run the required engineering and QA agents to build and test it.
```

---

### Scenario C: Do Deep Research, Architecture Planning, or Market Analysis (No Code Changes)
Sometimes you don't want the AI to touch your code yet—you want it to research a technology, compare libraries, audit security, or study competitors.

**Copy and paste this prompt:**

```plaintext
Use `agency-agents-orchestrator` and read `docs/agency-registry.md`.
I need a deep research and feasibility report on: [Describe topic, e.g., The best real-time time-series database and architecture for storing 10,000 sensor readings per second].

Summon the appropriate research and architecture agents (such as `agency-trend-researcher`, `agency-backend-architect`, and `agency-database-optimizer`). Do NOT modify any application code. Write a comprehensive research report with pros, cons, and recommendations to `docs/research-report.md`.
```

---

### Scenario D: Call a Single Specialist Agent Directly
When you have a small, specific task (like fixing a slow database query, polishing a button's design, or reviewing code for bugs), you don't need the whole team—just call **one** agent by name.

**How to find the agent's name:** Open `docs/agency-registry.md` and press `Ctrl+F` to search for a keyword (like `database`, `security`, `frontend`, `ui`, `devops`).

**Copy-paste examples:**

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

---

### Scenario E: How Agents Call Other Agents Automatically (`[CALL_AGENT]`)
Because `.agents/rules/inter-agent-calling.md` is active in your project, **you don't have to babysit single agents.**

For example, if you ask `agency-frontend-developer` to build a login form, and it realizes the backend password-check route is missing a security token, it will automatically output:

> 🔄 **`[CALL_AGENT: agency-security-engineer]`** — *Delegating sub-task: Verify JWT token cookie security settings*

It will read the Security Engineer's `SKILL.md` file, solve the security issue, and then switch right back to `agency-frontend-developer` to finish your login form.

---

## 4. How to Use This Setup in Other Programs (Cursor, Claude Code, Windsurf)

Even though `.agents/workflows/` and `.agents/rules/` are built natively for **Google Antigravity**, the exact same files work in **Cursor**, **Claude Code**, and **Windsurf**!

### In Cursor IDE
1. Open Cursor Chat (`Ctrl+L` or `Ctrl+I` for Composer/Agent mode).
2. Type `@` and reference the workflow and rule files directly:
   ```plaintext
   Follow the instructions in @.agents/workflows/agency-pipeline.md and @.agents/rules/inter-agent-calling.md using the agent list in @docs/agency-registry.md.
   Task: [Describe your project, feature, or research task]
   ```

### In Claude Code (CLI)
1. In your terminal, start `claude`.
2. Tell Claude:
   ```plaintext
   Read .agents/workflows/agency-pipeline.md, .agents/rules/inter-agent-calling.md, and docs/agency-registry.md, then run the pipeline for: [Your task]
   ```

### In Windsurf
1. Open Windsurf Cascade chat.
2. Reference `@docs/agency-registry.md` and `@.agents/workflows/agency-pipeline.md` in your prompt.
