---
title: Gamepad
description: How to use the XRControllers gamepad?
nav: 13
---

All XR controllers are part of the state inside the xr store. The existing controllers can be read using the `useXR` hook. Alternatively, a specific xr controller can be retrived using `useXRInputSourceState("controller", "left")`.

The xr controller state contains the gamepad state. Based on the name of one specific component, its state can be polled every frame. The following example shows how to read the thumbstick of the right controller to implement locomotion in combination with the `XROrigin`.

To keep the code snipped focussed on the gamepad API, the locomotion does not happen relative to the users head rotation. This can be added by retrieving the users head position from reading the camera world quaternion and extracting the users rotation on the y axis. (There is also a [useXRControllerLocomotion](../getting-started/all-hooks.md#usexrcontrollerlocomotion) hook available to help avoid implementing locomotion from scratch if that is the end goal).

```tsx
const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <Canvas>
        <XR store={store}>
          <ambientLight />
          <Locomotion />
          <mesh scale={[10, 1, 10]} position={[0, -0.5, 0]}>
            <boxGeometry />
            <meshBasicMaterial color="green" />
          </mesh>
        </XR>
      </Canvas>
    </>
  )
}

function Locomotion() {
  const controller = useXRInputSourceState('controller', 'right')
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (ref.current == null || controller == null) {
      return
    }
    const thumstickState = controller.gamepad['xr-standard-thumbstick']
    if (thumstickState == null) {
      return
    }
    ref.current.position.x += (thumstickState.xAxis ?? 0) * delta
    ref.current.position.z += (thumstickState.yAxis ?? 0) * delta
  })
  return <XROrigin ref={ref} />
}
```
