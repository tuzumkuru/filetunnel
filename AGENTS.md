# AGENTS.md — <!-- Project Name -->

## What This Repo Is

<!-- One paragraph: what this application does, what technology stack it uses,
     and the context for why it exists (new build, rewrite, migration, etc.).
     Example: "Python implementation of X that queries Y database and produces Z output." -->

---

## Documents

### SDLC Documents

| File | Purpose | Status |
|---|---|---|
| [docs/prd.md](docs/prd.md) | Product requirements, user stories, acceptance criteria | stub |
| [docs/architecture.md](docs/architecture.md) | Tech stack, module breakdown, data flow | stub |
| [docs/design.md](docs/design.md) | UI/UX design, wireframes, component inventory | stub |
| [docs/plan.md](docs/plan.md) | Phased implementation plan with task checklist | stub |

### Reference Material (read-only — do not modify)

<!-- List any read-only reference documents specific to this project.
     Examples: legacy source code, analysis docs, spec documents.
     Remove this subsection if there are none. -->

| File | Content |
|---|---|
| <!-- path --> | <!-- description --> |

### Dev Framework (portable — see .sldc-framework/)

| File | Content |
|---|---|
| [.sldc-framework/README.md](.sldc-framework/README.md) | Framework index and bootstrap guide |
| [.sldc-framework/workflow.md](.sldc-framework/workflow.md) | SDLC philosophy and phase-gate rules |
| [.sldc-framework/plan_guide.md](.sldc-framework/plan_guide.md) | Development loop, plan.md usage, status markers |
| [.sldc-framework/document_guides.md](.sldc-framework/document_guides.md) | How to write PRD / architecture / design / plan docs |
| [.sldc-framework/versioning.md](.sldc-framework/versioning.md) | Semantic versioning rules |
| [.sldc-framework/agent_rules.md](.sldc-framework/agent_rules.md) | AI agent task rules, commit rules, scope discipline |
| [.sldc-framework/conventions/python.md](.sldc-framework/conventions/python.md) | Google style, ruff, pyright, naming |
| [.sldc-framework/conventions/git.md](.sldc-framework/conventions/git.md) | Conventional Commits, branch naming |
| [.sldc-framework/conventions/testing.md](.sldc-framework/conventions/testing.md) | pytest structure, coverage, markers |

---

## @ References

The files below are auto-loaded by Claude Code when this file is read.

@.sldc-framework/workflow.md
@.sldc-framework/plan_guide.md
@.sldc-framework/agent_rules.md
@.sldc-framework/versioning.md
@.sldc-framework/conventions/python.md
@.sldc-framework/conventions/git.md
@.sldc-framework/conventions/testing.md

---

## Workflow Conventions (project-level overrides)

These override or extend the framework defaults in `.sldc-framework/`.

### Task Designation

Before starting any task, mark it `[-]` in `docs/plan.md`. Only **one** `[-]` marker is allowed at a time. See `.sldc-framework/plan_guide.md — The Development Loop, Step 3`.

**Do not pre-mark future tasks.** Mark `[-]` only for the task you are actively working on right now. Never mark multiple tasks `[-]` at once, even if you plan to do them in sequence.

### Commit Discipline

Never run `git commit` autonomously. After completing a task or phase, state that the work is ready and ask the human whether to commit. See `.sldc-framework/agent_rules.md — Commit Rules`.

<!-- Add project-specific overrides below. Remove this comment when done. -->

---

## Key Project Facts

<!-- This table is the only project-specific section that contains facts.
     All process and methodology content lives in .sldc-framework/.
     Add or remove rows to match your project. -->

| Item | Value |
|---|---|
| <!-- "Database server" --> | <!-- "192.168.x.x" --> |
| <!-- "Database name" --> | <!-- "MyDatabase" --> |
| <!-- "DB driver" --> | <!-- "pyodbc / SQLAlchemy / psycopg2" --> |
| <!-- "Primary output" --> | <!-- "PDF reports / REST API / CLI tool" --> |
| <!-- Add more project-specific rows here --> | |
| **Python version** | 3.11+ |
| **Source root** | `src/` |
| **Test root** | `tests/` |
| **Version file** | `pyproject.toml` |
