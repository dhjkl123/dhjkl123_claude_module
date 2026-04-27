# Step 08: Validation

## Goal

When an explicit validation pass is performed, verify that the current session artifacts are structurally consistent, mode-complete, and ready for final status recording.

## Preconditions

1. Treat this step as an optional validation pass.
2. Create `artifacts/validation-report.yaml` only when this validation step is actually performed.
3. If this step is skipped, do not create `artifacts/validation-report.yaml` only for the sake of completion.
4. Keep all reads and writes inside the current session root, except reading the required template under `templates/`.

## Do

1. If this validation pass is being performed, create `artifacts/validation-report.yaml` from [../templates/validation-report.template.yaml](../templates/validation-report.template.yaml).
2. Validate cross references among the current session artifact YAML files.
3. Validate mode-conditional artifact presence and disallowed artifact absence for the active output mode, including:
   - `artifacts/reviewed-spec.yaml`
   - `artifacts/mock-manifest.yaml`
   - `plans/implementation-plan.yaml`
   - draft mock artifacts
   - reviewed mock artifacts
4. Validate current `spec_revision_id` consistency across the relevant current-session artifacts, including:
   - `artifacts/state-spec.yaml`
   - `artifacts/review-log.yaml`
   - `artifacts/reviewed-spec.yaml` when used as the current approved reviewed spec
   - `artifacts/mock-manifest.yaml` when mock artifacts are present
5. Validate reviewed-spec currentness when the reviewed path is in use, including whether any older reviewed spec is correctly treated as superseded or invalidated rather than current.
6. Confirm reviewed mocks point back to reviewed spec entries only when a reviewed-status mock artifact or reviewed-status mock-manifest entry exists in the current session.
7. When the active mode includes mocks, validate:
   - mock-manifest references for every mock artifact
   - draft versus reviewed status consistency
   - stable mock file naming
   - full in-scope coverage or a documented representative subset
   - explicit omission records when only a representative subset is covered
8. When the reviewed path is in use or a reviewed-status mock artifact exists, validate both of these reviewed-path invariants:
   - no unresolved blocking review items remain
   - no unresolved material evidence gaps remain
9. Record in `artifacts/validation-report.yaml`:
   - passed checks
   - failed checks
   - remaining blockers
   - next recommended action

## Review Log Closure

1. Update `artifacts/review-log.yaml` during this step when validation is performed.
2. Persist the current run-level fields:
   - `final_status`
   - `achieved_mode`
   - `spec_revision_id`
   - `blocking_reason` when `final_status` is not `completed`
3. Determine `achieved_mode` from the highest mode actually achieved so far, not from the requested mode alone.
4. If the requested mode is fully satisfied, `achieved_mode` may match the active output mode.
5. If the requested mode is not fully satisfied or the run is blocked, record the highest mode actually achieved so far. For example:
   - a `spec+reviewed-mock` run with only draft candidates achieved draft-mock level, not reviewed-mock level
   - a `spec+implementation-plan` run without `plans/implementation-plan.yaml` did not achieve implementation-plan level
6. If the run is paused pending user input, `final_status: blocked` takes priority over `mode_incomplete`.
7. Set `final_status: blocked` when the run is paused pending user input.
8. Set `final_status: mode_incomplete` only when the requested mode is not fully satisfied and the run is not blocked awaiting user input, including cases where:
   - a required artifact is missing
   - a disallowed artifact is present
   - validation still reports remaining blockers
   - `spec+reviewed-mock` has only a draft candidate or a rejected reviewed candidate
   - `spec+implementation-plan` is missing `plans/implementation-plan.yaml`
9. Set `final_status: completed` only when the active mode's required artifacts are present, disallowed artifacts are absent, no remaining blockers prevent completion, and the reviewed-path invariants hold whenever the reviewed path is in use.
10. Do not mark the run as completed reviewed output unless the reviewed mock approval checkpoint has already been explicitly approved.

## End state

1. `spec-only`:
   - close as completed only when the required spec artifacts are present
   - do not treat reviewed-spec checks as mandatory unless a reviewed spec artifact is actually part of the current session output
2. `spec+draft-mock`:
   - close as completed only when the required spec artifacts, `artifacts/mock-manifest.yaml`, and at least one draft mock artifact are present
   - if mock coverage is incomplete without documented omissions, close as `mode_incomplete`
3. `spec+reviewed-mock`:
   - close as completed only when the required spec artifacts, `artifacts/reviewed-spec.yaml`, `artifacts/mock-manifest.yaml`, and at least one approved reviewed mock artifact are present
   - close as completed only when no unresolved blocking review items remain and no unresolved material evidence gaps remain
   - if only a draft candidate exists, or reviewed approval was rejected without a later approved reviewed mock, close as `mode_incomplete`
4. `spec+implementation-plan`:
   - close as completed only when the required spec artifacts and `plans/implementation-plan.yaml` are present
   - if the implementation plan artifact is missing, close as `mode_incomplete`

This is the final workflow step when an explicit validation pass is performed.
