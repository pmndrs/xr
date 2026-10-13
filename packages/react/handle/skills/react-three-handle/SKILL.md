---
name: react-three-handle
description: Use @react-three/handle to let users move, rotate, and scale objects or the camera in React Three Fiber, with mouse, touch, XR controllers, and hands alike — draggable objects, door/lever-style constrained handles, editor gizmos (TransformHandles, PivotHandles), and orbit/map camera controls (OrbitHandles, MapHandles). Use when building any drag/grab/gizmo/camera-control interaction in R3F; for vanilla three.js, use @pmndrs/handle.
---

# @react-three/handle

A handle turns pointer interaction on one object (the handle) into a transformation of another object (the target). The same handle works with a mouse, touch, an XR ray, or a grabbing hand.

## Required event setup

Handles listen to @pmndrs/pointer-events, which R3F's built-in event system does not dispatch. Replace it:

```tsx
import { noEvents, PointerEvents } from '@react-three/xr'

<Canvas events={noEvents}>
  <PointerEvents />
  {/* inside an XR app, also wrap the scene in <XR store={store}> for controller and hand input */}
</Canvas>
```

`<XR>` alone covers XR input during a session but does not forward mouse/touch; without `<PointerEvents />` handles do nothing on desktop. Regular `onClick` and friends keep working through `PointerEvents`.

## Choosing a handle

- **Make an object draggable/grabbable**: wrap it in `<Handle>`. With no `targetRef`, the handle moves its own wrapper group, i.e. the children. For a plain drag, `<Handle multitouch={false} rotate={false} scale={false}>`.
- **Grab one part, move another** (door knob rotates the door, title bar moves the window): wrap the target in `<HandleTarget>` and put `<Handle targetRef="from-context">` anywhere inside it. `"from-context"` must be explicit; without a `HandleTarget` above it throws. Alternatively pass a ref as `targetRef`.
- **Constrained motion**: `translate`, `rotate`, `scale` each take `false`, a single axis (`"x"`), or per-axis limits (`{ x: false, y: [-1, 1] }`). `translate="as-rotate"` turns dragging into rotation around the target's origin (doors, levers, dials); `"as-scale"` scales by pulling away from the center (pair with `scale={{ uniform: true }}`); `"as-rotate-and-scale"` does both. These modes use only one pointer.
- **Editor gizmo**: `<TransformHandles mode="translate" | "rotate" | "scale">` (one operation at a time, `space="world" | "local"`) or `<PivotHandles>` (translate, rotate, and scale at once, local space only; props are `translation`, `rotation`, `scale`). Both transform their own group, so put the edited object inside them as children. `x`/`y`/`z`/`e` (and the Pivot props) accept `false` to hide an axis, limits, or `'disabled'`. Use `disabled` to grey out the gizmo and `hidden` to remove it; there is no `enabled` prop.
- **Camera controls on screens**: `<OrbitHandles>` or `<MapHandles>` (flat map, panning on the ground plane) instead of drei's `OrbitControls`/`MapControls`. They only react when the pointer hits nothing else, so dragging an object or gizmo never also orbits the camera, and they ignore XR pointers. Several camera handles or code can share one camera state via `store={createScreenCameraStore(...)}`.

## Reacting to and controlling interactions

`apply(state, target)` is called for every change. The default writes `state.current` onto the target. Override it to clamp, snap, write into your own state (React state, zustand, a multiplayer store), or react to the interaction:

- `state.first` / `state.last` mark drag start and end; `state.last` is where to commit, persist, or throw an object (velocity from `state.delta.position` and `state.delta.time`, which is in seconds in R3F).
- `state.initial`, `state.previous`, `state.current`, `state.delta`, `state.offset` hold position, quaternion, rotation, scale, and pointer count.

When `apply` routes changes through external state, that state must still end up on the target object: each new interaction starts from the target's current transform, so a target that is never updated makes every drag restart from the old pose.

The `ref` of `Handle`/`useHandle` gives the `HandleStore`: `getState()` is `undefined` while idle, `cancel()` aborts an interaction, `capture(pointerId, object)` starts one from code (combine with `bind={false}` to decide yourself when interactions start).

## Easy to get wrong

- Handles stop event propagation, so ancestors' `onClick`/hover never see handle interactions. Nested handles (a knob handle inside a door handle) need `stopPropagation={false}` on the inner one.
- A handle or target inside a group that moves every frame (a vehicle, an animated rig) needs `alwaysUpdate`, otherwise the target only updates while the pointer moves.
- `multitouch` is on by default: two pointers translate, rotate, and scale together; a single pointer never scales, and its rotation follows the controller's orientation. Per-axis rotation limits are reliable with `translate="as-rotate"` or two pointers: rotating a turntable or chair around its vertical axis by dragging is `translate="as-rotate" rotate="y"`. For plain one-pointer moves use `rotate={false}`.
- drei camera controls listen to the DOM directly and keep orbiting while a handle is dragged; `TransformHandles`/`PivotHandles` only disable controls registered with `makeDefault`, plain `<Handle>` never does. They also fight the headset for the camera inside XR — prefer `OrbitHandles`/`MapHandles`, or guard drei controls with @react-three/xr's `IfInSessionMode`.
- Mode names are exactly `translate`, `rotate`, `scale`.

Vanilla-only building blocks such as `DragHandle`, `HandlesContext`, or `applyDampedScreenCameraState` come from `@pmndrs/handle`.
