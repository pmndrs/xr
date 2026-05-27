---
name: pmndrs-xr
description: Build, modify, debug, or validate XR, AR, VR, spatial interaction, pointer, controller, hand-tracking, hit-test, teleportation, layer, anchor, uikit, and handle-based React Three Fiber apps using @react-three/xr, @react-three/handle, and @react-three/uikit. Use when working on immersive WebXR experiences, R3F-to-XR conversions, XR games, spatial tools, or XR validation/test harnesses.
---

# PMNDRS XR

Use this skill for WebXR experiences built with React Three Fiber and the React Three XR/uikit/handle packages.

## Core Workflow

1. Inspect the app structure and package manager before editing.
2. If the workspace is empty, scaffold a minimal runnable vertical slice first: package scripts, `src/main`, `src/App`, styles, and `vitexec/play`. Get that slice building before expanding the scene.
3. Use the React Three Fiber architecture: `@react-three/xr` plus `<Canvas>` and `<XR store={store}>`.
4. Enter AR/VR from a real user gesture such as a DOM button calling `store.enterAR()` or `store.enterVR()`.
5. Put immersive status, score, checklist, report, and controls inside the 3D/WebXR scene. DOM is acceptable for the initial session-entry button and optional desktop fallback, not as headset UI.
6. Build interactions through real spatial input: pointer events when appropriate, documented handle components, controller/hand pose, near interaction, controller select events, hit-test, or anchors.
7. For editor/configurator/assembly tasks, use visible handles/gizmos or grabbable affordances and prove drag/translate/rotate/snap behavior through object transform changes.
8. Validate with a live XR walkthrough when the task is an XR experience. The passing path should enter an emulated XR session, move the headset/viewer, aim controllers, interact with visible in-scene targets, record video, and assert view composition.

## Reference Routing

Read the smallest relevant reference first:

- Architecture and package choice: [references/architecture.md](references/architecture.md)
- In-scene UI and visual quality: [references/ui-and-visual-quality.md](references/ui-and-visual-quality.md)
- Domain fit for games, training, simulation, commerce, and tools: [references/use-case-patterns.md](references/use-case-patterns.md)
- Spatial interaction patterns: [references/interactions.md](references/interactions.md)
- XR validation with vitexec/IWER: [references/validation.md](references/validation.md)
- Dependency/version pitfalls: [references/dependencies.md](references/dependencies.md)

Generated upstream docs are also bundled:

- Getting started: `references/docs/getting-started/introduction.md`
- Store/session options: `references/docs/tutorials/store.md`
- Interactions: `references/docs/tutorials/interactions.md`
- Origin/teleport: `references/docs/tutorials/origin.md`, `references/docs/tutorials/teleport.md`
- AR features: `references/docs/tutorials/anchors.md`, `dom-overlay.md`, `hit-test.md`, `object-detection.md`
- Handles: `references/docs/handles/introduction.md`
- Full index: `references/index.md`

If unsure which page applies, search references:

```bash
rg -n "createXRStore|TeleportTarget|XRHitTest|pointerEventsType|XROrigin|DefaultXRController|Handle|uikit" path/to/skill/references
```

## Quality Bar

- Build the actual experience as the first screen, not a landing page.
- For complex XR apps, avoid long up-front design or broad `node_modules` archaeology. Read only the specific bundled reference needed for the immediate API choice, then implement and validate the smallest real path before adding polish.
- Avoid placeholder-cube demos. Use domain-specific environment context, recognizable objects, lighting/material variation, spatial affordances, and visible feedback.
- Keep desktop fallback useful, but do not let it become the proof for XR behavior.
- Do not weaken validation to pass. If controller input misses, fix target geometry, ray pose, readiness, occlusion, or event handling.
- Use patch/file-edit operations for generated JSX/TS/HTML/vitexec files. Do not use shell heredocs for code files.

## Before Finishing

Confirm the result has:

- `createXRStore` and user-facing session entry.
- `<XR store={store}>` around scene content.
- In-scene XR UI for immersive status/score/report/controls.
- Real pointer/controller/handle/hit-test interaction, not validation-only state mutation.
- For manipulation tasks, before/after transform assertions for dragged, grabbed, rotated, scaled, or snapped objects.
- A build plus browser/XR validation covering the main path.
- Recording or screenshots plus logs proving active XR, controller input, viewer movement, and readable target composition.
