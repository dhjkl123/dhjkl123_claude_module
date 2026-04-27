# Step 07: Mock Generation

## Goal

Generate mock artifacts only in mock-enabled modes, using the current spec revision and the correct draft or reviewed path.

## Preconditions

1. Read the active output mode from the current session artifacts.
2. Run this step only when the active mode is one of:
   - `spec+draft-mock`
   - `spec+reviewed-mock`
3. If the active mode is:
   - `spec-only`
   - `spec+implementation-plan`
   stop this step without creating `artifacts/mock-manifest.yaml` or any mock artifact.
4. Keep all artifact writes inside the current session root:
   - `{project-root}/figma-yaml/{session_id}/artifacts/`
   - `{project-root}/figma-yaml/{session_id}/mocks/`
5. Reads from the current session artifacts must stay inside the current session root.
6. Reads from skill assets needed by this step, including `templates/` and workflow files, are allowed outside the session root.
7. Do not reuse artifacts from another session directory unless the user explicitly resumed that same session.

## Do

1. If `artifacts/mock-manifest.yaml` does not exist for the current session, create it from [../templates/mock-manifest.template.yaml](../templates/mock-manifest.template.yaml).
2. If `artifacts/mock-manifest.yaml` already exists for the current session, reuse and update it instead of recreating it from the template.
3. Treat `artifacts/mock-manifest.yaml` as the source of truth for every mock artifact in this session.
4. Do not overwrite the current-session manifest with a fresh template copy after mock candidates, approvals, rejections, or same-session retries have already been recorded.
5. Do not write any file under `mocks/` unless the artifact is also recorded in `artifacts/mock-manifest.yaml`.
6. For every manifest entry and mock artifact, record at minimum:
   - artifact status
   - artifact path
   - source spec reference
   - `spec_revision_id`
   - covered state ids
   - unresolved assumptions
7. If the mock set covers only a representative subset of in-scope review-target states, record explicit omissions in the manifest or review log, including:
   - omitted state ids
   - omission reason

## Draft Path

1. In `spec+draft-mock`, use the current `artifacts/state-spec.yaml` as the required source spec.
2. If `artifacts/reviewed-spec.yaml` exists, use it only as additional provenance unless it is also the current approved reviewed spec for the current `spec_revision_id`.
3. A draft mock may contain declared unresolved evidence gaps only when the required evidence-gap approval already covers the same affected scope and fallback behavior.
4. If a known evidence gap materially affects the mock output and no valid approval covers it:
   - explain the missing data
   - explain why it is missing or unresolved
   - explain which mock region, interaction, asset, or transition cannot be fully determined
   - explain the fallback representation or placeholder behavior
   - ask the user whether to continue
5. If the user does not approve continuation for a material mock-affecting evidence gap:
   - stop in `blocked-awaiting-user`
   - record `final_status: blocked`
   - record `blocking_reason: blocked-awaiting-user`
   - do not continue to the next step
6. Use stable draft file names such as `draft-*`.
7. Record every draft candidate in the manifest with draft status.

## Reviewed Path

1. In `spec+reviewed-mock`, read `artifacts/reviewed-spec.yaml` only if it is the current approved reviewed spec for the current `spec_revision_id`.
2. Before generating a reviewed candidate, confirm all of the following:
   - `artifacts/reviewed-spec.yaml` is present and current
   - its `spec_revision_id` matches the current `artifacts/state-spec.yaml`
   - its `spec_revision_id` matches the current `artifacts/review-log.yaml`
   - no unresolved blocking review items remain
   - there are no unresolved material evidence gaps
3. If any reviewed-path precondition fails, do not emit a reviewed mock.
4. Generate reviewed candidates from the current approved reviewed spec, not from raw candidates.
5. Until explicit reviewed mock approval is granted, record the candidate in the manifest as draft status, using a stable draft file name such as `draft-*`.
6. Ask for the reviewed mock approval checkpoint before promoting any candidate to reviewed status.
7. Only after explicit approval:
   - promote the manifest entry from draft to reviewed
   - use or rename to a stable reviewed file name such as `reviewed-*`
   - record the reviewed mock approval decision in `artifacts/review-log.yaml`
8. If reviewed mock approval is rejected:
   - record the rejection in `artifacts/review-log.yaml`
   - either downgrade the candidate output back to draft status
   - or return to spec revision before generating another reviewed candidate
9. In `spec+reviewed-mock`, a downgraded draft does not satisfy the requested mode. Record the run as `mode_incomplete` until a reviewed mock is approved or the user changes the mode.

## Review Log Updates

1. Persist every checkpoint decision related to mock generation in `artifacts/review-log.yaml`.
2. Keep the current `spec_revision_id` aligned across:
   - `artifacts/state-spec.yaml`
   - `artifacts/review-log.yaml`
   - `artifacts/mock-manifest.yaml`
3. Require `artifacts/reviewed-spec.yaml` to match the current `spec_revision_id` only when this step uses it as the current approved reviewed spec for the reviewed path.
4. A `reviewed-spec.yaml` that exists only as superseded or invalidated history does not need to match the current `spec_revision_id`.
5. When this step pauses for user input, record:
   - `final_status: blocked`
   - the current `achieved_mode`
   - the current `spec_revision_id`
   - `blocking_reason: blocked-awaiting-user`
6. When the requested mock mode is not yet satisfied, record:
   - `final_status: mode_incomplete`
   - the current `achieved_mode`
   - the current `spec_revision_id`
   - the relevant `blocking_reason`
7. Do not mark the run as completed reviewed output until reviewed mock approval is explicitly granted.

## Guardrail

- Do not generate any mock artifact in a mode that disallows mocks.
- Do not generate a reviewed mock unless the current approved reviewed spec matches the current `spec_revision_id`.
- If unresolved blocking review items remain, do not emit a reviewed mock.
- If unresolved material evidence gaps remain, do not emit a reviewed mock.
- Do not treat a draft candidate as reviewed before the reviewed mock approval checkpoint is explicitly approved.
- Do not create mock files that are missing from `artifacts/mock-manifest.yaml`.

## Handoff

1. If this step is blocked awaiting user input, stop here.
2. If the active mode is `spec+reviewed-mock` and reviewed mock approval is still pending or rejected, stop here after updating the review log.
3. Continue to [step-08-validation.md](step-08-validation.md) only after the currently allowed mock artifacts are generated, recorded in the manifest, and any required approval gate for this step has been resolved.
