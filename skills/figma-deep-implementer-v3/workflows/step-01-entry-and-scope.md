# Step 01: Entry And Scope

## Goal

Lock the entry type, temporary scope, output mode, session path, and run-tracking state before reading frames.

## Do

1. Identify the target as exactly one of these entry types:
   - `file key + section node id`
   - `file key + one or more frame node ids`
   - `file key + flow starting frame node id`
   - `file key + explicit related frame set`
2. Reject ambiguous entry typing. Do not coerce a flow-start entry into a generic frame list, and do not collapse a section or related frame set into a generic `root_node_id`.
3. Resolve the fixed artifact output root as `{project-root}/figma-yaml/{session_id}/`.
4. Validate session policy before creating or reusing the directory:
   - a new run must use a new `session_id`
   - an existing `{session_id}` directory may be reused only when the user explicitly resumes that same session
   - do not overwrite artifacts from another session
5. Create required subpaths under the same session root before writing YAML artifacts:
   - `artifacts/`
   - `mocks/` only when the selected mode allows mock artifacts
6. Decide the output mode. If the user did not specify one, default to `spec-only`.
7. Validate that `output_mode` is one of:
   - `spec-only`
   - `spec+draft-mock`
   - `spec+reviewed-mock`
8. Create `artifacts/session-scope.yaml` from [../templates/session-scope.template.yaml](../templates/session-scope.template.yaml).
9. Use the canonical review log at `artifacts/review-log.yaml`.
   - If the file already exists for an explicit same-session resume, reuse that file in place.
   - If the file does not exist for the current session, initialize it from [../templates/review-log.template.yaml](../templates/review-log.template.yaml).
10. Initialize the run binding for `spec_revision_id`.
   - If this is a new run before spec creation, record `spec_revision_id: pending`.
   - If this is an explicit same-session resume, reuse the current session's active `spec_revision_id` only when that resume is valid for the same run context.
   - `pending` is a temporary pre-spec binding only. It must be replaced with a minted revision ID when the first canonical spec snapshot is written for the current session.
11. If this session attempts to rely on an existing `artifacts/reviewed-spec.yaml` as a shortcut, verify before any reuse that its recorded `spec_revision_id` exactly matches the current run's `spec_revision_id`. Otherwise, do not treat it as a valid shortcut.
12. Record in `artifacts/session-scope.yaml`:
   - `scope.scope_id`
   - `scope.file_key`
   - `scope.scope_type`
   - the type-specific scope identifiers such as `section_node_id`, `frame_node_ids`, `flow_start_frame_node_id`, or `explicit_related_frame_basis`
   - `scope.scope_state: temporary`
   - `output.mode`
   - `output.artifact_root`
   - `output.mock_artifact_type: web-html-css-js`
   - `session.session_id`
   - `spec_revision_id`
   - `assumptions`
   - `open_scope_questions`
13. Ask for the required `scope confirmation` human checkpoint before handoff.
14. Persist the checkpoint decision in `artifacts/review-log.yaml`.
   - Use checkpoint decision values only from `approved`, `rejected`, or `waived`.
   - Do not use `blocked` as a checkpoint decision value. `blocked` is a run-level `final_status` only.
15. Persist the run-level fields in `artifacts/review-log.yaml` together with the checkpoint record:
   - `output_mode`
   - `achieved_mode`
   - `spec_revision_id`
   - `final_status`
   - `blocking_reason` when not completed
16. Treat `scope confirmation` as the step completion gate:
   - before confirmation, the scope is temporary and must not be treated as final
   - after explicit confirmation, update `scope.scope_state` to `confirmed` and continue
   - if scope confirmation is rejected, narrow the scope and re-enter the current step instead of treating the rejection as a completed handoff
17. If any `assumption` or `open_scope_question` is already a known material evidence gap, do not allow it to silently flow into a user-facing interpretation, fallback decision, or mock path without the required approval.
   - pure evidence collection and transcription may continue without approval
   - if evidence-gap approval is rejected or still pending, stop in `blocked-awaiting-user`

## Do not continue if

- the Figma target is ambiguous
- the entry type cannot be resolved as one of the four allowed entry modes
- the session would reuse or overwrite artifacts without an explicit same-session resume from the user
- the same session mixes unrelated flows without explicit approval
- scope confirmation has not been explicitly granted
- a known material evidence gap would be carried forward without the required approval

## If blocked

When this step stops in a blocked state, do not leave the run untracked.

1. Persist the current decision state in `artifacts/review-log.yaml`.
2. Set:
   - `final_status: blocked`
   - `achieved_mode` to the highest mode actually achieved so far
   - `blocking_reason`, using `blocked-awaiting-user` when the run is paused for a required user decision
   - the current `spec_revision_id`
3. Keep `artifacts/session-scope.yaml` as the source of the temporary scope snapshot for the blocked run.

## Handoff

Continue to [step-02-frame-inventory.md](step-02-frame-inventory.md) only after all of these are true:

- the entry type is valid and fully recorded
- the artifact root is fixed to `{project-root}/figma-yaml/{session_id}/`
- the session policy is valid
- the selected mode is one of the three allowed modes
- `artifacts/session-scope.yaml` exists
- `artifacts/review-log.yaml` records the `scope confirmation` decision
- the scope is confirmed rather than temporary
- no known material evidence gap is crossing the approval boundary without approval
