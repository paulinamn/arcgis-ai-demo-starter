# The workflow

How to go from a customer conversation to a working, demo-ready proof of concept —
and, more importantly, how to still be able to change it once they've seen it.

This document is the *why*. [README.md](./README.md) is the *how*.

## The problem this solves

A customer describes something on a call. The idea is worth showing, but building
it the normal way takes long enough that by the time it exists the moment has
passed — or worse, it exists, the customer says "not quite," and changing it means
unpicking a prototype that was never built to change.

Two failure modes, both common:

- **Too slow.** The demo arrives after the conversation that prompted it.
- **Too brittle.** The demo arrives fast, the customer reacts, and the feedback
  can't be absorbed because nothing was written down and nobody remembers why
  anything works the way it does.

The aim is a third thing: fast *and* amendable.

## The three layers

Keep these separate in your head. They get conflated constantly.

| Layer | What it is | Where it lives |
| --- | --- | --- |
| **Tools** | Capabilities the agent can call — run a command, edit a file, drive a browser | Provided by the environment |
| **Skills** | Markdown knowledge about doing one thing well | `.agents/skills/`, tracked by `skills-lock.json` |
| **Agents** | Workers with their own context that use tools and skills | Dispatched per task |

A skill is the interesting one. It's a folder with a `SKILL.md` containing a
`description` (the trigger — "use when the user works with @arcgis/core…") and a
body (the actual expertise). The agent reads descriptions to decide what's
relevant, then loads the body only when it fires.

In practice: a skill is a senior colleague's hard-won rule, written down, picked up
at exactly the right moment.

### `skills-lock.json`

The skills themselves are third-party content — hundreds of files you don't want in
your git history. So they're gitignored, and the **lock file is committed instead**:

```json
"arcade": {
  "source": "valdesrosier/arcgis-skills",
  "sourceType": "github",
  "skillPath": "skills/arcgis/arcade/SKILL.md",
  "computedHash": "75b39ffaa75c..."
}
```

Source repo, path within it, and a content fingerprint. Same idea as
`package-lock.json`: `package.json` expresses a wish, the lock file is a guarantee.
The hash matters — it pins the exact content you tested against, so if an upstream
author rewrites a skill you find out loudly instead of silently inheriting
different behaviour.

Skills are inherited from ancestor directories. Install a shared set once at the
root of where you keep demos and every project below it has them with no setup.
This template ships its own lock file so it still works when cloned elsewhere.

## One-time setup

1. **Use this template** on GitHub, or clone it.
2. Decide where demos live. Everything under that folder can share one installed
   skill set.

## Per demo

```powershell
gh repo create acme-parcel-viewer --private --template arcgis-ai-demo-starter
cd acme-parcel-viewer
npm install
npm run dev
```

A working map and assistant are on screen in minutes. Sign in to ArcGIS Online
once. Ask *"Find Springfield"* and watch the human-in-the-loop interrupt fire.

Nothing is broken yet — which matters more than it sounds. From here you are
debugging *your idea*, not the plumbing.

Then two files make it yours:

- **`src/config.ts`** — title, web map id, assistant copy, suggested prompts
- **`AGENTS.md`** — one line describing the project

And you start the real work by describing behaviour, not teaching infrastructure:

> *Copy `placeFinderAgent.ts` to `parcelAgent.ts`. Instead of geocoding, query the
> parcels layer at the clicked point and return owner, zoning, and acreage. Keep the
> HIL interrupt — if a parcel number matches more than one record, ask which.*

The agent already knows the project conventions from `AGENTS.md`, has a working
example in front of it, and has the domain skills loaded.

## Write decisions down as you make them

This is the part that separates a prototype that can absorb feedback from one that
has to be rebuilt.

- **Non-obvious behaviour → an ADR** in `docs/adr/`. Cite the specific case that
  forced it. "Hanover Township's centroid lands in an ineligible block, so a
  mostly-eligible township reported as ineligible" beats "centroids are
  unrepresentative."
- **A concept needing one consistent name → `GLOSSARY.md`.** Used identically in
  code, UI, and conversation.
