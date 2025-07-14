---
trigger: glob
globs: **/*.py
---

# Python DevOps Guidelines.  These rules were designed for Python scripts used for automation, infrastructure tooling, and CLI orchestration.


## 1. File Structure
- Each executable file should include a `main()` function and the standard entry guard:
  ```python
  if __name__ == "__main__":
      main()
  ```
- All imports must appear at the top of the file, before any other code (except for the shebang).
- If a script is intended to be executed directly, it **must begin with**:
  ```python
  #!/usr/bin/env python3
  ```
  and have executable permissions (`chmod +x`).
- Use Python libraries in separate files. Keep library files short enough to reduce the work Windsurf has to do when making updates.


## 2. Coding Best Practices
- Default to Python 3.11+ syntax unless user specifies otherwise.
- Keep the python main method short and simple.
- Use `argparse` or `click` for CLI arguments — avoid raw `sys.argv` parsing.
- Use idiomatic, production-quality Python (PEP8 style, clear variable names, avoid excessive nesting).
- Prefer f-strings for string interpolation.
- For file operations, always handle exceptions and use context managers (with open()).
- When suggesting third-party libraries, prefer popular, well-maintained packages (e.g., requests, boto3, PyYAML).
- For any API calls, include basic error handling with informative error messages.
- When returning JSON or YAML outputs, include proper serialization (json.dumps or yaml.safe_dump).


## 3. Environment Safety
- Scripts that modify infrastructure (e.g., AWS, Kubernetes) must:
  - Default to `--dry-run` mode.
  - Confirm before any destructive actions (like deleting resources).
- Avoid hardcoding credentials. Use environment variables or `.env` files managed by `dotenv`.

## 4. Code Quality
- All scripts must pass:
  - `flake8` for linting
  - `black` for formatting
  - `mypy` for static type checking
- Use type hints for all public functions.

## 5. Modularity
- Keep logic modular — avoid long, flat scripts.
- Split shared logic into `lib/` modules.
- Use wrapper functions for shell commands with exception handling.

## 6. Testing
- Use `pytest` for unit testing reusable modules and use assert statements.
- For CLI tools, use `subprocess.run()` or `click.testing.CliRunner` to simulate command-line use.
- CI pipelines must include test coverage for non-trivial logic.

## 7. Secrets Management
- Never log tokens, passwords, or secret values.
- Use `os.environ.get()` with validation at startup.
- Consider using AWS Secrets Manager or HashiCorp Vault for sensitive credentials.

## 8. Documentation and Docstrings

### Requirements
- All public functions and classes must include a **docstring in Google style** format.
- Scripts must begin with a top-level docstring summarizing the file’s purpose and usage.
- When a function or module is updates, also update the docstring.

### Top-Level Example
```python
"""
deploy_stack.py

Deploys an AWS CloudFormation stack with optional rollback and preview features.

Usage:
    python deploy_stack.py --stack my-stack --template path/to/template.yaml
"""
```

### Function Docstring Example (Google Style)
```python
def deploy_stack(stack_name: str, template_path: str, dry_run: bool = True):
    """Deploy an AWS CloudFormation stack.

    Args:
        stack_name (str): The name of the CloudFormation stack.
        template_path (str): Path to the CloudFormation template file.
        dry_run (bool): If True, only print actions without deploying.
   
    Returns:
        return_type: Description.

    Raises:
        FileNotFoundError: If the template file is not found.
        boto3.exceptions.Boto3Error: If deployment fails.
    """
```

### Enforcement
- Missing docstrings or incorrect format should be flagged in PR review.
- Tools like [`pydocstyle`](http://www.pydocstyle.org/en/stable/) with the `--convention=google` flag should be included in CI checks.