# WebXR

Use IWER with `vitexec` for WebXR tests.

Docs:

- https://meta-quest.github.io/immersive-web-emulation-runtime/getting-started.html
- https://meta-quest.github.io/immersive-web-emulation-runtime/action.html

Do not fake XR outcomes by mutating app state. Install IWER, enter the XR session through the app's normal path, move the emulated headset/controllers/hands, press/select like a user, then inspect app state.

State access is for understanding and assertions, not bypassing interaction.

Use a published IWER package version. Registry checks during eval work found `iwer@2.2.1` available and `iwer@1.9.x` unavailable.

## Pass Criteria

- XR apps must prove the XR path. Desktop or laptop fallback checks can be extra, but they are not sufficient.
- Immersive VR/non-handheld AR UI must be visible inside the WebXR scene. DOM panels, `@react-three/drei` `<Html>`, and `XRDomOverlay` are not acceptable proof for in-headset checklists/status/reports; use `@react-three/uikit`, `@pmndrs/uikit`, or equivalent 3D UI meshes.
- Install IWER at the start of the snippet, before waiting for the app to settle. Then trigger the app's normal XR entry control, grant the offered session only if no session is already active, wait for `activeSession`, and log it.
- For React Three XR apps, wait for an explicit app-provided scene/XR readiness flag after the `<Canvas>` and `<XR store={store}>` tree have rendered before calling `enterVR()`/`enterAR()`. A DOM canvas alone is not enough; early session entry can fail with "not connected to three.js."
- Drive input through emulated headset/controller/hand actions. Do not call app callbacks, reducers, or setters to advance milestones.
- Keep app globals read-only for validation: expose state, station metadata, and projection helpers, but do not expose or call workflow-advancing helpers from `vitexec`. If controller selection misses, fix hit geometry, ray pose, readiness, or event handling instead of mutating app state directly.
- Move the emulated headset/viewer through the scene before selections in recorded walkthroughs. The recording should show a trainee approaching or standing in front of each target, not a fixed viewer with a controller jumping around.
- Keep the viewer transform readable: use plausible standing headset height, keep interaction targets at comfortable inspection distance, and leave surrounding context visible in the frame.
- Log explicit milestones such as `milestone:xr-session {"activeSession":true}` and `milestone:controller-select ...`.
- Log viewer movement milestones such as `milestone:viewer-move {"station":"...", "position":[x,y,z]}`.
- Log `milestone:view-check` at key stations with elapsed time, viewer position, target position, distance in meters, target-in-frame status, and projected screen bounds/coverage. Fail the walkthrough if a target is too close, clipped, or outside the frame.
- When `vitexec` is wrapped in a package script, assert required milestone lines and fail on `^[error]` or `^[page error]` log lines; do not rely only on the CLI exit code for injected-script failures.
- If a project needs a hard CI-style proof, pipe vitexec output through a tiny wrapper that checks for required milestone text, rejects browser/page errors, and verifies the expected recording or screenshot exists. Some versions of vitexec report injected snippet failures in the browser log while still exiting 0.
- In file-based `vitexec` snippets, keep the module alive with top-level `await run()` or direct top-level awaits. Do not call `run().catch(...)` without awaiting it; the module import can resolve early and stop recording after only startup logs.
- Keep screenshots or recordings for visual evidence, but do not treat visuals alone as interaction proof.
- For checklist or panel workflows, include view-checks for the in-scene UI panel itself, not only for world objects. The recording should show the headset looking at the XR-rendered panel and controller/select input reaching its controls.

## Shape

```sh
vitexec --gpu ./vitexec/webxr-test.ts
```

