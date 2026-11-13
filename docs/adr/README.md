# Architecture Decision Records

One file per decision, numbered from `0001`, named
`NNNN-short-statement-of-the-decision.md`.

Write one when a behaviour is non-obvious enough that someone — a customer, a
colleague, or you in three weeks — will ask "why does it do *that*?". Don't write
them for decisions that explain themselves.

## Format

The filename states the decision. The body explains what was happening before, what
went wrong with it, and why this is better. Prose, not bullet lists — the reasoning
is the point.

```markdown
# Unmapped locations are rural and eligible

<What the rule is, in a sentence or two.>

<What the previous behaviour was, and the concrete case that showed it was wrong.
Name the real example. A specific failing case is worth more than a paragraph of
principle.>

## Consequences

<What this forces elsewhere: new states, things other components must now handle,
what it rules out.>
```

## Rules of thumb

- **Cite the case that forced it.** "Hanover Township's centroid lands in an
  ineligible block, so a mostly-eligible township reported as ineligible" beats
  "centroids are unrepresentative".
- **Record what it costs.** A decision with no consequences section usually wasn't
  a real decision.
- **Supersede, don't edit.** When a decision is reversed, write a new ADR that says
  so and link back. The old reasoning stays readable.
- **Link between them.** ADRs that depend on each other should say so inline.
