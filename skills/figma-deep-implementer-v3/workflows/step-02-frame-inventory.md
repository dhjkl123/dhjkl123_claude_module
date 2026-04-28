# Step 02: Frame Inventory

## Goal

Build a stable, scope-preserving list of included frames and explicitly record excluded candidate nodes without widening the authoritative scope from step-01.

## Do

1. Read the scoped target from `artifacts/session-scope.yaml`.
2. Reuse the authoritative scope from step-01. Do not re-select, reinterpret, or silently widen the scope in this step.
3. Collect candidate nodes only within that authoritative scope.
4. Preserve the scope-type rules from step-01 while collecting candidates:
   - for `file key + flow starting frame node id`, follow only explicit prototype connections within the scoped flow
   - do not include nodes from ambiguous cross-links, visual adjacency, name similarity, or unrelated flows
   - for a related frame set, keep the user-scoped related-frame-set boundary authoritative
5. If mixed unrelated flows or ambiguous transitions are discovered, do not continue as if the scope is still valid.
   - record the affected candidates and why they are ambiguous
   - return to scope narrowing rather than silently expanding the inventory
6. Include only frames that are in-scope under the authoritative step-01 scope model.
7. Exclude non-frame nodes unless they were actual scope candidates or are needed as supporting evidence for an inclusion or exclusion decision.
8. Do not confirm a state from frame naming alone.
   - frame names may be recorded as evidence metadata
   - frame names must not be the sole basis for inclusion, exclusion, or state confirmation
9. Create `artifacts/frame-inventory.yaml` from [../templates/frame-inventory.template.yaml](../templates/frame-inventory.template.yaml) under `{project-root}/figma-yaml/{session_id}/artifacts/`.
10. Keep all supporting evidence references, exclusion notes, and related inventory material inside the same `{project-root}/figma-yaml/{session_id}/` tree.
11. Reuse the existing `scope_id` from `artifacts/session-scope.yaml`.
12. Assign deterministic, cross-file-stable IDs for newly recorded inventory records:
   - reuse existing IDs when the same source Figma node has already been assigned one in the current session
   - generate new `frame_id` or `node_id` only for truly new in-scope or evaluated candidate records
   - use the same ID mapping rules for included frames, excluded candidates, warnings, and downstream cross references
13. For each included frame record, persist at least:
   - `scope_id`
   - `frame_id`
   - stable inventory `node_id`
   - source Figma `figma_node_id`
   - `parent_node_id` when available
   - `parent_figma_node_id` when available
   - `name`
   - `type`
   - `inclusion_basis`
   - `evidence_basis`
   - `derived_from` or equivalent provenance to the step-01 scope input
   - `prototype_edge_provenance` when inclusion depends on a flow-start prototype edge
14. For each excluded candidate record, persist at least:
   - `scope_id`
   - `node_id`
   - source Figma `figma_node_id`
   - `parent_node_id` or `parent_frame_id` when available
   - `parent_figma_node_id` when available
   - `name`
   - `type`
   - `reason_code`
   - `reason_detail`
   - `applied_contract_rule`
   - `evidence_basis`
   - `reconsideration_trigger` when later evidence could change the exclusion
15. For each warning, persist structured warning metadata, including:
   - `warning_code`
   - `severity`
   - `affected_ids`
   - whether it is blocking for the next step
16. Keep warnings factual and evidence-based.
   - warnings in this step may describe missing or ambiguous evidence
   - warnings in this step must not become user-facing interpretation, fallback behavior, or implementation planning

## Record

- included frames with scope and evidence provenance
- excluded candidate nodes with exclusion reasons and applied contract rules
- inventory warnings with affected IDs and blocking status
- any ambiguity that requires returning to scope narrowing instead of widening the inventory

## Handoff

Continue to [step-03-frame-evidence.md](step-03-frame-evidence.md) only after all of these are true:

- `artifacts/frame-inventory.yaml` exists under `{project-root}/figma-yaml/{session_id}/artifacts/`
- the inventory reuses the authoritative `scope_id` from step-01
- no candidate was included by widening the scope beyond the step-01 contract
- any flow-start inclusions are backed by explicit prototype-edge provenance
- included and excluded records contain stable IDs and evidence basis fields
- any mixed unrelated flow or ambiguous transition has been sent back to scope narrowing instead of silently accepted
