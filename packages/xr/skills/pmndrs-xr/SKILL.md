---
name: pmndrs-xr
description: Use @pmndrs/xr to turn a plain three.js app into a VR/AR (WebXR) experience — session setup, default controllers/hands/gaze with pointer interactions, custom inputs, origin and teleport, controller locomotion, AR hit test and anchors, and layers. Use for vanilla three.js; in React Three Fiber, use @react-three/xr. For draggable objects or gizmos, also see the pmndrs-handle skill.
---

# @pmndrs/xr

## Setup

```ts
import { createXRStore, XROrigin } from '@pmndrs/xr'

renderer.xr.enabled = true
const origin = new XROrigin(camera) // the camera becomes a child of the origin
scene.add(origin)

const store = createXRStore(canvas, scene, () => camera, renderer.xr, {
  /* inputs and session features */
})
enterButton.addEventListener('click', () => store.enterVR())

let prevTime: number | undefined
renderer.setAnimationLoop((time, frame) => {
  store.update(frame, prevTime == null ? 0 : time - prevTime) // delta in milliseconds
  prevTime = time
  renderer.render(scene, camera)
})
// on teardown: store.destroy()
```

- The camera argument is a getter function. `store.update` must run every frame before rendering; it also delivers mouse/touch events, because the store forwards them from the canvas into the scene as pointer events by default. Pass `htmlInput: false` when you call @pmndrs/pointer-events' `forwardHtmlEvents` yourself, otherwise every screen event fires twice.
- `enterVR`/`enterAR`/`enterXR(mode)` must run inside a user gesture handler. End a session with `store.getState().session?.end()`; `store.onSessionEnd(...)` catches every end, including the user removing the headset. Read state with `store.getState()` / `store.subscribe` (`session`, `mode`, `detectedPlanes`, `detectedMeshes`, `domOverlayRoot`, ...).
- WebXR requires `https` except on `localhost`. On `localhost` without WebXR support, an emulated Meta Quest 3 (IWER) is injected with an overlay UI; Cmd/Win+Alt+E injects it anywhere; `emulate: false` disables it (e.g. when a test harness installs its own runtime). `offerSession` (on by default) lets browsers such as the Quest browser show their own "enter" UI.
- Session features (`hitTest`, `anchors`, `planeDetection`, `meshDetection`, `layers`, `domOverlay`, `handTracking`, `depthSensing`, `bodyTracking`) are store options: `true` requests them optionally, `'required'` makes the session fail without them. Check the `XRStoreOptions` type before inventing options.

## Interactions and inputs

Controllers, hands, transient pointers (Vision Pro gaze + pinch, phone taps), gaze, and screen input are added by default as children of the origin, and emit @pmndrs/pointer-events events on scene objects: `mesh.addEventListener('click', ...)` works for every input. Pointer types are `ray`, `grab` (controller squeeze, hand pinch), `touch` (fingertip), and `teleport`; filter per object with `object.pointerEventsType = { deny: 'grab' }`. See the pmndrs-pointer-events skill for hit rules, pointer capture, and missed events.

Configure the defaults through the options (`controller: { rayPointer: { rayModel: { color: 'red' } }, grabPointer: false, teleportPointer: true }`, `hand`, `transientPointer`, `gaze`, `screenInput`; `controller`/`hand`/`transientPointer` also take `{ left, right, default }`) or change them at runtime with `store.setController(...)` and siblings. A custom implementation is a function `(store, object, state, session) => cleanup` that builds its content under `object`; tracked-space helpers (`XRSpace`, `XRControllerModel`, `XRHandModel`, `PointerRayModel`, `PointerCursorModel`) can only be constructed inside such a function and throw elsewhere. Raw WebXR events: `bindXRInputSourceEvent(session, inputSource | 'all', 'select', handler)`.

## Moving the user

The headset owns the camera during a session; move the `XROrigin` (the user's feet) instead of the camera. Teleport: enable `teleportPointer: true` on `controller`/`hand`, then `makeTeleportTarget(floor, camera, (point) => origin.position.copy(point))`; it marks only the descendants that exist at that time, and those objects receive only teleport events. Thumbstick locomotion: `const updateLocomotion = createXRControllerLocomotionUpdate()` and call `updateLocomotion(origin, store, camera, deltaSeconds)` each frame — this one expects seconds, unlike `store.update`.

## AR and rendering features

- **Hit test**: `createXRHitTestSource(store, session, 'viewer' | xrSpace | staticObject, trackableTypes)` and each frame `frame.getHitTestResults(source.source)` with `source.getWorldMatrix(matrix, result)`; cancel the source when done. `requestXRHitTest(store, relativeTo)` is a one-shot that awaits the next frame.
- **Anchors**: `requestXRAnchor(store, { relativeTo: 'world' | 'space' | 'hit-test-result', ... })`; place content each frame from `frame.getPose(anchor.anchorSpace, store.getState().originReferenceSpace)` combined with the origin's world matrix.
- **Planes/meshes**: `store.getState().detectedPlanes`/`detectedMeshes`; `XRPlaneModel`/`XRMeshModel` build the geometry, positioning is up to you.
- **DOM overlay** (handheld AR only): append HTML to `store.getState().domOverlayRoot`. In headsets, put UI into the scene.
- **Layers**: `new XRLayer(store, renderer, { src: videoOrImage })` displays media through the WebXR Layers API at higher quality than a texture, with a mesh fallback; call `destroy()` when removing it.

Further guides (written for React, concepts apply): https://pmndrs.github.io/xr/docs/getting-started/introduction
