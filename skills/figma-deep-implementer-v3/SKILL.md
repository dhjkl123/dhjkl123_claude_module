---
name: figma-deep-implementer-v3
description: Evidence-first Figma state modeling from a section, flow, or related frame set. Use when Codex must collect frame inventory, design context, screenshots, prototype connections, generate state-spec.yaml and missing-information.yaml, route human review, and optionally generate draft or reviewed mocks according to the active output mode.
---

# Figma Deep Implementer V3

Convert a Figma section, flow, or related frame set into a reviewable state model, then finish with the artifacts required by the active output mode.

## Language rule

All user-facing communication must be written in Korean.

This includes:

- chat responses
- approval questions
- review summaries
- user-facing descriptive fields written into YAML artifacts

Do not silently switch artifact prose or review labels to another language unless the user explicitly requests it.

Natural-language descriptive fields must be written in Korean.
Fixed enums, status tokens, IDs, and file names may remain in English when they are part of the workflow contract.

## Entry gate

Before starting the workflow, confirm these entry conditions:

1. Identify the Figma target as one of:
   - file key + section node id
   - file key + one or more frame node ids
   - file key + flow starting frame node id
   - a related frame set that the user explicitly scoped
2. Choose an output mode:
   - `spec-only`
   - `spec+draft-mock`
   - `spec+reviewed-mock`
   - `spec+implementation-plan`
3. Use the fixed artifact root `{project-root}/figma-yaml/{session_id}/`.
4. If the user did not specify an output mode, default to `spec-only`.
5. If the target scope is ambiguous, narrow it before continuing.

If the user enters through a flow starting frame, you may follow explicit prototype connections only within the scoped flow. Do not automatically expand into unrelated flows or ambiguous cross-links.

In this skill, `{project-root}` means the repository root that contains this skill and its workflow files.
In this skill, `{session_id}` means the run-specific namespace for one review session. Do not reuse an existing session directory unless the user is explicitly resuming that same session.

After the entry conditions are satisfied, start with [workflows/step-01-entry-and-scope.md](workflows/step-01-entry-and-scope.md).

## Output modes

- `spec-only`: Produce spec artifacts only. Do not generate any mock artifact.
- `spec+draft-mock`: Produce spec artifacts and at least one draft mock artifact.
- `spec+reviewed-mock`: Produce spec artifacts and at least one reviewed mock artifact. This mode requires a reviewed spec, no unresolved blocking review items, and no unresolved material evidence gaps.
- `spec+implementation-plan`: Produce spec artifacts and the standard implementation plan artifact `plans/implementation-plan.yaml`. Do not generate any mock artifact in this mode.

## Workflow rule

- Follow the step files in order.
- Always finish the workflow with the artifacts required by the active output mode.
- Do not generate mock artifacts in modes that do not allow them.
- Do not skip directly to mock generation unless the reviewed spec already exists or the active mode explicitly allows draft mock generation.
- Treat `reviewed-spec.yaml` as a valid shortcut only when it is the current approved spec for the current `spec_revision_id`. If the spec changes, the prior reviewed spec must no longer qualify as a shortcut.
- A reviewed path requires both of these invariants:
  - no unresolved blocking review items
  - no unresolved material evidence gaps
- If a reviewed mock approval fails, do not finish as reviewed. Record the rejection, then either:
  - downgrade the candidate output back to draft status, or
  - return to spec revision before generating another reviewed mock candidate
- If a required checkpoint is rejected and no allowed downgrade path exists for the active mode, stop in `blocked-awaiting-user` and mark the mode as incomplete.
- In `spec+reviewed-mock` mode, a downgrade to draft status does not satisfy the mode contract. Record the run as `mode_incomplete` until a reviewed mock artifact is approved or the user changes the mode.
- Let each step file hand off to the next one.

## Template rule

- Do not embed large YAML examples inside the step files.
- Use the templates under `templates/`.
- When a step requires a YAML artifact, copy the matching template structure and fill it with session-specific values.
- Keep stable IDs and cross references consistent across all generated YAML files.

## Mock fidelity rule

