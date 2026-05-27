# @react-three/handle

# @react-three/handle
The one to handle them all 👌
<br/>

```bash
npm install three @react-three/fiber @react-three/handle@latest @react-three/xr@latest
```

| A example with a handle for controlling the scale rotation and position of a simple red cube by grabbing it with any type of input (mouse, touch, grab, point) in XR and non-XR applications. | ![recording of interacting with the code below](./handle.gif) |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |

```tsx
import { Canvas } from '@react-three/fiber'
import { noEvents, PointerEvents } from '@react-three/xr'
import { Handle } from '@react-three/handle'

export function App() {
  return (
    <Canvas events={noEvents}>
      <PointerEvents />
      <Environment preset="city" />
      <Handle>
        <mesh position-z={-1}>
          <boxGeometry />
          <meshStandardMaterial color="red" />
        </mesh>
      </Handle>
    </Canvas>
  )
}
```

# [Documentation](https://pmndrs.github.io/xr/docs/handles/introduction)

## Sponsors

This project is supported by a few companies and individuals building cutting-edge 3D Web & XR experiences. Check them out!

![Sponsors Overview](https://bbohlender.github.io/sponsors/screenshot.png)
