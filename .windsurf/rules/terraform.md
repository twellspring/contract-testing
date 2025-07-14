---
trigger: glob
globs: **/*.tf **/*.tfvars
---

# Terraform Infrastructure-as-Code Guidelines

These rules apply to all Terraform modules, root configurations, and variables in this repository.

---

## 1. Provider & Version Pinning
- Declare specific provider versions, e.g.  
  ```hcl
  terraform {
    required_providers {
      aws = {
        source  = "hashicorp/aws"
        version = "~> 5.43"
      }
    }
    required_version = ">= 1.6.0"
  }
  ```
- Check in the generated `.terraform.lock.hcl`.

## 2. Remote State
- **Always** use a remote backend (`s3`, `gcs`, `azurerm`, etc.) with state locking.
- No local state files (`terraform.tfstate`) should be committed.

## 3. Variables & Locals
- Use `variable "name"` blocks for configurable values; set sane, secure defaults.
- Group common expressions under `locals {}` for readability.
- Prefer **explicit types** (`type = string`, `type = map(string)`) over `any`.

## 4. Resource Naming & Tags
- Name resources predictably with `${var.project}-${var.env}-<suffix>`.
- Apply standard tags/labels (`Owner`, `Environment`, `CostCenter`) via `default_tags` or a wrapper module.

## 5. Security & Secrets
- Never hard-code secrets; read from:
  - `terraform.tfvars` excluded via `.gitignore`
  - environment variables (`TF_VAR_…`)
  - secret managers (AWS Secrets Manager, Vault, etc.).
- Mask sensitive outputs with `sensitive = true`.

## 6. Linting & Formatting
- Run `terraform fmt -check` and `tflint` in CI.
- Use `tfsec` (or `checkov`) for static security scanning.
- Reject PRs if any of these fail.

## 7. Testing & Validation
- Run `terraform validate` on every commit.
- For critical modules, add **Terratest** or **kitchen-terraform** tests.
- Optionally include **Infracost** in CI to surface cost diffs.

## 8. Safe Lifecycle Practices
- For production data resources add  
  ```hcl
  lifecycle {
    prevent_destroy = true
  }
  ```
- Use `create_before_destroy` when replacing resources that cannot be down.

## 9. Module Design
- Keep modules focused: one high-level concept each (e.g., “vpc”, “eks-cluster”).
- Input/output variables should be documented with descriptions.
- Version modules with Git tags (e.g., `module "vpc" { source = "git::https://...//vpc?

## 10. Documentation
- Run `terraform-docs markdown table . > README.md` in each module.
- Update docs whenever variables/outputs change.

---

_Note: These rules augment the repository-wide **general.md** behaviour guidelines and will override conflicting advice for `.tf`/`.tfvars` files only._
