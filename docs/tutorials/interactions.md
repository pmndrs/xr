---
title: Interactions
description: Build interactions that work across XR and non-XR web applications
nav: 9
---

On this page, you can learn the basics behind pointer events and interactions in react-three/xr. From experience, we found that many people are interested in more high level interactions, which can be build with the concept of handles. Check out the [handles pages](../handles/introduction.md) to learn more about the concept and the library we built for it.

@react-three/xr uses the same pointer events as @react-three/fiber, which allows building interactions that work on non-XR devices as well as XR devices. So, just like you'd expect from @react-three/fiber and everywhere else in react, interactions are built using

- `onPointerMove`
- `onPointerCancel`
- `onPointerDown`
- `onPointerUp`
- `onPointerEnter`
- `onPointerLeave`
- `onPointerOver`
- `onPointerOut`
- `onClick`
- `onDblClick`
- `onContextMenu`
- `onWheel`

The following example shows how to bind an `onClick` handler to a mesh that gets executed when the mesh is clicked. This interaction will work in non-XR devices as well as in XR devices using @react-three/xr.

```tsx
<mesh onClick={(event) => console.log("I've been clicked", event)}>
  <boxGeometry />
</mesh>
```

The `event` object provided to the onClick handler contains useful information, such as the intersection `point` in world space.

The way pointer events are handled can be configured using the `pointerEvents`, `pointerEventsType`, and `pointerEventsOrder` properties, which are available on all threejs objects.

The `pointerEvents` property corresponds to the `pointerEvents` property of CSS, which allows to completely disable pointer events for an element and its children. However, children can also re-enable pointer events by setting `pointerEvents="auto"`.

The `pointerEventsType` property allows to blacklist or whitelist pointer events for specific pointer types. For instance, setting `pointerEventsType={{ deny: "grab" }}` prevents triggering pointer events from grabbing the object or any of its children.

The `pointerEventsOrder` allows to overwrite the sorting order, similar to how `renderOrder` allows to overwrite the rendering order in threejs. The default pointer events order is `0`. Setting it to a value greater than `0` will ensure it is intersected before anything with a lower pointer events order. Setting `pointerEventsOrder` is helpful for building an interactive x-ray object that is always rendered above anything else and should, therefore, always be interacted with first. For instance, this can be used to build controls that are overlayed over the object that they control.

## Pointer Capture

Another concept that @react-three/fiber leverages from the web is pointer captures. Pointer captures allow to force all consecutive events to be emitted to a specific object, even if that object is not intersected. This is useful for building dragging interactions without a complex global state. Typically, a pointer capture is set using `object.setPointerCapture` in the event handler of `onPointerDown` with the `pointerId` of the pointer that pressed on the object.

.The following example illustrates how pointer events can be built to create a simple dragging implementation (that only works if the mesh is not inside a transformed group).

```tsx
function DraggableCube() {
  const isDraggingRef = useRef(false)
  const meshRef = useRef<Mesh>(null)

  return (
    <mesh
      ref={meshRef}
      onPointerDown={(e) => {
        if (isDraggingRef.current) {
          return
 }
        isDraggingRef.current = true
        meshRef.position.copy(e.point)
 }}
      onPointerMove={(e) => {
        if (!isDraggingRef.current) {
          return
 }
        meshRef.position.copy(e.point)
 }}
      onPointerUp={(e) => (isDraggingRef.current = false)}
    >
      <boxGeometry />
    </mesh>
 )
}
```
