# Step 07: Mock Generation

## Goal

Generate high-fidelity interactive web mock artifacts only in mock-enabled modes, using the current spec revision and the correct draft or reviewed path.

## Preconditions

1. Read the active output mode from the current session artifacts.
2. Run this step only when the active mode is one of:
   - `spec+draft-mock`
   - `spec+reviewed-mock`
3. If the active mode is `spec-only`, stop this step without creating `artifacts/mock-manifest.yaml` or any mock artifact.
4. Keep all artifact writes inside the current session root:
   - `{project-root}/figma-yaml/{session_id}/artifacts/`
   - `{project-root}/figma-yaml/{session_id}/mocks/`
5. Reads from the current session artifacts must stay inside the current session root.
6. Reads from skill assets needed by this step, including `templates/` and workflow files, are allowed outside the session root.
7. Do not reuse artifacts from another session directory unless the user explicitly resumed that same session.

## Web mock contract

1. The default mock artifact is a renderable web page implemented with HTML, CSS, and JavaScript.
2. The generated web mock must prioritize:
   - layout fidelity
   - typography fidelity
   - color and asset fidelity
   - explicit prototype-backed interaction fidelity
3. Encode only evidenced interactions as confirmed behavior.
   - do not invent navigation, modal, drawer, hover, or animation behavior unless it is explicitly evidenced or explicitly approved as fallback
4. Treat screenshots as visual evidence only.
   - screenshots may guide spacing, color, and visual composition
   - screenshots alone must not confirm a trigger or state transition
5. If viewport behavior is not evidenced, record the mock as viewport-specific in the manifest.
6. Use a fixed implementation layout for every web mock artifact:
   - `mocks/<mock_id>/index.html` as the required entry file
   - `mocks/<mock_id>/styles.css` for styling
   - `mocks/<mock_id>/app.js` for interaction logic
   - `mocks/<mock_id>/assets/` for exported or copied assets used by the mock
7. Treat the fixed implementation layout as the default contract unless the user explicitly requests a different structure.
8. Prefer a single-entry interactive mock per `mock_id`.
   - model same-surface state changes inside the same entry using JavaScript state toggles or equivalent in-page state switching
   - model evidenced navigation transitions inside the same mock package, unless the scoped evidence requires multiple entry pages

## Do

1. If `artifacts/mock-manifest.yaml` does not exist for the current session, create it from [../templates/mock-manifest.template.yaml](../templates/mock-manifest.template.yaml).
2. If `artifacts/mock-manifest.yaml` already exists for the current session, reuse and update it instead of recreating it from the template.
3. Treat `artifacts/mock-manifest.yaml` as the source of truth for every mock artifact in this session.
4. Do not overwrite the current-session manifest with a fresh template copy after mock candidates, approvals, rejections, or same-session retries have already been recorded.
5. Do not write any file under `mocks/` unless the artifact is also recorded in `artifacts/mock-manifest.yaml`.
6. For every manifest entry and mock artifact, record at minimum:
   - artifact status
   - artifact type
   - artifact path
   - entry path
   - file role such as `entry`, `style`, `logic`, or `asset`
   - per-file source type
   - source spec reference
   - `spec_revision_id`
   - viewport-specific status when applicable
   - rendered state ids
   - unresolved assumptions
7. If the mock set covers only a representative subset of in-scope review-target states, record explicit omissions in the manifest or review log, including:
   - omitted state ids
   - omission reason
8. Before writing the mock files, decide and persist the implementation package boundary for the current `mock_id`.
   - default to one package directory per `mock_id`
   - do not scatter one mock across unrelated session paths
9. For every major visible region and text style used in the final mock, record an explicit source-to-implementation mapping.
   - map source Figma node ids, layout references, fill references, and text style references to final HTML regions, CSS selectors, and final CSS values
   - do not use a final CSS value in a reviewed-path output unless it is traceable to source evidence or an approved fallback
10. When an approved fallback is used:
   - record the affected source region or property
   - record why the source value could not be resolved
   - record the exact fallback value used
   - record the approval trace that allowed the fallback
11. If a visible asset reference is required for fidelity in the mock:
   - export or otherwise resolve the concrete asset file before treating the region as reviewed-complete
   - place the resolved file under `mocks/<mock_id>/assets/`
   - record the concrete asset usage in the manifest rather than leaving the region represented by a placeholder
12. Translate geometry references into implementation geometry as faithfully as possible.
   - when the source evidence provides exact coordinates and dimensions that define the visible layout, preserve that geometry in the implementation
   - do not replace precise source positioning with a looser layout system if that changes the rendered placement, spacing, or alignment
13. Translate source effect references into CSS-visible effects when those effects materially affect the rendered result.
   - if a source shadow, blur, or other visible effect is evidenced, apply an equivalent CSS effect or mark the region unresolved
14. If prototype evidence is absent for an interaction:
   - do not add reviewed-path transition details from convention or guesswork
   - in reviewed outputs, either exclude the interaction from the reviewed scope or keep it explicitly unresolved
   - only draft-path fallbacks may use approved placeholder interaction behavior

## Draft Path

