---
name: pmndrs-handle
description: Use @pmndrs/handle to let users move, rotate, and scale objects or the camera in a plain three.js scene with mouse, touch, XR controllers, and hands — draggable objects, constrained handles (doors, levers), editor gizmos (TransformHandles, PivotHandles), and orbit/map camera controls (OrbitHandles, MapHandles). Use for vanilla three.js; in React Three Fiber, use @react-three/handle.
---

# @pmndrs/handle

A handle turns pointer interaction on one object (the handle) into a transformation of another object (the target). The same handle works with a mouse, touch, an XR ray, or a grabbing hand.

## Wiring

Handles listen to events from @pmndrs/pointer-events, so something must dispatch them: `forwardHtmlEvents(canvas, () => camera, scene)` for mouse/touch, and @pmndrs/xr's `createXRStore` for XR input. `createXRStore(canvas, scene, camera, renderer.xr)` already forwards mouse/touch itself unless created with `htmlInput: false`; do not do both, or every event arrives twice.

Nothing moves until `update` runs — pointer events only record input, and `update` computes and applies the transformation. Call it every frame:

```ts
const { update: updateEvents } = forwardHtmlEvents(canvas, () => camera, scene)

const store = new HandleStore(target) // options: () => ({ translate: 'x', rotate: false, scale: false })
const unbind = store.bind(handleObject) // handleObject may be the target itself

const transform = new TransformHandles()
scene.add(transform)
transform.add(mesh) // the gizmo transforms its own group, so the edited object is its child
let unbindTransform = transform.bind('translate')

renderer.setAnimationLoop((time) => {
  updateEvents()
  store.update(time)
  transform.update(time, camera)
  renderer.render(scene, camera)
})
```

Dispose by calling every unbind function returned from `bind` (and `dispose()` for `DragHandle`, `destroy()` for `forwardHtmlEvents`). To switch a `TransformHandles` mode, call its unbind and `bind` again with the new mode.

## Choosing a handle

- **Make several objects draggable**: `new DragHandle(objects)`, one store per object.
- **Grab one object, transform another, or constrain motion**: `HandleStore(target, getOptions)` bound to the handle object. `translate`/`rotate`/`scale` take `false`, a single axis, or per-axis limits (`{ x: false, y: [-1, 1] }`); `translate: 'as-rotate'` turns dragging into rotation around the target's origin (doors, levers, dials), `'as-scale'` scales by pulling away from the center, `'as-rotate-and-scale'` does both. These modes use only one pointer.
- **Editor gizmo**: `TransformHandles` (one of `translate`/`rotate`/`scale` at a time, `space` `'world'` or `'local'`) or `PivotHandles` (all three at once, local space only, `bind(translation, rotation, scale)`). Axis options accept `false`, limits, or `'disabled'` (shown greyed out, not interactive). For custom gizmos, compose `HandlesContext` with the individual translate/rotate/scale handle classes.
- **Camera controls on screens**: `OrbitHandles(canvas, camera)` or `MapHandles` (flat map, panning on the ground plane), then `bind(scene, damping)` and `update(deltaMs)` every frame. They listen only on the scene's void object, so they react only when the pointer hits nothing else — dragging an object or gizmo never also moves the camera — and they ignore XR pointers. Share camera state between handles or drive it from code with `createScreenCameraStore`.

## Reacting to and controlling interactions

The `apply(state, target)` option receives every change; the default (`defaultApply`) copies `state.current` onto the target. Override it to clamp, snap, or route the change through your own state. `state.first`/`state.last` mark the start and end of an interaction; `state.delta`/`state.offset` give the change since the previous frame and since the start. When routing through external state, write the result back onto the target: each new interaction starts from the target's current transform.

`getState()` is `undefined` while idle; `cancel()` aborts an interaction; `capture(pointerId, object)` starts one from code.

## Easy to get wrong

- Handles stop event propagation by default, so ancestors never see handle interactions; nested handles need `stopPropagation: false` on the inner one.
- A handle or target whose parent moves every frame needs `alwaysUpdate: true`; otherwise the target only updates while the pointer moves.
- With `multitouch` (default on), two pointers translate, rotate, and scale together; a single pointer never scales and its rotation follows the controller's orientation. For plain one-pointer moves use `rotate: false`; for rotating around one axis by dragging (a turntable, a dial) use `translate: 'as-rotate'` with `rotate: 'y'`, where `rotate` restricts the axes.
- Mode names are exactly `translate`, `rotate`, `scale`.
