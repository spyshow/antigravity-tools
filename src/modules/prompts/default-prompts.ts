import { PromptItem } from './types.js';

export const DEFAULT_PROMPTS: PromptItem[] = [
  {
    id: 'code-review-senior',
    title: 'Senior Engineer Code Review',
    description: 'Thorough, actionable review of changes focusing on correctness, edge cases, performance, and maintainability.',
    category: 'Review',
    tags: ['review', 'quality', 'senior-eng', 'security'],
    template: `You are a Principal Software Engineer performing a rigorous code review.

Focus Areas:
1. Correctness: Edge cases, null checks, race conditions, type safety.
2. Architecture & Design: Cohesion, coupling, SOLID principles, idiomatic {{language:TypeScript}}.
3. Performance: Big-O complexity, unnecessary allocations, expensive operations in loops.
4. Security: Input validation, sanitization, secrets handling.

Review Target / Diff:
{{target_code:Please review the current git diff or files}}

Please format your review with:
- Summary of changes
- Critical issues (must fix before merge)
- Suggestions & improvements (optional)
- Positive aspects of the design`,
    variables: [
      { name: 'language', description: 'Programming language being reviewed', defaultValue: 'TypeScript', required: false },
      { name: 'target_code', description: 'Code snippet, file path, or PR description to review', defaultValue: 'the latest git diff', required: false }
    ],
    favorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    usageCount: 0
  },
  {
    id: 'systematic-debugging',
    title: 'Systematic Root-Cause Debugger',
    description: 'Disciplined 4-phase debugging workflow for tricky bugs, test failures, or crashes.',
    category: 'Debugging',
    tags: ['debug', 'bugfix', 'troubleshooting', 'root-cause'],
    template: `I need to diagnose and fix a bug with the following details:

Error / Symptom:
{{error_message:Unexpected error or failure}}

Context / Environment:
{{environment:Local development environment}}

Observed Behavior:
{{observed_behavior:What actually happened}}

Expected Behavior:
{{expected_behavior:What should have happened}}

Relevant Code / Files:
{{relevant_files:Check recent modified files}}

Please follow this systematic process:
1. Root-cause hypothesis: Formulate testable hypotheses based on the symptoms and call stack.
2. Verification: Identify what logs, breakpoints, or checks are needed to confirm the root cause.
3. Minimal fix: Propose the cleanest, least invasive fix that prevents regression.
4. Regression test: Provide a test case that reproduces the failure and verifies the fix.`,
    variables: [
      { name: 'error_message', description: 'Error message or stack trace', defaultValue: '', required: true },
      { name: 'environment', description: 'Runtime or environment details', defaultValue: 'Local dev environment', required: false },
      { name: 'observed_behavior', description: 'What actually happens', defaultValue: '', required: false },
      { name: 'expected_behavior', description: 'What was supposed to happen', defaultValue: '', required: false },
      { name: 'relevant_files', description: 'File paths or components involved', defaultValue: '', required: false }
    ],
    favorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    usageCount: 0
  },
  {
    id: 'tdd-feature-implement',
    title: 'TDD Feature Implementation',
    description: 'Implement a new feature or module using strict Test-Driven Development (Red-Green-Refactor).',
    category: 'Development',
    tags: ['tdd', 'testing', 'implementation', 'feature'],
    template: `We are going to implement the following feature using strict Test-Driven Development (TDD):

Feature Name: {{feature_name}}
Framework / Test Runner: {{test_runner:npm test}}
Requirements / User Stories:
{{requirements}}

Protocol:
1. RED: Write the failing unit tests covering happy paths and edge cases first.
2. GREEN: Implement only the minimal code necessary to make the tests pass.
3. REFACTOR: Clean up the implementation without breaking test suite.
4. Verify: Run the test suite and confirm 100% pass rate.`,
    variables: [
      { name: 'feature_name', description: 'Name or description of feature', defaultValue: '', required: true },
      { name: 'test_runner', description: 'Testing tool or command', defaultValue: 'npm test', required: false },
      { name: 'requirements', description: 'Bullet list of acceptance criteria', defaultValue: '', required: true }
    ],
    favorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    usageCount: 0
  },
  {
    id: 'clean-refactoring',
    title: 'Clean Code Refactoring',
    description: 'Refactor complex or legacy code for readability, testability, and cohesion without breaking functionality.',
    category: 'Refactoring',
    tags: ['refactoring', 'clean-code', 'maintainability'],
    template: `Please refactor the following {{language:code}} component:

Target File / Component: {{target_component}}
Current Pain Points: {{pain_points:High complexity, poor testability, tight coupling}}

Refactoring Objectives:
1. Extract cohesive helper functions / single-responsibility classes.
2. Simplify branching logic and eliminate duplicate code.
3. Improve naming and type safety.
4. Ensure zero behavior regressions.`,
    variables: [
      { name: 'language', description: 'Programming language', defaultValue: 'TypeScript', required: false },
      { name: 'target_component', description: 'Component or function name', defaultValue: '', required: true },
      { name: 'pain_points', description: 'Why this needs refactoring', defaultValue: 'High complexity and tight coupling', required: false }
    ],
    favorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    usageCount: 0
  },
  {
    id: 'architecture-rfc',
    title: 'Architecture RFC / Design Doc',
    description: 'Draft a comprehensive Request for Comments (RFC) or Technical Design Document for a system or subsystem.',
    category: 'Architecture',
    tags: ['architecture', 'design-doc', 'rfc', 'system-design'],
    template: `Draft an Architecture RFC / Design Document for: {{system_name}}

Context & Problem Statement:
{{problem_statement}}

Constraints & Non-functional Requirements:
{{constraints:Scale, latency, security, timeline}}

Please structure the RFC as follows:
1. Executive Summary & Problem Definition
2. Goals & Non-Goals
3. Proposed Architecture & System Diagram (Mermaid)
4. Key Components, Data Flow & APIs
5. Alternatives Considered & Trade-offs
6. Migration / Rollout Strategy & Rollback Plan`,
    variables: [
      { name: 'system_name', description: 'Name of system or feature', defaultValue: '', required: true },
      { name: 'problem_statement', description: 'What problem does this solve?', defaultValue: '', required: true },
      { name: 'constraints', description: 'Constraints, SLA, or technical requirements', defaultValue: 'High availability and low latency', required: false }
    ],
    favorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    usageCount: 0
  }
];
