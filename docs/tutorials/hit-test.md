---
title: Hit Test
description: How to add hit testing capabilities to your AR experiences?
nav: 17
---

Hit testing allows to check intersections with real-world geometry in AR experiences. `@react-three/xr` provides various hooks and components for setting up hit testing.
The following example shows how to set up a hit test inside the right hand using the `XRHitTest` component, how to get the first hit test result using the `onResults` callback, and how to get the world position of that result into a vector.

```tsx
const matrixHelper = new Matrix4()
const hitTestPosition = new Vector3()

const store = createXRStore({
  hand: {
    right: () => {
      const state = useXRHandState()
      return (
        <>
          <XRHandModel />
          <XRSpace space={state.inputSource.targetRaySpace}>
            <XRHitTest
              onResults={(results, getWorldMatrix) => {
                if (results.length === 0) {
                  return
                }
                getWorldMatrix(matrixHelper, results[0])
                hitTestPosition.setFromMatrixPosition(matrixHelper)
              }}
            />
          </XRSpace>
        </>
      )
    },
  },
})
```

With the `hitTestPosition` containing the world position of the last hit test, we can use it to create a 3d object and sync it to the object's position on every frame.

```tsx
function Point() {
  const ref = useRef<Mesh>(null)
  useFrame(() => ref.current?.position.copy(hitTestPosition))
  return (
    <mesh scale={0.05} ref={ref}>
      <sphereGeometry />
      <meshBasicMaterial />
    </mesh>
  )
}
```

Alternatively, for devices that provide mesh detection, we can also add normal pointer events listeners to the XR Mesh to achieve the same behavior. Check out [this tutorial](./object-detection.md) for more information about mesh detection.
