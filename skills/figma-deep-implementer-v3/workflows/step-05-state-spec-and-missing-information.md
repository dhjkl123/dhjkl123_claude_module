# Step 05: State Spec And Missing Information

## Goal

Split confirmed state definitions from unresolved uncertainty without letting fallback candidates or weak interpretations cross the approval boundary.

## Do

1. Read `artifacts/state-candidates.yaml`.
2. Create both output artifacts under `{project-root}/figma-yaml/{session_id}/artifacts/`:
   - `artifacts/state-spec.yaml` using [../templates/state-spec.template.yaml](../templates/state-spec.template.yaml)
   - `artifacts/missing-information.yaml` using [../templates/missing-information.template.yaml](../templates/missing-information.template.yaml)
3. Mint or advance the canonical `spec_revision_id` for this spec snapshot before writing either artifact.
   - if the current session binding is `pending`, mint a new non-pending revision ID now
   - if the current session already has a non-pending revision and the canonical spec snapshot changes, mint a new revision ID rather than mutating the prior revision in place
   - if this step is rerun without changing the canonical spec snapshot for the same in-progress revision, reuse that same current revision ID
   - update the current-session binding in `artifacts/session-scope.yaml` and `artifacts/review-log.yaml` to the minted or reused current revision before handoff
4. Bind both artifacts to that current `spec_revision_id`.
   - record the same current `spec_revision_id` in `artifacts/state-spec.yaml`
   - record the same current `spec_revision_id` in `artifacts/missing-information.yaml`
   - preserve compatibility with the current `artifacts/review-log.yaml` revision binding for this spec generation
5. Promote only confirmed or explicitly approved interpretations into `artifacts/state-spec.yaml`.
   - do not treat confidence alone as sufficient for promotion
   - if a material evidence gap remains unresolved and there is no explicit approval for the affected interpretation, route that interpretation to missing-information instead of state-spec
   - if a candidate remains interpretive rather than confirmed, do not promote it unless the workflow contract explicitly allows that interpretation and the required approval already exists
   - when an explicitly approved interpretation is promoted for draft-path use, mark it as approval-derived, record the approval reference, and keep its unresolved dependency refs explicit
6. Route unresolved, weakly supported, blocked, or approval-gated items into `artifacts/missing-information.yaml`.
7. Keep confirmed outputs and missing-information semantically separate.
   - do not allow the same unresolved state claim to appear as fully confirmed in `state-spec.yaml` and unresolved in `missing-information.yaml`
   - an approval-derived draft-path interpretation may appear in `state-spec.yaml` only when its unresolved dependency remains explicit and traceable in `missing-information.yaml`
   - if a state difference, trigger, or surface relation still depends on missing evidence, keep that dependency explicit in missing-information rather than silently normalizing it into confirmed state-spec
8. Do not let fallback candidates cross the approval boundary in this step.
   - `recommended_default` or `allowed_fallback` must be recorded only as non-binding candidates
   - they must not be treated as confirmed values, implicit decisions, implementation instructions, or mock-ready defaults before the required approval exists
9. Use the canonical missing-information field system from the template.
   - record `missing_info_id` as the stable identifier
   - do not mix `missing_id` and `missing_info_id` in the same session outputs
   - when a missing-information item comes from one or more evidence gaps, carry those upstream `gap_id` values into `source_gap_refs`
10. Preserve stable IDs and cross references across both artifacts.
   - reuse upstream stable refs from `state-candidates.yaml`
   - assign stable IDs for new entities such as `state_id`, `trigger_id`, and `missing_info_id`
   - ensure every confirmed state, trigger, difference, and missing-information item can be traced back to candidate and evidence references
   - ensure every approval-derived draft-path interpretation can be traced to its approval record and unresolved dependency refs
11. Validate semantic exclusivity before handoff.
   - a fully confirmed state must not depend on an unresolved missing-information item
   - an approval-derived draft-path state may depend on unresolved missing-information only when that dependency is explicitly modeled, non-reviewed, and linked back to the approving checkpoint
   - a missing-information item must identify which surface, state, trigger, or relation it blocks

## Record in state-spec

- surfaces
- confirmed states
- triggers
- evidence refs
- confidence
- interpretation basis such as `confirmed` or `approved-fallback`
- approval refs when an interpretation is approval-derived
- differences from base
- unresolved dependency refs when an approval-derived draft-path interpretation still depends on missing evidence
- `spec_revision_id`
- stable IDs such as `surface_id`, `state_id`, and `trigger_id`
- upstream candidate and evidence cross references

## Record in missing-information

- scope
- uncertainty kind
- review question
- allowed fallback as a non-binding candidate only
- `spec_revision_id`
- stable IDs such as `missing_info_id`
- upstream `source_gap_refs` when the item derives from earlier evidence gaps
- blocked surface/state/trigger/relation refs
- candidate and evidence refs
- severity
- blocking

## Handoff

Continue to [step-06-human-review-and-reviewed-spec.md](step-06-human-review-and-reviewed-spec.md) only after all of these are true:

- both YAML files exist under `{project-root}/figma-yaml/{session_id}/artifacts/`
- both YAML files record the same current non-pending `spec_revision_id`
- stable IDs and upstream cross references are present and non-dangling
- confirmed outputs and missing-information items are semantically distinct rather than duplicated
- no `recommended_default` or `allowed_fallback` item has been silently promoted into confirmed state-spec
- any approval-derived draft-path interpretation is explicitly marked, approval-linked, and still blocked from reviewed-path completion while its material gap remains unresolved
- blocking and material missing-information items remain explicit for later review
- the handoff does not imply a reviewed path when unresolved material evidence gaps still exist
