# Step 03: Frame Evidence

## Goal

Collect the evidence needed to support later state inference without confirming states, inferring triggers from screenshots, or turning evidence gaps into interpretation.

## Do

1. Read `artifacts/frame-inventory.yaml`.
2. Stay in evidence-collection mode in this step.
   - do not confirm a state name in this step
   - do not infer an interaction trigger from screenshots alone
   - do not introduce user-facing interpretation, implementation planning, fallback behavior, or mock decisions in this step
   - if evidence is missing, record the gap instead of filling it with inference
3. For each included frame, collect:
   - design context
   - screenshot path
   - viewport dimensions for the frame being modeled
   - prototype inbound and outbound connections
   - visible layers
   - component, variant, or annotation evidence when available
   - stable connection records with reusable `connection_id` values
   - visual implementation evidence needed for mock fidelity, including layout regions, text styles, asset references, and token references when available
4. Keep all evidence artifacts and referenced evidence files under the same `{project-root}/figma-yaml/{session_id}/` tree.
   - if a screenshot or exported evidence file is persisted by the workflow, store it under the current session directory
   - if an external source is referenced, record it as an external reference without reclassifying it as a session artifact
5. For every collected assertion, record its source kind explicitly.
   - use source kinds such as `prototype`, `screenshot`, `layer_visibility`, `component`, `variant`, `annotation`, or another template-supported machine-readable value
   - for interaction-related assertions, persist `trigger_confirmed: true|false`
   - when `trigger_confirmed: true`, persist `trigger_source_ref` that points to prototype evidence rather than screenshot-only evidence
6. For prototype inbound and outbound connections, transcribe raw transition evidence as shown.
   - record a stable `connection_id` for each connection
   - record source and destination frame refs, stable node refs, and source Figma node refs
   - record any available interaction metadata from the prototype evidence
   - if a transition detail is not shown, record it as `unknown` or `not_evidenced` rather than inferring it
   - do not upgrade screenshot hints into confirmed trigger metadata
7. Create `artifacts/frame-evidence.yaml` from [../templates/frame-evidence.template.yaml](../templates/frame-evidence.template.yaml) under `{project-root}/figma-yaml/{session_id}/artifacts/`.
8. Use stable `evidence_id` values for every assertion.
   - reuse upstream stable references from `frame-inventory.yaml`, including `scope_id`, `frame_id`, and any stable `node_id` values
   - attach each evidence record to its upstream stable references rather than introducing detached evidence IDs
9. Persist confirmed evidence distinctly from evidence gaps.
   - use separate structures such as confirmed assertions and evidence gaps, or an equivalent template-supported structure that keeps confirmed and unresolved records mechanically distinct
   - if the template uses a unified assertion list, force an explicit status such as `confirmed` or `gap`
10. For each confirmed evidence assertion, persist at least:
   - `evidence_id`
   - `scope_id`
   - `frame_id`
   - relevant upstream stable refs such as `node_id`, `connection_ref`, `annotation_ref`, or `layer_ref`
   - source Figma refs such as `figma_node_id` when the assertion is node-specific
   - `source_kind`
   - `supporting_refs`
   - an observed-evidence digest that stays factual and non-interpretive
11. For each frame, persist mock-relevant visual evidence in structured form when it is available:
   - viewport width and height
   - layout region bounds and spacing
   - text content and typography attributes
   - color, border, radius, and shadow attributes
   - asset references and export paths
   - token references when design tokens are available
   - when available, preserve exact geometry inputs needed for reconstruction, including `locationRelativeToParent`, dimensions, padding, gap, and alignment behavior
   - when effects are available, persist effect references and effect values needed for CSS translation rather than summarizing them away
   - when asset references exist, persist enough information to support later export or concrete asset resolution rather than only recording a display label
12. For each evidence gap, persist at least:
   - `gap_id`
   - `scope_id`
   - `frame_id`
   - the affected upstream refs when known
   - `missing_from` or equivalent source location
   - `blocked_by` or equivalent reason
   - `needed_followup`
   - whether later interpretation would require approval if the gap remains unresolved
13. When two or more frames on the same surface differ, persist structured `state_differences` for the changed properties rather than relying on later free-form comparison.
14. Keep `evidence summary` factual.
   - treat it as an observed evidence digest, not a state interpretation
   - if a summary would require guessing, move that item into an evidence gap instead
15. Classify unresolved gaps before handoff.
   - gaps that still allow continued evidence collection may remain open
   - gaps that would block safe downstream interpretation must be flagged as approval-gated before interpretation occurs
16. When using `figma-developer-mcp` or another Figma MCP server, inspect the full tool response before concluding that style, layout, fill, or prototype data is missing.
   - do not treat a failed lookup for one or a few token references as proof that style data is absent
   - inspect the full response, not only the initial node tree
   - check for trailing or separate maps for references such as fills, text styles, layouts, effects, named styles, component metadata, or prototype-related fields
17. Resolve node-level references such as `fills`, `textStyle`, and `layout` against the backing maps before writing evidence conclusions.
   - if a node uses reference-style fields such as `fill_*`, `style_*`, or `layout_*`, attempt to resolve those references back to their actual values
   - distinguish between a missing expected reference key, a missing value in the backing map, and a tool response that omitted the entire backing map
   - do not generalize from a small sample of failed token lookups to a global conclusion that style values do not exist
18. If reference resolution fails:
   - record which reference key failed
   - record whether sibling references in the same response resolved successfully
   - mark only the affected field or region as unresolved unless the full backing map is missing
19. If the response contains visible asset references, image refs, or exportable image nodes that will be needed for a reviewed output:
   - record that downstream mock generation must export or resolve those assets before reviewed completion
   - do not treat a symbolic asset reference as equivalent to a usable exported asset file
20. If prototype fields are absent for an interaction-relevant region:
   - record the missing prototype evidence explicitly
   - do not convert visual hints, screenshots, or common UI conventions into confirmed transition behavior

## Record

- confirmed evidence per frame with stable upstream references
- source-kind-specific supporting references
- structured visual evidence for layout, typography, color, and assets when available
- unresolved evidence gaps with stable `gap_id` values kept distinct from confirmed evidence
- approval-gated gaps that must not be silently converted into interpretation
- factual observed-evidence digests only

## Handoff

Continue to [step-04-state-candidates.md](step-04-state-candidates.md) only after all of these are true:

- `artifacts/frame-evidence.yaml` exists under `{project-root}/figma-yaml/{session_id}/artifacts/`
- every evidence assertion has a stable `evidence_id`
- confirmed evidence and evidence gaps are mechanically distinct
- interaction-related assertions identify their `source_kind`
- no interaction trigger is marked confirmed from screenshot-only evidence
- prototype transition details are recorded as shown, or as `unknown` / `not_evidenced`
- mock-relevant visual evidence is captured in structured fields when it is available from the scoped source
- all evidence records are anchored to upstream stable refs such as `scope_id`, `frame_id`, and relevant node or connection references
- unresolved gaps have been classified so downstream interpretation can respect approval-gated gaps
