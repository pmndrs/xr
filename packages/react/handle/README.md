<h1 align="center">@react-three/handle</h1>
<h3 align="center">The one to handle them all 👌</h3>
<br/>

<p align="center">
  <a href="https://npmjs.com/package/@react-three/handle" target="_blank">
    <img src="https://img.shields.io/npm/v/@react-three/handle?style=flat&colorA=000000&colorB=000000" alt="NPM" />
  </a>
  <a href="https://npmjs.com/package/@react-three/handle" target="_blank">
    <img src="https://img.shields.io/npm/dt/@react-three/handle.svg?style=flat&colorA=000000&colorB=000000" alt="NPM" />
  </a>
  <a href="https://twitter.com/pmndrs" target="_blank">
    <img src="https://img.shields.io/twitter/follow/pmndrs?label=%40pmndrs&style=flat&colorA=000000&colorB=000000&logo=twitter&logoColor=000000" alt="Twitter" />
  </a>
  <a href="https://discord.gg/ZZjjNvJ" target="_blank">
    <img src="https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=000000" alt="Discord" />
  </a>
</p>

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

# [Documentation](https://pmndrs.github.io/xr/docs/handles/)

## Sponsors

This project is supported by a few companies and individuals building cutting-edge 3D Web & XR experiences. Check them out!

![Sponsors Overview](https://bbohlender.github.io/sponsors/screenshot.png)