```ts
import { XRDevice, metaQuest3 } from "iwer";

const xrDevice = new XRDevice(metaQuest3);
xrDevice.installRuntime();
console.log("milestone:iwer-installed", JSON.stringify({ hasNavigatorXR: Boolean(navigator.xr) }));

// Trigger the app's normal "Enter VR" path.
await window.xrPrecisionThrow.store.enterVR();
if (!xrDevice.activeSession && xrDevice.sessionOffered) xrDevice.grantOfferedSession();
await new Promise((resolve, reject) => {
  const started = performance.now();
  const tick = () => {
    if (xrDevice.activeSession) return resolve(undefined);
    if (performance.now() - started > 5000) return reject(new Error("XR session did not become active"));
    requestAnimationFrame(tick);
  };
  tick();
});
console.log("milestone:xr-session", JSON.stringify({ activeSession: Boolean(xrDevice.activeSession) }));

// Act through IWER.
xrDevice.controllers.right?.position.set(0, 1.25, -0.85);
xrDevice.controllers.right?.updateButtonValue("trigger", 1);
for (let i = 0; i < 8; i += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
xrDevice.controllers.right?.updateButtonValue("trigger", 0);
console.log("milestone:controller-select", JSON.stringify({ hand: "right", button: "trigger" }));

// Assert through app state.
console.log("xr", JSON.stringify({
  active: Boolean(xrDevice.activeSession),
  status: window.xrPrecisionThrow.getStatus()
}));
```

Useful IWER controls:

- Headset: `xrDevice.position`, `xrDevice.quaternion`, `xrDevice.recenter()`.
- Controllers: `position`, `quaternion`, `updateButtonValue()`, `updateAxes()`.
- Use IWER's public device/controller controls consistently for pose, aim, and select; log enough milestones to diagnose missed selections from the walkthrough output.
- Hands/platform: `primaryInputMode`, hand pinch APIs, visibility state.

Use `--record` or `--screenshot` only when visual timing or rendering matters. For XR/WebGL recordings that will be reviewed visually, set `VITEXEC_RECORD_WIDTH=1280` and `VITEXEC_RECORD_HEIGHT=720` or larger so Playwright does not fall back to its default 800x450 WebM capture.
With recent Three.js WebXR manager builds, IWER may need `xrDevice.installRuntime({ globalObject: globalThis, polyfillLayers: true })` so `XRWebGLBinding` exists before session setup. If entering XR throws `Cannot read properties of undefined (reading 'prototype')` from `WebXRManager.setSession`, enable the layers polyfill.

## Stable XR Targeting

- Prefer selecting clear, user-facing XR affordances with a reliable line of sight from the emulated controller. Raised controls are usually easier to validate than floor-level details.
- Aim at the center of the same target a headset user would select; do not advance state through private app APIs when a ray selection misses.
- In ordered flows, ensure completed or disabled spatial panels stop receiving pointer/raycast hits if they sit between the user and later targets. A visible completed panel that still intercepts rays can make the XR path fail even when desktop clicks work.
- Keep the recorded path representative: move the headset/controller through plausible poses instead of jumping directly between final states.
- Before each interaction, place the headset at a plausible standing position near the target and orient it toward the station; then position the controller relative to that viewer pose.
- Avoid placing the headset right against the target. For adult-scale scenes, default to about 1.45-1.8m headset height and about 1.1-3.5m target distance, then adjust only when the use case needs close inspection.
- Verify composition before selecting: project target markers or bounding boxes through the active camera, assert the projected center is inside the screen with margin, and log projected bounds or coverage. This catches videos where the controller succeeds but the recording is unreadable.
- After entering XR, wait for the canvas, several rendered frames, and any ray-pointer/controller state the app exposes before selecting scene targets.
- After moving or aiming a controller, wait several animation frames before pressing trigger/select so ray intersections and hover state settle.
- Hold trigger/select down for multiple frames; a one-frame pulse may be too short for app-level pointer/select handlers.
- Avoid binding both `pointerdown` and `click` to the same selection mutation unless it is idempotent; a controller trigger can produce both.
- If direct canvas pixel readback is unreliable in XR, use vitexec screenshot/recording artifacts as visual evidence and pair them with explicit XR/session/state milestones.
- If the wrapper can post-process video, extract frames at `view-check` elapsed times and keep them as review artifacts.
- For dense in-scene UI, thin geometry, or text-heavy panels, compare a screenshot or extracted frame at the same view-check time if the recording looks noisy. A clean screenshot with a noisy WebM frame points at the browser video capture/encode path, not the XR shader.
