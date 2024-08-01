---
title: Guards
description: Render and show parts of your application conditionally using guards
nav: 18
---

Guards allow to conditionally display or include content. For instance, the `IfInSessionMode` guard allows only displaying a background when the session is not an AR session. The `IfInSessionMode` can receive either a list of `allow` session modes or a list of `deny` session modes.

```tsx
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas>
        <XR store={store}>
          <SessionModeGuard deny="immersive-ar">
            <color args={['red']} attach="background" />
          </SessionModeGuard>
        </XR>
      </Canvas>
    </>
 )
}
```