1. In `spec+draft-mock`, use the current `artifacts/state-spec.yaml` as the required source spec.
   - approval-derived draft-path interpretations may be used only when their approval refs and unresolved dependency refs are still present in the current `artifacts/state-spec.yaml` and `artifacts/missing-information.yaml`
2. Set the manifest `spec_source.source_type` to `state-spec` for draft outputs, unless a current reviewed spec is intentionally used as extra provenance.
   - each draft file entry must also record `source_type: state-spec`
3. Build the mock as an interactive web artifact, not as a static screenshot export.
   - use `index.html` as the single required entry point for the draft package unless scoped evidence requires multiple entries
   - place all CSS needed by the package in `styles.css`
   - place all interaction logic needed by the package in `app.js`
   - place exported assets under `assets/`
4. A draft mock may contain declared unresolved evidence gaps only when the required evidence-gap approval already covers the same affected scope and fallback behavior.
5. If a known evidence gap materially affects the mock output and no valid approval covers it:
   - explain the missing data
   - explain why it is missing or unresolved
   - explain which mock region, interaction, asset, or transition cannot be fully determined
   - explain the fallback representation or placeholder behavior
   - ask the user whether to continue
6. If the user does not approve continuation for a material mock-affecting evidence gap:
   - stop in `blocked-awaiting-user`
   - record `final_status: blocked`
   - record `blocking_reason: blocked-awaiting-user`
   - do not continue to the next step
7. Use stable draft file names such as `draft-*`.
8. Record every draft candidate in the manifest with draft status.

## Reviewed Path

1. In `spec+reviewed-mock`, read `artifacts/reviewed-spec.yaml` only if it is the current approved reviewed spec for the current `spec_revision_id`.
2. Set the manifest `spec_source.source_type` to `reviewed-spec` for reviewed-path candidates.
   - each reviewed-path file entry must also record `source_type: reviewed-spec` until an approved reviewed artifact supersedes the draft candidate for the same revision
3. Before generating a reviewed candidate, confirm all of the following:
   - `artifacts/reviewed-spec.yaml` is present and current
   - its `spec_revision_id` matches the current `artifacts/state-spec.yaml`
   - its `spec_revision_id` matches the current `artifacts/review-log.yaml`
   - no unresolved blocking review items remain
   - there are no unresolved material evidence gaps
   - no reviewed-path state or trigger still depends on approval-derived unresolved dependency refs
4. If any reviewed-path precondition fails, do not emit a reviewed mock.
5. Generate reviewed candidates from the current approved reviewed spec, not from raw candidates.
   - keep the same package layout contract of `index.html`, `styles.css`, `app.js`, and `assets/` unless the user explicitly approved another structure
6. Until explicit reviewed mock approval is granted, record the candidate in the manifest as draft status, using a stable draft file name such as `draft-*`.
7. Ask for the reviewed mock approval checkpoint before promoting any candidate to reviewed status.
8. Only after explicit approval:
   - promote the manifest entry from draft to reviewed
   - use or rename to a stable reviewed file name such as `reviewed-*`
   - record the reviewed mock approval decision in `artifacts/review-log.yaml`
9. If reviewed mock approval is rejected:
   - record the rejection in `artifacts/review-log.yaml`
   - either downgrade the candidate output back to draft status
   - or return to spec revision before generating another reviewed candidate
10. In `spec+reviewed-mock`, a downgraded draft does not satisfy the requested mode. Record the run as `mode_incomplete` until a reviewed mock is approved or the user changes the mode.

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
7. If Step 08 will not be performed, this step must still write the terminal run-level fields for the current outcome, but only for paths that do not require validation to satisfy their completion contract.
   - set `final_status: completed` only when the active mode's artifact contract is already satisfied at the end of this step
   - otherwise keep `blocked` or `mode_incomplete` as appropriate
8. Do not mark the run as completed reviewed output until reviewed mock approval is explicitly granted.
9. In `spec+reviewed-mock`, do not close the run as completed from this step alone.
   - reviewed-path completion requires Step 08 validation
   - until Step 08 finishes, keep the run as `mode_incomplete` unless it is blocked awaiting user input

## Guardrail

- Do not generate any mock artifact in a mode that disallows mocks.
- Do not generate a reviewed mock unless the current approved reviewed spec matches the current `spec_revision_id`.
- If unresolved blocking review items remain, do not emit a reviewed mock.
- If unresolved material evidence gaps remain, do not emit a reviewed mock.
- Do not treat a draft candidate as reviewed before the reviewed mock approval checkpoint is explicitly approved.
- Do not create mock files that are missing from `artifacts/mock-manifest.yaml`.
- Do not let speculative micro-interactions override explicit prototype evidence.

## Handoff

1. If this step is blocked awaiting user input, stop here.
2. If the active mode is `spec+reviewed-mock` and reviewed mock approval is still pending or rejected, stop here after updating the review log.
3. If the active mode is `spec+reviewed-mock`, do not skip Step 08.
4. If Step 08 is skipped for a non-reviewed path, stop here only after terminal run-level fields have been written to `artifacts/review-log.yaml`.
5. Continue to [step-08-validation.md](step-08-validation.md) only after the currently allowed mock artifacts are generated, recorded in the manifest, and any required approval gate for this step has been resolved.
