---
name: react-three-xr
description: Use @react-three/xr to build or convert React Three Fiber apps into VR/AR (WebXR) experiences — session setup, controller/hand/gaze input and its customization, pointer interactions, moving the user (origin, teleport, thumbstick locomotion), AR features (hit test, anchors, planes, meshes, DOM overlay), layers, and session guards. Use when working on WebXR with R3F; for plain three.js, use @pmndrs/xr. For draggable objects, gizmos, or camera controls, also see the react-three-handle skill.
---

# @react-three/xr

## Setup

```tsx
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'

const store = createXRStore() // module scope or useMemo; options configure inputs and session features

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <Canvas>
        <XR store={store}>
          <Suspense>{/* scene */}</Suspense>
        </XR>
      </Canvas>
    </>
  )
}
```

- `enterVR`/`enterAR`/`enterXR(mode)` must run inside a user gesture handler such as a DOM button's `onClick`, and `<XR>` must already be mounted; otherwise entering fails. Keep `<Suspense>` inside `<XR>` so loading assets never unmount it. End a session with `store.getState().session?.end()`; react to any session end (including the user taking off the headset) with `store.onSessionEnd(...)`.
- WebXR requires `https` (e.g. `@vitejs/plugin-basic-ssl`), except on `localhost`.
- On `localhost` without WebXR support, the store injects an emulated Meta Quest 3 (IWER) with an overlay UI; Cmd/Win+Alt+E injects it anywhere. Disable with `emulate: false`, e.g. when a test harness installs its own emulated runtime. `offerSession` (on by default) lets browsers such as the Quest browser show their own "enter" UI and re-offers after every session end; set it to `false` when sessions are entered programmatically by tests.
- Session features (`hitTest`, `anchors`, `planeDetection`, `meshDetection`, `layers`, `domOverlay`, `handTracking`, `depthSensing`, `bodyTracking`) are options of `createXRStore`: `true` requests them optionally, `'required'` makes the session fail without them. Check the `XRStoreOptions` type before inventing options; for example, the reference space is not an option but follows from `bounded`.
- Session state lives in the store: `useXR((s) => s.session)`, `s.mode` (`'immersive-vr' | 'immersive-ar' | null`), `s.visibilityState`, and so on. `useXRStore()` returns the store inside `<XR>`.

## Interactions

Controllers, hands, transient pointers (Vision Pro gaze + pinch, phone taps), gaze, and screen input are all added by default and emit the regular R3F events, so `onClick`, `onPointerDown`, `onPointerOver`, ... on a mesh work for every input. Each input has several pointers with distinct pointer types: `ray` (pointing at a distance), `grab` (controller squeeze or hand pinch near the object), `touch` (fingertip poke), and `teleport`. Filter them per object with `pointerEventsType`, e.g. `pointerEventsType={{ deny: 'grab' }}` on a button so grabbing near it does not click it. `pointerEventsOrder` lets an overlay win over objects behind it.

- For XR inputs (and screen input under `PointerEvents`), `click` requires `pointerup` on the same object within 300 ms of `pointerdown`; a long trigger hold is not a click. Use `onPointerDown`/`onPointerUp` for press-and-hold actions.
- For drag, rotate, scale, and gizmo interactions use @react-three/handle instead of hand-written capture logic.
- `<Canvas events={noEvents}>` + `<PointerEvents />` replace R3F's screen raycasting with the same pointer-events system that XR inputs use, so `pointerEventsType`, `pointerEventsOrder`, pointer capture, and missed-event behavior are identical on desktop and in XR. @react-three/handle requires it. Its event batching breaks browser APIs that need a user gesture (opening a file input in Safari, playing a video) from a 3D `onClick`; pass `<PointerEvents batchEvents={false} />` when needed.
- Raw WebXR input: `useXRInputSourceEvent(inputSource | 'all', 'select' | 'squeeze' | 'selectstart' | ..., handler, deps)`. Buttons and thumbsticks: `useXRControllerButtonEvent(controller, 'xr-standard-trigger', (state) => ...)`, or read `useXRInputSourceState('controller', 'right')?.gamepad['xr-standard-thumbstick']` inside `useFrame` — gamepad state is updated in place every frame and does not re-render. Controller states appear asynchronously after their layout loads, so they can be `undefined` at first.

## Customizing inputs

