# Spatial Interactions

## Match The Input To The Experience

- Do not default every XR experience to a controller laser pointer.
- UI panels, menus, inspection checklists, and configurators may use ray/pointer selection because the user is selecting controls at a distance.
- Boxing, fitness, grabbing, sorting, and repair tasks should use near interaction: hand/controller pose, glove or tool models, grab/touch pointers, collision volumes, or distance/contact checks.
- Shooting games should attach a visible blaster/gun/tool to the controller and fire from the muzzle. Use the weapon transform for raycasts/projectiles, and show recoil, tracers, muzzle flashes, or projectile travel.
- Vehicle, drone, machinery, and process simulations should expose domain controls and telemetry. Drive them through controller/hand input, handles, or spatial waypoints, and show visible motion or state progression over time.
- Commerce and AR placement should use surface reticles, hit-test/plane/anchor affordances, footprints, snap/fit indicators, and variant/material controls instead of a detached preview-only model.
- Validation should prove the same metaphor the user sees. For boxing, move the glove/fist into the pad. For shooting, aim the gun model and fire from the muzzle. Avoid tests that only move an invisible pointer.
- For controller-mounted tools, keep the active tool/muzzle ref tied to the in-headset object, not a desktop fallback. Before deriving a world-space ray from a moving XR-space child, force world matrices current with `updateWorldMatrix` or an equivalent scene update.
- For controller selection rays, prefer `XRFrame.getPose(inputSource.targetRaySpace, referenceSpace)` when available. Rendered controller or grip objects may be oriented for visuals and can point a different direction than the WebXR target ray; use them as a fallback, not the primary source of truth.

## Pointer Events

- R3F pointer events work across screen, ray, grab, touch, and gaze pointers.
- Prefer `onPointerDown` or `onPointerUp` for XR selection-critical targets. `onClick` alone can be unreliable with emulated controller select pulses.
- Avoid binding both pointerdown and click to the same non-idempotent action; trigger pulses can produce both.
- For larger hit areas, use transparent or visible active geometry. Hidden meshes can be unreliable raycast targets.

## Sequential Flows

- Completed/locked panels should visibly remain complete but stop receiving ray hits when they sit in front of later targets.
- Keep active panels and targets in clear line of sight from intended headset poses.
- If a visible object can receive the ray before the intended hitbox, attach the same handler to that user-facing geometry or move the target.
- For games with timed, popping, moving, or cooldown targets, derive selectable state from actual visible/active state in the frame loop. Validation should wait for a target face that is truly raised/visible before aiming, and assertions should require hits to increase, not merely shots.
- Thin discs and tiny faces are easy for controller rays to slip past. Give important game targets visible hit depth or a generous production hit plate that matches the intended affordance.

## Handles And Editors

- Use `@react-three/handle` for editor-style move, rotate, scale, orbit, and map interactions.
- Components to check include `Handle`, `HandleTarget`, `TransformHandles`, `PivotHandles`, `OrbitHandles`, and `MapHandles`.
- A handles/editor experience should expose visible manipulation affordances, not only indirect panel buttons. Users should be able to point/select a gizmo or grabbable object, hold input, move the controller, and see an object translate, rotate, scale, orbit, or snap.
- Configurators, robot teaching tools, assembly benches, and layout editors should prove at least one controller-driven drag/translate and one controller-driven rotate/orientation edit when those operations are part of the task.
- Validate handles by recording before/after object transforms and asserting real deltas. Avoid passing tests that only click "move" or "rotate" buttons without moving a spatial handle or object.
- Use the handle library's mode names exactly: `translate`, `rotate`, and `scale`. Do not invent aliases like `move`.
- Check the installed `@react-three/handle` `.d.ts` files before passing handle props. For example, common handle visibility props are `disabled`/`hidden`; do not assume an `enabled` prop exists.
- Rotation rings, tiny torus handles, and small swatches are easy to miss with emulated controller rays. Add visible, generous hit plates or grabbable surfaces that match the user-facing affordance, and attach the same handler/ref to that surface.
- Guard desktop camera controls during immersive sessions.

## XR Select Bridges

- In complex editor/control-panel flows, if R3F pointer events from emulated XR select are unreliable, add a production-quality XR `select` bridge.
- `useXRInputSourceEvent(inputSource, "selectstart", handler, deps)` is a valid React Three XR controller-trigger path for direct actions such as firing a controller-held tool or confirming a held object interaction.
- `useXRControllerButtonEvent(controller, "xr-standard-trigger", handler)` is also valid for tool-like trigger input such as blasters, sprayers, scanners, or machinery controls.
- The bridge should raycast from WebXR `targetRaySpace` to the same visible in-scene hit plates and dispatch the same user-facing control actions.
- Keep it tied to real XR input and visible targets. Do not mutate workflow state directly from validation scripts.
- Avoid double-counting actions when a custom XR select bridge and mesh `onPointerDown`/desktop fallback both point at the same state transition. In immersive sessions, route controller select through one path and keep desktop pointer handlers gated to non-XR fallback.
