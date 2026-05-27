# XR Validation

Use live browser/XR validation for XR work. State counters alone are not enough.

## Vitexec/IWER Path

- When starting from an empty workspace, create a small end-to-end path before adding depth: session entry, one visible world target, one in-scene UI panel, one real spatial input, and a recorded `vitexec/play` walkthrough. Expand the use case only after that path builds and runs.
- Install IWER at the start of the snippet.
- Use `xrDevice.installRuntime({ globalObject: globalThis, polyfillLayers: true })` when recent Three.js WebXR manager builds need `XRWebGLBinding`.
- Enter the app through the normal session path.
- Grant offered sessions only if no session is already active.
- Wait for `activeSession`.
- Do not read `XRSession.mode`; it is not part of the standard WebXR TypeScript surface. Log the intended mode separately, or assert active session state and app-visible session behavior.
- Move the emulated headset/viewer through the scene.
- Move and orient controllers/hands from that viewer pose according to the real interaction metaphor. For gun games, align the visible muzzle with the target. For boxing/fitness, move the glove/fist into the pad contact volume.
- For handles/editors/configurators, hold controller trigger/select while moving or rotating the controller against the visible handle/gizmo or grabbable object. Log before/after transforms for the manipulated object and assert position/rotation/scale deltas.
- For AR placement/commerce, place from a reticle or surface affordance, then rotate/scale/swap a variant through user-facing controls. Log before/after placement transforms or variant values and assert they changed.
- For simulations, drive the system from visible controls or spatial input long enough to show motion/progression. Log before/after state such as position, orientation, velocity, waypoint progress, telemetry, warning, or completion.
- Drive input with direct controller APIs such as `controllers.right.position`, `controllers.right.quaternion`, and `updateButtonValue("trigger", ...)`.
- Prefer direct IWER APIs over `remote.dispatch`.
- Aim emulated controllers with their local `-Z` ray toward the target unless a specific model/tool defines a different forward axis.
- If a controller ray misses a thin handle, fix the scene affordance or pose math. Add a visible larger hit surface around the handle instead of validating through hidden state mutation.
- If the app uses uikit, expose a read-only scene audit global from a small React Three Fiber component: `window.__pmndrsXrEval = { scene, camera, gl }`. Use `useThree()` for those values. Do not expose reducers, workflow helpers, or mutation functions through this object.
- Before clicking the session-entry button in vitexec, wait for the R3F/XR scene to be mounted. For apps exposing the audit global, wait until `window.__pmndrsXrEval?.scene` and `window.__pmndrsXrEval?.gl` exist.

## Required Proof

Log milestones that prove:

- Active XR session, for example `milestone:xr-session` with `activeSession: true`.
- Viewer/headset movement, for example `milestone:viewer-move` with station names and positions.
- Controller/select input.
- Manipulation milestones when relevant, for example `milestone:drag`, `milestone:rotate`, `milestone:snap`, or `milestone:transform`, with before/after transform values. Snap/alignment proof can be its own milestone or a clearly asserted field on a drag/transform milestone, such as `snappedMount` or `alignmentError`.
- Placement or simulation milestones when relevant, for example `milestone:placement`, `milestone:variant`, `milestone:waypoint`, `milestone:telemetry`, or `milestone:warning`, with before/after values.
- Key task/game/configuration milestones.
- Final result.

## View Composition

Before key selections, log `milestone:view-check` with:

- Station/target name.
- Elapsed milliseconds.
- Viewer position.
- Target position.
- Distance in meters.
- Target-in-frame boolean.
- Projected screen center/bounds or coverage.
- Optional `uiCoverage` or `worldCoverage` estimate when a panel/HUD is present.

Use plausible standing headset heights around `1.45-1.8m` for adult-scale scenes and keep interaction targets roughly `1.1-3.5m` away unless the use case requires close inspection.

Assert that the active world target remains visible, not only that a UI panel is visible. A passing camera pose should leave room for the object being configured, punched, piloted, taught, or inspected. Avoid ending a segment with the headset pointed at an empty wall, a blank AR background, or a full-screen panel.

## UI Coverage Audit

For uikit apps, expect the harness to sample uikit root elements through `window.__pmndrsXrEval` during the actual vitexec walkthrough. It projects those roots into the headset camera and fails when UI covers more than about 30% of the view for about 40% or more of sampled play time.

This is a runtime visibility check, not a source-shape check. Keep persistent status UI compact or peripheral, and when a large menu or report must be inspected, move or turn back to the active world target afterward so the recording proves both the UI and the experience.

The audit measures the projected footprint of each uikit root. A root that wraps many stacked rows can fail even when each button is small; collapse optional controls, split transient panels from persistent status, or move the root farther to the side so the world object remains visible.

## Visual Evidence

- Record the full walkthrough when possible.
- For reviewable XR recordings, set `VITEXEC_RECORD_WIDTH=1280` and `VITEXEC_RECORD_HEIGHT=720` or larger. Playwright's default recording size is 800x450, which can make dense in-scene UI and thin WebGL geometry look like broken rendering after VP8/WebM capture.
- Pace showcase flows so each major stage is visible and total duration is usually at least 20 seconds.
- Set the vitexec timeout with generous headroom above the expected recording length. For recorded XR walkthroughs, prefer at least 120-180 seconds unless the flow is truly tiny; browser startup, XR setup, frame pacing, and video capture vary between runs.
- Extract frames at view-check timestamps when the harness supports it.
- Sample the actual recording or screenshots for visual usefulness: reject mostly white, flat single-color, blank-center, and nearly static recordings. A grey AR clear color, wall, sky, or empty background is still a blank failure even when it is not white.
- Use the uikit scene coverage audit, not image heuristics, to catch UI that hides the world for too much of the run. If the audit finds uikit roots but cannot project bounds, treat that as an audit failure to fix, not zero coverage.
- If canvas pixel readback is unreliable in XR, use screenshots/recordings plus explicit XR/session/state milestones.
- If an extracted WebM frame shows speckled or dropped pixels, take a screenshot at the same pose/time. If the screenshot is clean, fix the recording path or size before changing scene shaders/materials.

## Integrity Rules

- Keep validation globals read-only for assertions and projection data.
- Do not rely on stale screenshots or WebMs already present in the app tree. A passing run must create fresh artifacts during the current walkthrough.
- Do not expose or call helpers such as `selectStation`, `completeStep`, `setProgress`, or reducer dispatches from `vitexec` to advance workflow state.
- If input misses, fix implementation, geometry, event handling, readiness, or pose timing instead of weakening assertions.
- If view projection math marks an obviously centered target as out of frame, check camera-space sign conventions before changing the scenario.
- For timed or sequenced experiences, make app timing compatible with the recorded walkthrough pace. View checks, visible controller movement, and readable station transitions should not cause targets or cues to expire before the proof can interact with them.
- Avoid side effects inside React state updater functions; StrictMode may invoke them more than once. Put wave/task transitions, scoring side effects, and report completion in explicit event handlers or effects with guards.
- Wait for explicit scene/XR readiness before clicking the session-entry button. Entering before the XR tree/store has connected can create unstable sessions or wrong-mode recordings.
- Make session-entry handlers idempotent. Ignore/catch duplicate `enterVR`/`enterAR` calls and avoid logging an `active XRSession already exists` page error when a walkthrough retries or the user double-clicks.
- File snippets should use top-level `await run()` or direct top-level awaits so recordings do not end before milestones happen.
- If a project wraps `vitexec`, the wrapper should fail on missing required milestones and browser/page error lines.
