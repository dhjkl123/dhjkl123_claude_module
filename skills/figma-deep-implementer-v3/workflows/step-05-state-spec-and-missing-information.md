# Step 05: State Spec And Missing Information

## Goal

Split confirmed state definitions from unresolved uncertainty without letting fallback candidates or weak interpretations cross the approval boundary.

## Do

1. Read `artifacts/state-candidates.yaml`.
2. Create both output artifacts under `{project-root}/figma-yaml/{session_id}/artifacts/`:
   - `artifacts/state-spec.yaml` using [../templates/state-spec.template.yaml](../templates/state-spec.template.yaml)
   - `artifacts/missing-information.yaml` using [../templates/missing-information.template.yaml](../templates/missing-information.template.yaml)
3. Bind both artifacts to the current `spec_revision_id`.
   - record the same current `spec_revision_id` in `artifacts/state-spec.yaml`
   - record the same current `spec_revision_id` in `artifacts/missing-information.yaml`
   - preserve compatibility with the current `artifacts/review-log.yaml` revision binding for this spec generation
4. Promote only confirmed or explicitly approved interpretations into `artifacts/state-spec.yaml`.
   - do not treat confidence alone as sufficient for promotion
   - if a material evidence gap remains unresolved, route the affected interpretation to missing-information instead of state-spec
   - if a candidate remains interpretive rather than confirmed, do not promote it unless the workflow contract explicitly allows that interpretation and the required approval already exists
5. Route unresolved, weakly supported, blocked, or approval-gated items into `artifacts/missing-information.yaml`.
6. Keep confirmed outputs and missing-information semantically separate.
   - do not allow the same unresolved state claim to appear as confirmed in `state-spec.yaml` and unresolved in `missing-information.yaml`
   - if a state difference, trigger, or surface relation still depends on missing evidence, keep that dependency explicit in missing-information rather than silently normalizing it into confirmed state-spec
7. Do not let fallback candidates cross the approval boundary in this step.
   - `recommended_default` or `allowed_fallback` must be recorded only as non-binding candidates
   - they must not be treated as confirmed values, implicit decisions, implementation instructions, or mock-ready defaults before the required approval exists
8. Use one normalized missing-information field system rather than two parallel vocabularies.
   - if the template supports both naming styles, choose one canonical set and use it consistently
9. Preserve stable IDs and cross references across both artifacts.
   - reuse upstream stable refs from `state-candidates.yaml`
   - assign stable IDs for new entities such as `state_id`, `trigger_id`, and `missing_info_id`
   - ensure every confirmed state, trigger, difference, and missing-information item can be traced back to candidate and evidence references
10. Validate semantic exclusivity before handoff.
   - a confirmed state must not depend on an unresolved missing-information item unless that dependency is explicitly modeled and kept non-confirmed
   - a missing-information item must identify which surface, state, trigger, or relation it blocks

## Record in state-spec

- surfaces
- confirmed states
- triggers
- evidence refs
- confidence
- differences from base
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
- blocked surface/state/trigger/relation refs
- severity
- blocking

## Handoff

Continue to [step-06-human-review-and-reviewed-spec.md](step-06-human-review-and-reviewed-spec.md) only after all of these are true:

- both YAML files exist under `{project-root}/figma-yaml/{session_id}/artifacts/`
- both YAML files record the same current `spec_revision_id`
- stable IDs and upstream cross references are present and non-dangling
- confirmed outputs and missing-information items are semantically distinct rather than duplicated
- no `recommended_default` or `allowed_fallback` item has been silently promoted into confirmed state-spec
- blocking and material missing-information items remain explicit for later review
- the handoff does not imply a reviewed path when unresolved material evidence gaps still exist
