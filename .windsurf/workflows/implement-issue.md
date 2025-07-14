---
description: Step-by-step workflow for implementing a GitHub issue with sub-tasks
---

# Implement a GitHub Issue Workflow

This workflow guides you through implementing a GitHub issue with one or more checklist tasks. It ensures you work sequentially, confirm with the user after each task, and commit all changes at the end. This workflow interacts with Github via the Github MCP.

## Steps

1. **Check for Dependencies**
   - If there is a number following the slash command (example: /implement-issue [number]) use that for the Github Issue number. 
   - If no number is provided, prompt the users for the issue number.
   - Review the issue description for any "Depends on #X" or similar dependency notes.
   - Also scan all comments for any "Depends on #X" or similar dependency notes.
   - If dependencies exist, verify that each referenced issue is closed before proceeding.
   - If any dependencies are open, pause the workflow and notify the user.
   - If no dependencies are found, output a message saying "no dependencies found" and proceed to step 2.

2. **Review the Issue**
   - Read the issue description and checklist.
   - Summarize the overall goal and each sub-task.
   - Get the issue prefix from the issue (the word(s) before the first : in the title)

3. **Work on One Task at a Time**
   - Select the first incomplete checklist item.
   - Implement the code or documentation changes required for that task.
   - Run tests or validations as appropriate.
   - If tests or validations fail, fix and re-run the tests/validations until they succeed.

4. **Confirm Completion and Prompt User**
   - Inform the user that the current task is complete.
   - Ask if they want to commit and proceed to the next task or pause.
   - If the user agrees, 
     - **Stage all modified files** (example: `git add .`).
     - **Commit the changes** with a clear message using the example below. (example: `git commit -m 'message'`)
     - **Push the commit** to the remote repository (example: `git push`).

5. **Repeat for All Tasks**
   - Continue steps 3-4 for each remaining checklist item.

6. **Confirm Completion and Close Issue**
   - Check with the user to confirm the changes are complete.
   - If the user disagrees:  stop the workflow.
   - If the user confirms:
     - Check for unstaged changes (example: `git diff --name-only`)
     - If there are changes: Stage all modified files (example: `git add .`) and commit with a clear message using the example below. (example: `git commit -m 'message'`)
     - Ask if user want's to create a Pull request.
     - If they agree, create a Pull Request for this issue with an appropriate sommary and the tasks completed in the description.  make sure that `Closes #[issue number]` is at the bottom of the PR description.  Then close the issue in Github.
     - If they disagree, close the issue in Github.

---

## Example Commit Message

```
Implement [ISSUE PREFIX (#ISSUE_NUMBER)]: [summary]
...
```

---

## Notes
- Always confirm with the user before moving to the next task.
- If you encounter blockers, notify the user and pause the workflow.
- task-master should not be used in any way.