# Step 08: Validation

## Goal

Verify that the current session artifacts are structurally consistent, mode-complete, and ready for final status recording.

## Preconditions

1. This step is required for `spec+reviewed-mock`.
2. This step is optional for `spec-only` and `spec+draft-mock`.
3. Create `artifacts/validation-report.yaml` only when this validation step is actually performed.
4. If this step is skipped in an optional path, do not create `artifacts/validation-report.yaml` only for the sake of completion.
5. Keep all reads and writes inside the current session root, except reading the required template under `templates/`.

## Do

1. Create `artifacts/validation-report.yaml` from [../templates/validation-report.template.yaml](../templates/validation-report.template.yaml).
2. Validate cross references among the current session artifact YAML files.
3. Validate mode-conditional artifact presence and disallowed artifact absence for the active output mode, including:
   - `artifacts/reviewed-spec.yaml`
   - `artifacts/mock-manifest.yaml`
   - draft mock artifacts
   - reviewed mock artifacts
4. Validate current `spec_revision_id` consistency across the relevant current-session artifacts, including:
   - `artifacts/state-spec.yaml`
   - `artifacts/review-log.yaml`
   - `artifacts/reviewed-spec.yaml` when used as the current approved reviewed spec
   - `artifacts/mock-manifest.yaml` when mock artifacts are present
   - ensure the current canonical revision is not left as `pending` once `artifacts/state-spec.yaml` exists
5. Validate reviewed-spec currentness when the reviewed path is in use.
   - `artifacts/reviewed-spec.yaml` must describe only the canonical current reviewed revision for the session
   - any prior reviewed revision lifecycle changes such as `superseded` or `invalidated` must be recorded in `artifacts/review-log.yaml`
6. Confirm reviewed mocks point back to reviewed spec entries only when a reviewed-status mock artifact or reviewed-status mock-manifest entry exists in the current session.
7. When the active mode includes mocks, validate:
   - mock-manifest references for every mock artifact
   - draft versus reviewed status consistency
   - stable mock file naming
   - interactive web artifact presence
   - per-file source type and viewport-specific metadata when applicable
   - full in-scope coverage or a documented representative subset
   - explicit omission records when only a representative subset is covered
8. When the reviewed path is in use or a reviewed-status mock artifact exists, validate both of these reviewed-path invariants:
   - no unresolved blocking review items remain
   - no unresolved material evidence gaps remain
   - no reviewed-path state or trigger still carries approval-derived unresolved dependency refs
9. Before marking an output as reviewed, compare the final artifact against the source Figma evidence and verify at minimum:
   - viewport size
   - font family
   - font sizes
   - text content
   - primary colors
   - border radii
   - key region dimensions
   - major spacing values
   - icon and asset fidelity
   - prototype-backed interactions
   - concrete export or resolution of visible required assets
   - faithful translation of material layout geometry
   - faithful translation of material visual effects such as shadows
10. If any mismatch affects a major visible region or brand-defining style, do not mark the artifact as reviewed.
11. Record all mismatches in `artifacts/validation-report.yaml`.
12. Treat the following as reviewed-blocking mismatches unless the reviewed scope explicitly excludes the affected region:
   - required visible assets are still placeholders or unresolved references
   - exact source geometry was replaced with a visibly different layout strategy
   - evidenced material effects were omitted
   - interaction transitions were added without explicit prototype evidence
13. Record in `artifacts/validation-report.yaml`:
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
6. If the run is paused pending user input, `final_status: blocked` takes priority over `mode_incomplete`.
7. Set `final_status: blocked` when the run is paused pending user input.
8. After a previously blocked decision is resolved, set `final_status: mode_incomplete` when the requested mode is still not fully satisfied and the run is no longer blocked awaiting user input, including cases where:
   - a required artifact is missing
   - a disallowed artifact is present
   - validation still reports remaining blockers
   - `spec+reviewed-mock` has only a draft candidate or a rejected reviewed candidate
9. Set `final_status: completed` only when the active mode's required artifacts are present, disallowed artifacts are absent, no remaining blockers prevent completion, and the reviewed-path invariants hold whenever the reviewed path is in use.
10. Do not mark the run as completed reviewed output unless the reviewed mock approval checkpoint has already been explicitly approved.

## End state

1. `spec-only`:
   - close as completed only when the required spec artifacts are present
   - do not treat reviewed-spec checks as mandatory unless a reviewed spec artifact is actually part of the current session output
2. `spec+draft-mock`:
   - close as completed only when the required spec artifacts, `artifacts/mock-manifest.yaml`, and at least one draft interactive web mock artifact are present
   - if mock coverage is incomplete without documented omissions, close as `mode_incomplete`
3. `spec+reviewed-mock`:
   - close as completed only when the required spec artifacts, `artifacts/reviewed-spec.yaml`, `artifacts/mock-manifest.yaml`, and at least one approved reviewed interactive web mock artifact are present
   - close as completed only when no unresolved blocking review items remain and no unresolved material evidence gaps remain
   - if only a draft candidate exists, or reviewed approval was rejected without a later approved reviewed mock, close as `mode_incomplete`

This is the final workflow step.
