# AGENTS.md

<!-- Replace this line with one sentence describing the project and its stack. -->
A React + TypeScript + Vite app built on the ArcGIS Maps SDK for JavaScript, with
an AI assistant and custom agents from `@arcgis/ai-components`.

## Stack notes

- `npm run dev` serves on the port pinned in `vite.config.ts`; `npm run typecheck`
  must pass before a change is considered done.
- `<arcgis-assistant>` needs a web map portal item with AI vector embeddings. See
  the comment on `WEBMAP_ITEM_ID` in `src/config.ts`.
- Custom agents are LangGraph state graphs exported as an `AgentRegistration`.
  `src/placeFinderAgent.ts` is the worked example — follow its shape.
- Prefer a HIL `NodeInterrupt` over guessing when a user's input is ambiguous.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
