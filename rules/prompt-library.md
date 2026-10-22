# Antigravity Prompt Library Guidelines

When interacting with prompts and task execution in Antigravity:

1. **Leverage the Library**: Before drafting complex review, debugging, or architecture workflows from scratch, check if a suitable template exists in the prompt library using `prompt_list` or `prompt_search`.
2. **Proactive Savings**: When the user refines a valuable custom instruction or prompt workflow, offer to save it into their library using `prompt_save` so they can reuse it anytime with `prompt_paste`.
3. **Variable Filling**: When using `prompt_paste`, ensure all required template variables (`{{variable}}`) are populated appropriately from conversation context or explicitly requested from the user.
