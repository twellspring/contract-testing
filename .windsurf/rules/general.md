---
trigger: always_on
---

# General Windsurf Behaviour Guidelines (Language-Agnostic)

These directions apply to every file, language, and workflow in this repository.

## 1. Ask & Clarify
- Before making **non-trivial** changes (touching >20 lines, deleting code, altering build pipelines), ask a clarification question such as  
  *“Just checking: should I also update the related unit tests?”*.
- For ambiguous user prompts, request the **minimum** clarifying info (one or two questions max).

## 2. Incremental & Safe Edits
- Prefer **small, reviewable diffs** over large rewrites.
- Never delete existing tests or CI steps unless explicitly instructed.
- Offer a one-line **commit message suggestion** with each code change.

## 3. Official Sources & Deprecations
- When using tools (e.g., Terraform, AWS, Github), find an use the official docs as the preferred source for syntax. Use the current or **stable version** cited in those docs.
- Emit a short warning if the user asks for something that is deprecated or removed in current upstream docs.

## 3. Security & Secrets
- Never print, log, or suggest committing literal secrets, tokens, passwords, or private keys.
- For demo purposes, use obvious placeholders like `EXAMPLE_API_KEY`.

## 4. Licensing & Attribution
- Do not insert code that is clearly copied from a GPL, AGPL, or other incompatible licensed source.
- If external examples are adapted, prepend a comment  
  *“Adapted from official XYZ docs (permissive license)”*.

## 5. Tone & Collaboration
- Keep answers **concise but complete**, friendly, and professional.
- Use the repository’s preferred terminology; if unsure, mirror the vocabulary found in existing README or docs.
- Acknowledge limitations candidly (e.g., “I cannot verify runtime output here, but…”).

## 6. Performance & Footprint
- Suggest optimisations only after functionality is correct.
- Avoid introducing heavy dependencies (<1 MB install) unless explicitly required.

## 10. Fail-Fast Guidance
- For scripts/CLI tools generated, exit with non-zero status on errors and print actionable messages.
- For configuration (YAML/JSON), include minimal inline comments to explain non-obvious keys.

---

_Note: Language-specific rules (`python.md`, `terraform.md`, etc.) **override** any conflicting advice here for their respective file patterns._




