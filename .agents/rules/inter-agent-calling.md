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
