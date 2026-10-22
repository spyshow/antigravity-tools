---
name: ideation
description: "Discover code-revealed feature ideas, performance bottlenecks, security vulnerabilities, and code quality technical debt (inspired by Aperant)."
---

# Codebase Ideation & Audit Skill

Autonomous static analysis, code-revealed feature discovery, performance optimization profiling, security vulnerability audits, and technical debt mapping (inspired by Aperant's 4-pillar ideation system).

## When to Use This Skill
- The user asks to "ideate", "audit the codebase", or "discover improvements" for their project.
- The user asks for performance bottleneck analysis, bundle size improvements, or I/O efficiency recommendations.
- The user requests security vulnerability scans, hardcoded credential detection, input validation, or OWASP/CWE checks.
- The user wants code quality assessments (large files, duplication, missing tests, anti-patterns).
- The user wants to promote an audit finding directly into their strategic MoSCoW Roadmap or export an `IDEATION.md` report.

## Available MCP Tools

1. `ideation_analyze`: Run deep static analysis on the codebase, evaluating patterns, dependencies, file sizes, and security risks.
   - Example: `ideation_analyze(workspacePath=".")`

2. `ideation_get`: Retrieve current active ideation report with health scores across Security, Performance, Code Quality, and Innovation.
   - Example: `ideation_get()`

3. `ideation_promote_to_roadmap`: Directly promote any ideation item (e.g. `ci-001`, `perf-001`, `sec-001`, `cq-001`) into the active MoSCoW Roadmap as an actionable feature ticket with acceptance criteria!
   - Example: `ideation_promote_to_roadmap(ideaId="ci-001")`

4. `ideation_export_markdown`: Export the full ideation findings and health score matrix to `IDEATION.md` in the workspace root.
   - Example: `ideation_export_markdown()`

## The 4 Ideation Pillars (Aperant Model)
1. **🚀 Code-Revealed Feature Discoveries (`ci-xxx`)**: Features naturally enabled by existing architecture and patterns.
2. **⚡ Performance Optimizations (`perf-xxx`)**: Synchronous I/O elimination, LRU caching, and asset compression.
3. **🛡️ Security Hardening (`sec-xxx`)**: Path traversal checks, CORS restrictions, and credential redaction.
4. **🧹 Code Quality & Refactoring (`cq-xxx`)**: Monolithic script splitting, test coverage expansion, and typed error hierarchies.