- Always aim for the highest-fidelity mock supported by the available evidence.
- Treat missing data as a declared constraint, not as permission to lower overall quality.
- If some evidence is missing, identify exactly which mock regions, interactions, assets, or state transitions cannot be fully resolved.
- Keep resolved regions at the highest fidelity possible even when some other regions remain unresolved.
- Limit fallback handling only to unresolved parts.

## Approval rule for evidence gaps

If a known evidence gap materially affects a user-facing interpretation, an implementation plan, or a mock output:

1. explain which data is missing
2. explain why it is missing or still unresolved
3. explain which artifact, state, transition, or mock region cannot be fully determined because of that gap
4. explain what fallback representation or placeholder behavior will be used
5. ask the user whether to continue

Pure evidence collection and transcription may continue without approval. Approval is required before the workflow turns unresolved evidence into a user-facing interpretation, implementation plan, fallback decision, or mock output.

If the user has not approved continuation, stop in a `blocked-awaiting-user` state.

Use batched approvals when several evidence gaps affect the same step or output. Reuse a prior approval if the affected scope and fallback behavior have not changed. Ask again only when the affected scope or fallback behavior changes, or when a newly discovered gap materially changes the risk profile.

Do not silently continue past known evidence gaps that materially affect a user-facing interpretation, the implementation plan, or the mock.

## Terms and review criteria

- `reviewed spec`: A reviewed version of the state spec that has explicit human approval, no unresolved blocking review items, and no unresolved material evidence gaps.
- `blocking review item`: A review issue that prevents progression to the next gated step until it is resolved or explicitly waived by the user.
- `waived`: A review decision that records an explicit user waiver for a specific checkpoint item. A waived blocking review item no longer blocks progression, but a waived material evidence gap still cannot produce a reviewed mock artifact.
- `draft mock artifact`: A user-reviewable mock artifact that may still contain declared unresolved evidence gaps.
- `reviewed mock artifact`: A user-reviewable mock artifact generated only from a reviewed spec with no unresolved blocking review items and no unresolved material evidence gaps.
- `mock artifact`: A visual mock output file intended for user review, such as an image, HTML artifact, or equivalent renderable output referenced by the workflow artifacts.
- `related frame set`: A user-scoped set of related frames connected by the same section, flow, or explicit prototype relationship. If the set mixes unrelated flows or ambiguous transitions, narrow the scope before continuing.
- `related frame set input`: A reproducible scoped input recorded as one or more frame node ids, a section anchor, or an explicit prototype relationship basis.
- `material evidence gap`: Missing evidence that directly affects one or more of these fidelity dimensions:
  - layout fidelity
  - content fidelity
  - asset fidelity
  - interaction or state fidelity
- `review log`: The YAML record that stores checkpoint decisions as `approved`, `rejected`, or `waived`, together with scope, affected artifacts, `spec_revision_id`, `final_status`, `achieved_mode`, and any blocking reason.
- `blocked-awaiting-user`: A workflow run status that means execution must pause until the user provides a decision. This is a runtime status, not a review-log decision value.
- `final_status`: A run-level terminal status recorded in `artifacts/review-log.yaml`. Allowed values are `completed`, `mode_incomplete`, and `blocked`.
- `achieved_mode`: The mode actually achieved by the run, recorded in `artifacts/review-log.yaml`.
- `blocking_reason`: A run-level field recorded in `artifacts/review-log.yaml` when `final_status` is not `completed`, for example `blocked-awaiting-user`.
- `spec_revision_id`: The revision identifier that binds `artifacts/state-spec.yaml`, `artifacts/reviewed-spec.yaml`, and `artifacts/review-log.yaml` to the same current spec revision.

## Human review checkpoints

| Checkpoint | `spec-only` | `spec+draft-mock` | `spec+reviewed-mock` | `spec+implementation-plan` |
|---|---|---|---|---|
| scope confirmation | required | required | required | required |
| reviewed spec confirmation | optional | optional | required | optional |
| evidence-gap approval | conditional | conditional | conditional | conditional |
| reviewed mock approval | disallowed | disallowed | required | disallowed |

Checkpoint decisions must be persisted in the review log.

Checkpoint applicability note:

- in `spec+reviewed-mock`, evidence-gap approval is allowed only while the run is in a draft path or repair path. It is not allowed as a way to complete reviewed status with unresolved material evidence gaps.

