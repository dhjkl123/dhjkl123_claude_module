# Step 04: State Candidates

## Goal

Normalize frames into surfaces and derive candidate states before confirmation, without collapsing unresolved evidence into confirmed interpretation.

## Do

1. Read `artifacts/frame-inventory.yaml` and `artifacts/frame-evidence.yaml`.
2. Create `artifacts/state-candidates.yaml` from [../templates/state-candidates.template.yaml](../templates/state-candidates.template.yaml) under `{project-root}/figma-yaml/{session_id}/artifacts/`.
   - create this artifact in all modes
   - if no candidates are found, still create the file and record that the result is empty rather than leaving the step implicit
3. Reuse stable upstream references from prior artifacts.
   - reuse `scope_id`, `frame_id`, `node_id`, and stable evidence references from `frame-inventory.yaml` and `frame-evidence.yaml`
   - do not replace upstream references with label-only or name-only links
4. Cluster frames into surfaces using explicit evidence first.
   - keep evidence, inference, and missing information structurally separate
   - if clustering cannot be supported with sufficient evidence, keep the surface relationship unresolved rather than forcing a surface assignment
5. Separate candidate relations without treating them as confirmed facts:
   - navigation relation candidates
   - same-surface state candidates
   - unresolved classification when available evidence is insufficient to choose between them safely
6. Do not let unresolved evidence silently disappear during candidate generation.
   - a candidate may exist while evidence remains insufficient
   - low confidence must not substitute for explicit missing-information tracking
   - if unresolved evidence would affect downstream interpretation, flag the candidate as approval-required before that downstream use occurs
7. For each surface, record its review completeness state, such as:
   - `reviewed`
   - `no-candidate`
   - `not-a-state`
   - `missing-info`
8. For each candidate, persist stable candidate structure, including at least:
   - `candidate_id`
   - `surface_id`
   - `base_frame_id`
   - `state_frame_id` when a state frame exists
   - `candidate_type`
   - `classification_status`, such as `hypothesized`, `evidence-backed`, `blocked`, or `unresolved`
   - `confidence`
   - `supporting_evidence_refs`
   - `conflicting_evidence_refs`
   - `inventory_ref`
   - `evidence_ref`
   - `inference_note`
   - `missing_info_refs`
   - `approval_required` when unresolved evidence would block safe downstream interpretation
9. Keep candidate evidence and missing information distinct.
   - do not store unresolved evidence only as reduced confidence
   - do not store blocked validation only as alternative prose
   - preserve explicit missing-information and blocker fields alongside the candidate
10. Record alternative interpretations in structured form rather than free-form fallback prose.
   - include fields such as `alternative_type`, `why_not_primary`, and `required_evidence_to_resolve`
11. If the available evidence is insufficient to classify a relation safely, keep it as `unresolved classification` instead of forcing `navigation` or `same-surface`.

## Do not do

- do not promote a candidate directly to confirmed state-spec in this step
- do not rely on frame naming alone
- do not treat `candidate_type`, `confidence`, or clustering output as reviewed or confirmed state
- do not let step-04 candidates flow into implementation planning, fallback behavior, or mock generation without the approvals required by unresolved evidence
- do not erase missing information by replacing it with low-confidence candidate text

## Handoff

Continue to [step-05-state-spec-and-missing-information.md](step-05-state-spec-and-missing-information.md) only after all of these are true:

- `artifacts/state-candidates.yaml` exists under `{project-root}/figma-yaml/{session_id}/artifacts/`
- empty results, if any, are explicitly recorded rather than implied
- every candidate has stable IDs and upstream inventory/evidence cross references
- candidate evidence, inference notes, missing information, and blockers remain structurally distinct
- unresolved evidence has not been silently converted into only `confidence` or free-form prose
- candidates that would require approval for safe downstream interpretation are marked `approval_required`
- insufficiently evidenced relations remain `unresolved classification` instead of being forced into `navigation` or `same-surface`
- each surface has an explicit completeness or review state