Configure the defaults through the store options before replacing them: `createXRStore({ controller: { rayPointer: { rayModel: { color: 'red' } }, grabPointer: false, teleportPointer: true }, hand: { touchPointer: false }, gaze: false })`. `controller`, `hand`, and `transientPointer` also accept `{ left, right, default }`. To replace an input entirely, pass a component (`controller: MyController`); it receives no props, reads its state with `useXRInputSourceStateContext('controller')`, and composes the building blocks: `XRControllerModel`/`XRHandModel`, `DefaultXRInputSourceRayPointer`, `DefaultXRControllerGrabPointer`, `DefaultXRHandTouchPointer`, `DefaultXRInputSourceTeleportPointer`, or the lower-level `useRayPointer`/`useGrabPointer`/`useTouchPointer` with `PointerRayModel`/`PointerCursorModel`. Attach objects to tracked spaces with `<XRSpace space="grip-space">` (a held tool) or `space={state.inputSource.hand.get('index-finger-tip')}`. `XRControllerComponent id="a-button"` renders and reacts to a single button of the controller model. With `secondaryInputSources: true`, tracked but non-primary inputs (controllers lying on the table while hands are used) are added too, with `isPrimary: false`.

Controller and hand models load from a CDN by default; set `baseAssetPath` for offline apps.

## Moving the user

The headset owns the camera during a session: never set the camera transform, move `<XROrigin>` instead (the user's feet; position, rotation, and scale all work, it can sit inside moving objects like a vehicle or roller coaster). Camera controls such as drei's `OrbitControls` fight the headset; wrap them in `<IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>` or use @react-three/handle's `OrbitHandles`/`MapHandles`. Read the head pose with `camera.getWorldPosition(...)` in `useFrame`.

- **Teleport**: enable `teleportPointer: true` for `controller` and/or `hand`, wrap the walkable surface in `<TeleportTarget onTeleport={(point) => setPosition(point)}>`, and feed the position into `<XROrigin position={position} />`. Children of `TeleportTarget` receive only teleport events, so do not nest interactive objects inside it.
- **Thumbstick locomotion**: `useXRControllerLocomotion(originRef)` with `<XROrigin ref={originRef} />`; it only runs while both controllers are present, and defaults to snap turning. It moves the origin object directly, so when combining it with teleport, apply the teleport point to the same ref (`originRef.current.position.copy(point)`) rather than through a `position` prop.

## AR features

- **Hit test** (place on real surfaces): `useXRHitTest(fn, relativeTo, trackableType)` every frame (reticles, placement previews), `useXRRequestHitTest()` once per event (tap to place; not inside `useFrame`), `<XRHitTest>` as a component, `useXRHitTestSource` for manual control. `relativeTo` is `'viewer'` (screen center on phones), an `XRSpace` such as `inputSource.targetRaySpace`, or a static object. Results are converted with `getWorldMatrix(matrix, result)`.
- **Anchors** (keep content fixed to the real world): `const [anchor, requestAnchor] = useXRAnchor()`, `requestAnchor({ relativeTo: 'space' | 'world' | 'hit-test-result', ... })`, render with `<XRSpace space={anchor.anchorSpace}>`. The anchor is deleted when re-requested, on unmount, and at session end.
- **Planes and meshes** (room geometry): `useXRPlanes('wall')` / `useXRMeshes(label)`, rendered with `<XRSpace space={plane.planeSpace}><XRPlaneModel plane={plane} /></XRSpace>` (`mesh.meshSpace` with `XRMeshModel`). The models accept pointer events, so a detected table or wall can be clicked or used as a `TeleportTarget`.
- **DOM overlay**: `<XRDomOverlay>` renders HTML over handheld (phone) AR only. In headsets, put UI into the scene, for example with @react-three/uikit; drei's `<Html>` is not visible in an immersive session.

## Other building blocks

- `XRSpace` placed outside `XROrigin` does not move with the origin; keep tracked content inside the origin unless that decoupling is intended.
- Guards: `IfInSessionMode` (`allow`/`deny`; with neither: any session), `IfSessionModeSupported`, `IfSessionVisible`, `IfFacingCamera` (wrist menus) unmount their children; `ShowIf...` variants only toggle visibility.
- `<XRLayer>` shows a video, image, or its rendered children through the WebXR Layers API at higher quality and lower cost than a texture, falling back to a regular mesh where layers are unsupported. For other render-target passes during a session, disable `gl.xr.enabled`/`gl.xr.isPresenting` around the offscreen render and restore them afterwards.
- Performance knobs: `foveation`, `frameBufferScaling`, `frameRate` options.
- Do not use the v5 compatibility exports (`XRButton`, `ARButton`, `VRButton`, `Interactive`, `useInteraction`, `RayGrab`, `useXREvent`, and the hooks marked deprecated) in new code. v5's `Controllers` and `Hands` no longer exist because inputs are added by default.

Further guides: https://pmndrs.github.io/xr/docs/getting-started/introduction
