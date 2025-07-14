---
trigger: glob
globs: .github/workflows/*.yml .github/workflows/*.yaml
---

# GitHub Actions Workflow Guidelines

These rules apply to **all** CI/CD workflows defined under `.github/workflows/`.

---

## 1. File Naming & Purpose
- Name each file after its primary intent, e.g. `ci.yml`, `release.yml`, `deploy-prod.yml`.
- Include a brief header comment describing what triggers the workflow.

## 2. Trigger Hygiene
- Prefer `pull_request` for test / lint workflows; restrict to key branches with:
  ```yaml
  on:
    pull_request:
      branches: [ main, dev, release/* ]
  ```
- Use `workflow_dispatch` and protected environments for production deploys.

## 3. Runner & Image Versions
- Pin runner images explicitly (e.g. `ubuntu-22.04`, **not** `ubuntu-latest`) to avoid silent breaking changes.


## 4. Least-Privilege Permissions
- Set a **default permission block**:
  ```yaml
  permissions:
    contents: read
  ```
- Grant elevated scopes (`packages: write`, `id-token: write`) **only** to the job needing them.

## 5. Secrets & OIDC
- Reference secrets via `${{ secrets.MY_SECRET }}`.  
  Never echo secrets or write them to artifacts.
- Prefer **OIDC + short-lived cloud credentials** (AWS/GCP/Azure) over static keys.

## 6. Caching & Optimisation
- Use `actions/cache` to cache dependency directories (npm, pip, cargo, etc.) keyed by lockfile hashes.
- In monorepos, scope caches by sub-project path to avoid invalidation.

## 7. Reusable Workflows
- Extract common build steps into a **reusable workflow** in `.github/workflows/_shared-build.yml`.

## 8. Concurrency Control
- Add:
  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```
  to prevent duplicate runs on rapid force-pushes.

## 9. Job Output & Artifacts
- Upload build artifacts with explicit retention periods (`retention-days: 7` or lower for large bundles).
- Use the new `artifact: scope` feature for private uploads if repository visibility is public.

## 10. Linting & Validation
- Run `actionlint` (or `workflow-lint` in GitHub) on every PR:
  ```yaml
    - name: Lint workflows
      uses: rhysd/actionlint@v1
  ```
- Fail the job on mis-configured steps, un-pinned actions, or syntax errors.

---

_Note: These workflow rules complement the repository-wide `general.md` Windsurf behaviour guidelines and take precedence for `.yml` / `.yaml` files inside `.github/workflows/`._
