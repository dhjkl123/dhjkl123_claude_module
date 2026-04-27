# Step 06: Human Review And Reviewed Spec

## Goal

Apply human review decisions, persist the checkpoint outcome, and create a reviewed-spec only when the current spec revision is explicitly approved and free of unresolved reviewed-path blockers.

## Do

1. Present:
   - `artifacts/state-spec.yaml`
   - `artifacts/missing-information.yaml`
2. Resolve reviewer decisions as an explicit checkpoint outcome rather than free-form commentary.
   - persist checkpoint decisions in `artifacts/review-log.yaml`
   - use checkpoint decision values from `approved`, `rejected`, or `waived`
   - record the reviewed `spec_revision_id`, affected artifacts, and run-level fields required by the review log contract
3. Treat reviewed-spec confirmation as mode-sensitive:
   - in `spec+reviewed-mock`, reviewed-spec confirmation is required before any reviewed mock path can continue
   - in `spec-only`, `spec+draft-mock`, and `spec+implementation-plan`, reviewed-spec confirmation is optional and must not be treated as a mandatory gate unless the user explicitly asks for that reviewed-spec path
4. Create `artifacts/reviewed-spec.yaml` from [../templates/reviewed-spec.template.yaml](../templates/reviewed-spec.template.yaml) only when all of these are true:
   - the human review decision is explicitly approved
   - the approved artifact targets the current `spec_revision_id`
   - no unresolved blocking review items remain
   - no unresolved material evidence gaps remain for the reviewed path
5. When `artifacts/reviewed-spec.yaml` is created:
   - record the current `spec_revision_id`
   - record the review run identity and overall decision
   - preserve links back to:
   - original state entries
   - reviewer decisions
   - unresolved blockers
6. Do not treat artifact existence alone as reviewed validity.
   - a reviewed-spec is a valid shortcut only when it is approved and its `spec_revision_id` matches the current spec revision
   - if a later spec revision changes the current spec, mark any older reviewed-spec as `superseded` or `invalidated` rather than leaving it silently reusable
7. If reviewed-spec confirmation is rejected, return to spec revision rather than continuing the reviewed path.
8. Keep reviewed-spec confirmation distinct from reviewed-mock approval.
   - this step governs human review of the spec artifacts
   - reviewed mock approval is a later checkpoint and must not be collapsed into this step

## Review gate

- If unresolved blocking review items remain, do not create a valid reviewed-spec for the reviewed path.
- If unresolved material evidence gaps remain, do not create a valid reviewed-spec for the reviewed path.
- If the user only wants `spec-only`, the workflow may stop after the required spec artifacts are complete; step-06 is optional unless the user explicitly requests reviewed-spec confirmation.
- If this step is entered in `spec-only`, it must not be interpreted as forcing reviewed-spec confirmation.

## Review Log

Persist review decisions in `artifacts/review-log.yaml`, including at least:

- checkpoint decision values using `approved`, `rejected`, or `waived`
- the current `spec_revision_id`
- `final_status`
- `achieved_mode`
- `blocking_reason` when not completed
- the relationship between the checkpoint outcome and the reviewed-spec validity for the current revision

## Stop And Return

- if reviewed-spec confirmation is rejected, return to spec revision
- if the run is paused pending user input, record `final_status: blocked` with `blocking_reason: blocked-awaiting-user`
- if the requested mode cannot be fully satisfied after review outcomes are applied, record `final_status: mode_incomplete`

## Handoff

Continue to [step-07-mock-generation.md](step-07-mock-generation.md) only when all of these are true:

- the chosen mode requires mock generation
- the path being used is not blocked by unresolved blocking review items
- the path being used is not blocked by unresolved material evidence gaps
- if the mode requires a reviewed-spec path, the reviewed-spec is explicitly approved and current for the same `spec_revision_id`
- reviewed-spec confirmation and reviewed-mock approval are still treated as separate checkpoints
