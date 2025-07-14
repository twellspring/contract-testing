---
description: Convert PRD to Github Issues
---

# PRD to GitHub Issues Workflow

This workflow guides you through turning a Product Requirements Document (PRD) into actionable GitHub issues, each with sub-tasks and dependencies. This workflow interacts with Github via the Github MCP.

---

## Step 1: Review the PRD

- [ ] If there is text following the slash command (example: /prd-to-github-issues [string] [string]) use the first string as that text as the PRD name and the second as the prefix.
- [ ] If there is no text following the slash command, ask the user for the PRD name and prefix.
- [ ] Open the PRD file (e.g., `docs/columnar.prd`) and identify major features, user stories, and requirements.

---

## Step 2: Extract Tasks

- [ ] For each major feature or user story, write a task summary (1-2 sentences) and a task abbreviation (3-8 words).
- [ ] For each task, list sub-tasks as a checklist.
- [ ] Determine task dependencies.

---

## Step 3: Create GitHub Issues

For each task:
- [ ] Create a GitHub issue
- [ ] For the title use a prefix (example: [prefix] [task abbreviation] )
- [ ] In the description, put the task summary followed by the sub-tasks as a markdown checklist with the heading "Tasks".
- [ ] If this task depends on another task, Add `Depends on #<issue-number>` to the bottom of the description.

---
