---
name: figma-deep-implementer
description: Deep Figma screen analysis and implementation for fixed-size UI recreation from a Figma link or node. Use when the user provides a Figma link, file key, or node id and wants pixel-accurate screen implementation, review, or state analysis. Always use for Figma-driven UI work where Codex must inspect not only the top-level frame but also nested frames, groups, overlays, modals, dropdowns, popovers, selected states, hover/active variants, input states, and other stateful sublayers before implementing or judging feasibility.
---

# Figma Deep Implementer

Implement Figma screens by reading the target node deeply before coding. Do not stop at the top-level frame when stateful UI may exist below it.

## Language rule

All user-facing communication must be written in Korean.

This includes:

- analysis summaries
- progress updates
- approval requests
- questions
- implementation reports
- final responses
- `AskUserQuestion`

Code, file paths, identifiers, raw Figma node names, and original UI labels may remain in their original form when needed, but every explanation and decision addressed to the user must be in Korean.

## Required workflow

1. Parse the Figma link and extract `fileKey` and `nodeId`.
2. Read the root frame first.
3. Check whether the frame contains stateful UI.
   Stateful UI includes:
   - modal
   - overlay
   - dropdown
   - autocomplete list
   - popover
   - tooltip
   - selected/active tab or pill
   - input with typed value
   - hover/pressed/open states
4. If any stateful UI may exist, read deeper nodes until the additional visible layers are identified.
5. Before coding, summarize:
   - base layout
   - extra visible layers
   - interaction state name
   - implementation risks
6. Ask for approval before coding.
7. Only then implement.

## Approval step

After analysis and before implementation:

1. summarize the findings for the user
2. show:
   - base layout
   - extra visible layers
   - interaction state name
   - implementation risks
   - proposed implementation approach
3. ask whether to proceed

Use `AskUserQuestion` for this approval step.

Do not start coding until the user approves, unless the user explicitly asked to skip approval.

## Implementation rules

- Reproduce the Figma layout exactly.
- Use Figma values directly for:
  - position
  - size
  - spacing
  - colors
  - typography
  - border radius
  - shadows
  - icon/image placement
- Do not improve the design.
- Do not estimate values when Figma provides them.
- Start with fixed-size implementation using the Figma frame size.
- Use absolute positioning if it is the most faithful way to match Figma.
- Do not add API logic or business logic unless the user explicitly asks.

## Existing-screen updates

When updating an existing implementation:

- Compare the current code against the target Figma node.
- Do not assume a modal or overlay asset swap is enough.
- Verify whether the base frame also changed:
  - canvas height
  - card positions
  - sidebar/footer positions
  - title and toolbar positions
  - overlay bounds
  - modal coordinates
- If only an overlay state changed, reuse the existing base.
- If the base frame changed, update the full layout before applying the overlay state.

## State analysis rules

When the user gives a high-level node:

- Inspect child groups and frames close to the leaves when needed.
- Treat these as separate visible states, not as cosmetic variations:
  - search field with typed input
  - opened dropdown under an input
  - selected row inside a menu
  - modal with nested popover
  - secondary overlay on top of a modal

Before implementation, explicitly name the state, for example:

- `base screen`
- `filter modal open`
- `tag autocomplete open`
- `selected dropdown item`

## Interaction scope

Implement only interactions that are directly visible from the Figma state set.

Allowed examples:

- button opens/closes modal
- overlay click closes modal
- input focus opens dropdown
- selecting a visible item updates the shown state
- tab or pill selection toggles visible states

Not allowed unless the user asks:

- API calls
- backend rules
- validation logic not visible in Figma
- inferred business behavior

## Output checklist

Before finishing, verify:

- the target frame size matches Figma
- all extra visible layers were inspected
- the implemented state name matches what Figma actually shows
- approval was requested before coding unless the user explicitly skipped it
- no design improvements were introduced
- the result reflects the deepest relevant visible node state, not only the top frame

## Default user intent

If the user provides a Figma link, assume they want deep node inspection first, then implementation or feasibility review.
