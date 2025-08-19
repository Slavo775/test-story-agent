---

# 2️⃣ `CONFIG.md`

```md
# ai-gen.config.json – Configuration Reference

This file defines how the AI generator behaves.

---

## Branches & PR

- **branchBase** _(string)_ – the base branch (e.g. `"main"` or `"master"`).
- **branchPrefix** _(string)_ – prefix for newly created branches (e.g. `"ai-gen/"`).
- **prPrefix** _(string)_ – prefix for PR titles (e.g. `"[AI-gen] "`).
- **reviewers** _(string[])_ – GitHub usernames that will be automatically added as reviewers.

---

## Features

- **features.storybook** _(boolean)_ – generate Storybook stories.
- **features.unit** _(boolean)_ – generate unit tests.
- **features.integration** _(boolean)_ – generate integration tests.

---

## Paths

- **paths.components** _(string[])_ – glob patterns where the agent looks for components.
- **paths.exclude** _(string[])_ – glob patterns to ignore (stories/tests/specs etc).

---

## Targets

- **targets.storybook** _(object)_

  - `mode`: `"co-locate"` (next to component) or `"folder"` (central folder).
  - `folder`: path if using `mode: "folder"`.

- **targets.unit** _(object)_ – same as above.

- **targets.integration** _(object)_ – always `"folder"`.

---

## Overwrite Policy

- **overwritePolicy** _(string)_ – defines when files can be overwritten:

  - `"generated-only"` → overwrite only files with header `// @ai-generated`.
  - `"force"` → overwrite all files.
  - `"skip"` → never overwrite, only create new files.

- **fileHeader** _(string)_ – header added to each generated file.

---

## LLM Settings

- **llm.provider** _(string)_ – `"anthropic"` (Claude) or `"openai"`.
- **llm.model** _(string)_ – model name (e.g. `"claude-3-5-sonnet-20240620"`).
- **llm.baseUrl** _(string)_ – API endpoint (default: `https://api.anthropic.com`).
- **llm.temperature** _(number)_ – creativity (0.0 = deterministic, 1.0 = creative).

---

## Example

```json
{
  "branchBase": "main",
  "branchPrefix": "ai-gen/",
  "prPrefix": "[AI-gen] ",
  "reviewers": ["janedoe"],
  "features": {"storybook": true, "unit": true, "integration": false},
  "paths": {
    "components": ["src/components/**/*.{tsx,ts}"],
    "exclude": ["**/*.stories.*", "**/*.test.*"]
  },
  "targets": {
    "storybook": {"mode": "co-locate"},
    "unit": {"mode": "folder", "folder": "tests/unit"},
    "integration": {"folder": "tests/integration"}
  },
  "overwritePolicy": "generated-only",
  "fileHeader": "// @ai-generated",
  "llm": {
    "provider": "anthropic",
    "model": "claude-3-5-haiku-20241022",
    "baseUrl": "https://api.anthropic.com",
    "temperature": 0.1
  }
}
```
