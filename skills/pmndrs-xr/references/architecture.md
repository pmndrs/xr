# Architecture

# Architecture

- Import `XR` and `createXRStore` from `@react-three/xr`.
- Create the store once, outside React render loops where practical.
- Enter AR/VR from a real user gesture: `store.enterAR()` or `store.enterVR()`.
- Render scene content inside `<XR store={store}>`.
- Configure default controllers, hands, gaze, screen input, teleport pointers, and feature flags through `createXRStore` before replacing low-level implementations.
- Check the installed `XRStoreOptions` types before adding store options. In current `@react-three/xr`/`@pmndrs/xr`, fields such as `originReferenceSpace` and raw `optionalFeatures` are not valid store options; use the typed feature/session-init options such as `hitTest`, `planeDetection`, `anchors`, `domOverlay`, or `customSessionInit` when they exist.
- For apps validated with a vitexec-installed IWER runtime, set `createXRStore({ emulate: false, offerSession: false, ... })` unless you intentionally need the package's localhost emulator. Do not let an app auto-offer a session while the walkthrough is also requesting/granting one.
- Do not use deprecated `XRButton`, `ARButton`, `VRButton`, `Interactive`, `RayGrab`, `Controllers`, or `Hands` for new work unless the task is explicitly migration/compatibility.
- Guard non-XR camera controls during immersive sessions. WebXR owns the camera transform.

## AR

- Use hit-test, anchors, planes, or meshes according to the requested real-world behavior.
- `XRDomOverlay` is only appropriate for handheld AR that explicitly targets DOM overlay.
- For immersive VR or non-handheld AR, use in-scene UI instead of DOM overlays.

## Existing Apps

- Inspect package versions before adding dependencies.
- Follow local build tooling and source layout.
- Keep desktop/non-XR interaction functional unless the user asks for XR-only.