Required checkpoint rejection handling:

- scope confirmation rejected: narrow scope and re-enter the current step
- reviewed spec confirmation rejected: return to spec revision
- evidence-gap approval rejected: stop in `blocked-awaiting-user`
- reviewed mock approval rejected: downgrade to draft or return to spec revision

## Output location rule

All workflow artifacts must be written under `{project-root}/figma-yaml/{session_id}/`.

Required subpaths:

- `artifacts/`
- `mocks/` when the active mode allows mock artifacts
- `plans/` when `spec+implementation-plan` mode is active

If the directory does not exist, create it before writing YAML outputs.

## Artifact matrix

| Artifact | `spec-only` | `spec+draft-mock` | `spec+reviewed-mock` | `spec+implementation-plan` |
|---|---|---|---|---|
| `artifacts/session-scope.yaml` | required | required | required | required |
| `artifacts/frame-inventory.yaml` | required | required | required | required |
| `artifacts/frame-evidence.yaml` | required | required | required | required |
| `artifacts/state-candidates.yaml` | required | required | required | required |
| `artifacts/state-spec.yaml` | required | required | required | required |
| `artifacts/missing-information.yaml` | required | required | required | required |
| `artifacts/review-log.yaml` | required | required | required | required |
| `artifacts/reviewed-spec.yaml` | optional | optional | required | optional |
| `artifacts/mock-manifest.yaml` | disallowed | required | required | disallowed |
| `artifacts/validation-report.yaml` | optional | optional | optional | optional |
| `mocks/` draft mock artifact | disallowed | required | optional | disallowed |
| `mocks/` reviewed mock artifact | disallowed | disallowed | required | disallowed |
| `plans/implementation-plan.yaml` | disallowed | disallowed | disallowed | required |

Optional artifact triggers:

- `artifacts/reviewed-spec.yaml`: create when a reviewed spec is explicitly approved, and mark it `superseded` or `invalidated` if later spec revision makes it no longer current. Its `spec_revision_id` must match the current `artifacts/state-spec.yaml` and `artifacts/review-log.yaml` to qualify as a shortcut
- `artifacts/validation-report.yaml`: create when the workflow performs an explicit validation pass
- `mocks/` draft mock artifact in `spec+reviewed-mock`: create only when a draft candidate is needed before a reviewed mock is approved. Before approval, record the candidate as `draft`, not `reviewed`.

Mock coverage rule:

- `spec+draft-mock` and `spec+reviewed-mock` must cover either all in-scope review-target states or a documented representative subset with explicit omissions recorded in the review log or manifest

Run completion rule:

- persist a run-level `final_status` in `artifacts/review-log.yaml`
- persist the `achieved_mode` in `artifacts/review-log.yaml`
- persist the current `spec_revision_id` in `artifacts/review-log.yaml`
- if the requested mode is not fully satisfied, set `final_status` to `mode_incomplete` and record the `blocking_reason`
- if the run is paused pending user input, set `final_status` to `blocked` and record `blocking_reason: blocked-awaiting-user`

Session persistence rule:

- all artifacts for one execution session must stay inside the same `{session_id}` directory
- starting a new session must not overwrite artifacts from a prior session
- resuming an existing session may reuse its directory only when the user explicitly continues that session

Mock artifact file contract:

- every mock artifact must be referenced from `artifacts/mock-manifest.yaml`
- use stable file names that distinguish status, such as `draft-*` and `reviewed-*`
- approval-candidate mock outputs must be recorded as `draft` until reviewed approval is explicitly granted
- supported mock outputs may be image, HTML, or equivalent renderable files, but the manifest must remain the source of truth

## Guardrails

- Do not confirm a state from frame naming alone.
- Do not infer interaction triggers from screenshots alone.
- Do not merge confirmed outputs and missing-information into one file.
- Do not treat missing data as justification for a globally low-quality mock.
- Do not reduce fidelity in resolved regions just because some unresolved regions remain.
- Do not generate a reviewed mock while blocking review items remain unresolved.
- Do not present a mock with unresolved evidence gaps as fully confirmed or fully reviewed.
