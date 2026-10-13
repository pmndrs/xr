---
name: pmndrs-pointer-events
description: Use @pmndrs/pointer-events to give a plain three.js scene DOM-style pointer events (click, hover, drag with pointer capture) from mouse/touch, XR controllers, hands, or custom inputs, and to forward events through render-target screens or portals. Use when wiring events into a vanilla three.js scene or building a custom pointer; in React Three Fiber, use @react-three/xr (`PointerEvents`, `useRayPointer`, ...) instead of calling this package directly.
---

# @pmndrs/pointer-events

Objects receive events through three's own `addEventListener`, with the same names and semantics as DOM pointer events: `pointerdown/up/move/over/out/enter/leave/cancel`, `click`, `dblclick`, `contextmenu`, `wheel`. Every event source — mouse, touch, an XR ray, a grabbing hand — is a pointer, so one listener works for all of them.

## Choosing an entry point

- **Screen input (mouse, touch, pen)**: `forwardHtmlEvents(canvas, () => camera, scene)`.
- **Events hitting a mesh that shows another scene** (a render-target screen, a portal, an in-world editor viewport): `forwardObjectEvents(mesh, () => innerCamera, innerScene)`. The hit's `uv` becomes the screen coordinate for the inner camera, so the mesh needs UVs.
- **A tracked object that points or touches** (XR controller, hand, a tool in the scene): `createRayPointer` for a straight ray along the object's -Z, `createLinesPointer` for a curved/polyline ray (teleport arcs), `createGrabPointer` for a sphere you press with `down`/`up` yourself (squeeze to grab), `createTouchPointer` for a fingertip sphere that presses on its own when close enough.
- **Several pointers on the same hand**: register them in one `CombinedPointer` so the scene is traversed once per frame instead of once per pointer, and only the nearest pointer stays active when constructed with `enableMultiplePointers = false`.

## Wiring

```ts
const { update, destroy } = forwardHtmlEvents(canvas, () => camera, scene)
mesh.addEventListener('click', (e) => console.log(e.point))

renderer.setAnimationLoop(() => {
  update() // delivers the DOM events batched since the last frame
  renderer.render(scene, camera)
})
// on teardown: destroy()
```

Events are batched by default and only delivered inside `update()`; nothing fires if `update()` is never called. Batching moves handlers out of the browser's user-gesture call stack, so actions that require a gesture (playing a video, opening a file picker in Safari) fail from a `click` handler — pass `{ batchEvents: false }` for those, or when the scene is not rendered every frame. Pass `intersectEveryFrame: true` when objects move under a resting mouse and hover should follow them.

A pointer you create yourself is driven every frame: `pointer.move(scene, { timeStamp })`, then `down`/`up({ timeStamp, button })` on input, and `exit(...)` when the input source disappears so hovered objects receive `pointerout`/`pointerleave`. The pointer reads the space object's `matrix`, not its `position`/`rotation`, so update matrices before moving it. Objects moved after the last render need `scene.updateMatrixWorld()` before `move`/`update`.

## Which objects get hit

- `pointerEvents` works like CSS and is inherited: `'none'` excludes an object (a child can opt back in with `'auto'`), `'auto'` always hits. The default is `'listener'`: an object is hit only if it or an ancestor has a pointer listener. Content without listeners — particles, decoration, transparent overlays — neither receives events nor blocks them. A listener on the `Scene` therefore makes the whole scene hittable.
- `pointerEventsType` filters by pointer type: `{ allow: 'ray' }`, `{ deny: ['grab', 'touch'] }`, or a function. Types are `screen-mouse`, `screen-touch`, `screen-pen` for DOM input, `ray`, `lines`, `grab`, `touch` for created pointers, and `forward-<outer type>` inside `forwardObjectEvents`. A common use: `{ deny: 'grab' }` on a button so a hand passing through it does not click it.
- `pointerEventsOrder` (higher first, like `renderOrder`) beats distance, which lets an x-ray overlay or gizmo win over the object it sits inside. Grab and touch pointers sort by distance only.
- These properties are not copied by `object.clone()`.

## Easy to get wrong

- **Dragging**: call `e.object.setPointerCapture(e.pointerId)` in `pointerdown`; later events go to that object even when the pointer leaves it, and `e.point` keeps following the pointer on the plane of the originally hit face. Capture is released on `up`, `cancel`, and `exit`. `e.pointerId` is the 3D pointer id, not the DOM one.
- **Missed clicks**: a pointer that hits nothing hits the scene's void object (`getVoidObject(scene)`, flagged `isVoidObject`). Those events bubble to listeners on the scene, so a scene-level `click` listener also fires on empty space; check `e.object.isVoidObject` or listen on the void object to handle "clicked nothing".
- `click`, `dblclick`, and `contextmenu` are synthesized from `pointerdown`/`pointerup` on the same object, not taken from the DOM.
- `pointerenter`/`pointerleave` do not bubble; every other event bubbles through `.parent` and honors `stopPropagation()`.
- With React Three Fiber, using this package next to R3F's own event system fires events twice; @react-three/xr's `noEvents` + `PointerEvents` replace R3F's system with this one.