- **Why a change was made → the commit message body**, in prose.

Do it at the moment of the decision, not afterward. Documentation written later is
documentation nobody believes.

Both `GLOSSARY.md` and `docs/adr/` ship nearly empty on purpose. They get filled in
when a term or decision is actually earned.

## Show it early, then change it

The point of being fast is to get it in front of someone before you're invested in
it being right.

A real example from the project this template was extracted from: the first version
answered every question by resolving it to a single point. Ask about a township and
it sampled the point at the centre and reported the answer under the township's
name. Hanover Township, PA intersects seven eligibility blocks — four eligible,
three not — and its centroid lands in an ineligible one. So the app confidently
reported "not eligible" for a township that is mostly eligible, with nothing in the
output disclosing that a single point had been checked.

The fix, in one afternoon:

1. Write the ADR explaining the problem, naming the failing case
2. Resolve real boundaries and measure coverage across them
3. Add a `Partly Eligible` status that can only exist for areas, never a point
4. Measure by land area, not block count, because blocks vary by orders of magnitude
5. Discover five identically-named townships in the same state and add a
   human-in-the-loop interrupt rather than guessing
6. Ship it, with a fallback to the old behaviour when a boundary can't be resolved

That turnaround is the whole argument. Not "AI wrote my app fast" — rather, when
the demo was wrong in a way that mattered, the distance from *that's wrong* to
*that's fixed, documented, and shipped* was an afternoon.

## Stopping is a feature

The example agent in this template demonstrates it deliberately. Ask it to find
"Springfield" and it stops and asks which one, instead of taking the first
geocoder result.

That instinct — interrupt rather than guess — is the same one behind writing ADRs:
record the thing you're unsure about rather than papering over it. On questions
where the answer affects a real decision, an agent admitting ambiguity is worth
more than an agent sounding confident.

## Verify by driving the real UI

Browser automation tools can drive the running app: click the suggested prompt,
type the question, select an option in the interrupt, screenshot the result. Use
them. "It compiles" is not evidence; "I ran all five demo questions and the
interrupt resumed correctly" is.

This also catches demo-ordering problems. In the project this came from, questions
that switch the map's program lens clear the location panel — so the demo script
puts the location questions first. That was found by running it, not by reading it.

## Feed improvements back

When a demo teaches you something general, put it back in the template. It
compounds.

Two examples already in `vite.config.ts`, each with the reasoning inline:

- `optimizeDeps.include: ["@arcgis/ai-orchestrator"]` — the orchestrator loads its
  embeddings worker by dynamic import, so Vite discovers it mid-page-load, re-optimizes,
  and fails in-flight requests with 504 "Outdated Optimize Dep".
- A pinned, non-default port — every Vite project shares 5173, and the browser keeps
  per-origin service workers and module caches belonging to whichever app held it last.

Both cost real time to diagnose once. Neither will ever cost that again.

## Known sharp edges

- **ArcGIS sign-in is required**, and localStorage is per-origin, so a new demo on a
  new port prompts again. Budget 30 seconds before presenting.
- **The web map must have AI vector embeddings generated.** `<arcgis-assistant>`
  refuses to initialise otherwise, failing with *"Embeddings resource
  'embeddings-v01.json' not found"*. ArcGIS Online → item → Settings → Manage AI
  vector embeddings → Generate Embeddings.
- **ArcGIS package versions are pinned on purpose.** Floating to `^5.0.0` pulls
  5.2.x, which restructured `@arcgis/ai-orchestrator` out of `@arcgis/ai-components`'
  dependencies and breaks startup. Upgrade deliberately: bump all four together,
  check Esri's version matrix, run the app.
- **This produces proof of concepts.** Disclaimers in demo UIs are load-bearing.
  Fast does not mean authoritative.

## The summary

Build it in days. Put it in front of the customer before you're ready. Let their
reaction, not your roadmap, decide what you build next.

The speed doesn't come from skipping the thinking — it comes from never explaining
your project twice, and from the plumbing already being solved. The sessions spent
writing ADRs and glossary entries feel slow and are the reason the later sessions
are fast.
