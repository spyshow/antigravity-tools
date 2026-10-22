---
name: ai-roadmap
description: "AI-assisted project discovery, competitor intelligence benchmarking, and phased MoSCoW roadmap generation modeled after Aperant."
---

# AI Roadmap & Competitor Planner Skill

Autonomous codebase introspection, competitor user pain point benchmarking, and strategic MoSCoW roadmap generation (inspired by Aperant's autonomous architecture).

## When to Use This Skill
- The user asks to analyze the current codebase/project to understand its stack, personas, or vision.
- The user wants competitor analysis, market gap discovery, or user complaint extraction (e.g., from Reddit, GitHub, forums).
- The user asks to generate a feature roadmap, prioritize tasks with MoSCoW (Must, Should, Could, Won't Have), or export a `ROADMAP.md` file.
- The user wants to check progress or update feature completion status.

## Available MCP Tools

1. `roadmap_analyze_project`: Deep AST & repo introspection detecting project type, primary language, frameworks, target audience personas, value proposition, and technical gaps.
   - Example: `roadmap_analyze_project(workspacePath=".")`

2. `roadmap_analyze_competitors`: Benchmark direct & indirect competitors, extracting real user pain points (with severity and source), market gaps, and differentiation angles.
   - Example: `roadmap_analyze_competitors()`

3. `roadmap_generate`: Synthesize discovery + competitor insights into a 3-phase strategic roadmap with MoSCoW prioritization, acceptance criteria, user stories, and linked `competitor_insight_ids`.
   - Example: `roadmap_generate(saveToWorkspace=true)`

4. `roadmap_get`: Retrieve current active roadmap, phases, features, and progress.
   - Example: `roadmap_get()`

5. `roadmap_update_feature`: Update progress status of a feature (`idea`, `planned`, `in_progress`, `completed`).
   - Example: `roadmap_update_feature(featureId="FEAT-01", status="completed")`

6. `roadmap_export_markdown`: Export the full strategic roadmap to a publication-ready `ROADMAP.md` in the workspace root.
   - Example: `roadmap_export_markdown()`

## Architecture & Schema Alignment (Aperant Model)
- **Phase 1: Foundation & Core Experience**: Critical MVP infrastructure and core workflow.
- **Phase 2: Competitor Differentiation & Workflow Power**: Features addressing major competitor flaws (`CP-01`, `CP-02`, etc.) and market gaps (`GAP-01`, etc.).
- **Phase 3: Scale, Ecosystem & Autonomous Intelligence**: Advanced integrations and ecosystem scale.
- **MoSCoW Prioritization**: Every feature is classified into `must`, `should`, `could`, or `wont`, complete with testable acceptance criteria and user stories.
