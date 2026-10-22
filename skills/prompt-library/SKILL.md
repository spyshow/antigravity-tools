---
name: prompt-library
description: "Save, search, interpolate, and paste reusable developer prompts with variables directly from the Antigravity prompt library to the clipboard."
---

# Prompt Library Skill

Manage, search, and paste high-quality developer prompts from your local Antigravity prompt library.

## When to Use This Skill
- The user asks to save a prompt or create a reusable template.
- The user asks to "paste" or use a prompt from their library (e.g., Code Review, Debugging, TDD, RFC, Refactoring).
- The user wants to search, list, or inspect prompts in their library.
- The user wants to launch the interactive Prompt Library Dashboard UI.

## Available Tools

The prompt library provides the following MCP tools:

1. `prompt_list`: List available prompts with optional filters:
   - `category`: Filter by category (e.g. `Review`, `Debugging`, `Development`, `Architecture`, `Refactoring`)
   - `tag`: Filter by tag (e.g. `tdd`, `security`)
   - `search`: Keyword search
   - `favoriteOnly`: Only bookmarked prompts

2. `prompt_get`: Retrieve full prompt text and variable declarations by ID or title.

3. `prompt_search`: Search prompt titles, descriptions, and content.

4. `prompt_render`: Render template variables into the prompt text without copying to clipboard.
   - Example: `prompt_render(idOrTitle="systematic-debugging", variables={"error_message": "NullPointerException at line 42"})`

5. `prompt_paste`: Render the template with variables and copy directly to the system clipboard!
   - Example: `prompt_paste(idOrTitle="code-review-senior", variables={"language": "TypeScript", "target_code": "src/auth.ts"})`
   - Notifies the user that the prompt is copied to clipboard, ready to paste with `Ctrl+V`.

6. `prompt_save`: Save a new prompt or update an existing one:
   - Required: `title`, `template`
   - Optional: `category`, `tags`, `description`, `favorite`
   - Note: Variables like `{{var_name}}` or `{{var_name:defaultValue}}` in the template are detected and registered automatically.

7. `prompt_delete`: Remove a prompt by ID.

8. `prompt_categories`: Get all category and tag counts.

## Template Variables Format
- `{{name}}`: Simple required variable.
- `{{name:default_value}}`: Variable with fallback default value if left blank.

## Interactive Web Dashboard
Users can launch the full visual dashboard at any time by running:
\`\`\`bash
agy-tools ui
# or
npm run ui
\`\`\`
This opens a local browser interface for 1-click copying, variable editing, search, and tag filtering.
