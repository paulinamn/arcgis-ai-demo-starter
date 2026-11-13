# ArcGIS AI demo starter

A running React + Vite app with an ArcGIS map, an AI assistant, and one custom
agent — including a human-in-the-loop interrupt. Clone it, change a few strings,
and build your demo on top instead of rebuilding the plumbing.

It also carries the conventions that let an agent work on the project without
being re-briefed every session (`AGENTS.md`, `docs/agents/`, `docs/adr/`).

## Quick start

```powershell
Copy-Item 'c:\dev\demos\_demo-starter' 'c:\dev\demos\my-new-demo' -Recurse
cd 'c:\dev\demos\my-new-demo'
npm install
npm run dev
```

Opens on <http://localhost:5180>. **You will be prompted to sign in to ArcGIS
Online** — the AI assistant needs an authenticated session. Sign in once; the
credential is persisted across reloads by `src/identity.ts`.

Then ask the assistant *"Find Springfield"* to see the HIL interrupt.

## Make it yours

1. **`src/config.ts`** — every string you are expected to change: title, web map
   id, assistant copy, suggested prompts. Start here.
2. **`AGENTS.md`** — replace the one-line project description.
3. **`src/placeFinderAgent.ts`** — copy it, rename it, replace the logic. The
   comments mark each pattern you need.
4. **`vite.config.ts`** — give the demo its own port if you want two running at once.

### The web map needs AI embeddings

`<arcgis-assistant>` will not start against an ordinary web map. The portal item
must have AI vector embeddings generated, or the orchestrator fails with
*"Embeddings resource 'embeddings-v01.json' not found"*.

In ArcGIS Online: open the web map item → **Settings** → **Manage AI vector
embeddings** → **Generate Embeddings**. You need write access to the item. See the
[AI web map setup docs](https://developers.arcgis.com/javascript/latest/agentic-apps/ai-webmap-setup/#embeddings).

The default `WEBMAP_ITEM_ID` is a public, embeddings-enabled map so the template
runs before you have one of your own.

## What's in here

| Path | Why it exists |
| --- | --- |
| `src/config.ts` | All the per-demo strings in one place |
| `src/App.tsx` | The shell: header, side panel, map, assistant dock |
| `src/placeFinderAgent.ts` | Worked example agent — structured prompts, traces, HIL interrupt, map access |
| `src/identity.ts` | Keeps the ArcGIS sign-in across reloads |
| `src/index.css` | Layout for the shell; theming via Calcite custom properties |
| `vite.config.ts` | Two non-obvious fixes — see below |
| `AGENTS.md`, `docs/agents/` | Conventions the agent reads every session |
| `docs/adr/` | Decisions with reasons |
| `GLOSSARY.md` | One name per concept |
| `.scratch/` | Specs and tickets as markdown |
| `skills-lock.json` | The skill set this template expects |

## Two bugs already solved for you

Both are in `vite.config.ts`, with the reasoning inline:

- **`optimizeDeps.include: ["@arcgis/ai-orchestrator"]`** — the orchestrator loads
  its embeddings worker by dynamic import, so Vite discovers it mid-page-load and
  re-optimizes, failing in-flight requests with 504 "Outdated Optimize Dep".
- **A pinned, non-default port** — every Vite project shares 5173, and the browser
  keeps per-origin service workers and module caches belonging to whichever app
  held it last.

## Versions are pinned on purpose

The four ArcGIS packages are pinned to the `5.0.x` line this template was built and
tested against, and they must move together. `5.2.x` restructured
`@arcgis/ai-orchestrator` out of `@arcgis/ai-components`' dependencies, which
breaks the `optimizeDeps` entry above. Upgrade deliberately: bump all four, check
Esri's version matrix, then run the app.

## Skills

Skills are inherited from ancestor directories, so a demo created under
`c:\dev\demos\` picks up whatever is installed at `c:\dev\demos\.agents\skills\`
and needs no install. `skills-lock.json` is committed here so the set is
reproducible anywhere else — it records each skill's source repo, path, and a
content hash.

## The habit that makes this work

Write the reason down when you make a decision, not afterward:

- Non-obvious behaviour → an ADR in `docs/adr/`
- A concept that needs one consistent name → an entry in `GLOSSARY.md`
- Why a change was made → the commit message body, in prose

This is what lets a demo absorb customer feedback instead of being rewritten.
