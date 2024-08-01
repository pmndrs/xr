---
title: Introduction
description: 🤳 XR for react-three-fiber
nav: 0
---

```bash
npm install three @react-three/fiber @react-three/xr@latest
```

## What does it look like?

| A simple scene with a mesh that toggles its material color between `"red"` and `"blue"` when clicked through touching or pointing. | ![recording of interacting with the code below](./basic-example.gif) |
|-|-|

```tsx
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { useState } from 'react'

const store = createXRStore()

export function App() {
  const [red, setRed] = useState(false)
  return <>
    <button onClick={() => store.enterAR()}>Enter AR</button>
    <Canvas>
      <XR store={store}>
        <mesh pointerEventsType={{ deny: 'grab' }} onClick={() => setRed(!red)} position={[0, 1, -1]}>
          <boxGeometry />
          <meshBasicMaterial color={red ? 'red' : 'blue'} />
        </mesh>
      </XR>
    </Canvas>
  </>
}
```

### Turn any @react-three/fiber app into an XR experience

1. `const store = createXRStore()` create a xr store
2. `store.enterAR()` call enter AR when clicking on a button
3. `<XR>...</XR>` wrap your content with the XR component

... or read this guide for [converting a react-three/fiber app to XR](../getting-started/convert-to-xr.md).

## Tutorials

- 💾 [Store](../tutorials/store.md)
- 👌 [Interactions](../tutorials/interactions.md)
- 🔧 [Options](../tutorials/options.md)
- 🧊 [Object Detection](../tutorials/object-detection.md)
- ✴ [Origin](../tutorials/origin.md)
- 🪄 [Teleport](../tutorials/teleport.md)
- 🕹️ [Gamepad](../tutorials/gamepad.md)
- 🎮 [Custom Controller/Hands/...](../tutorials/custom-inputs.md)
- ⚓️ [Anchors](../tutorials/anchors.md)
- 📱 [Dom Overlay](../tutorials/dom-overlay.md)
- 🎯 [Hit Test](../tutorials/hit-test.md)
- ⛨ [Guards](../tutorials/guards.md)

## Roadmap

- 🤳 XR Gestures
- ➕ Multimodal
- 📺 Layers
- 🕺 Tracked Body
- ↕ react-three/controls

## Migration guides

- from [@react-three/xr v5](../migration/from-react-three-xr-5.md)
- from [natuerlich](../migration/from-natuerlich.md)

## Sponsors

This project is supported by a few companies and individuals building cutting-edge 3D Web & XR experiences. Check them out!

![Sponsors Overview](https://bbohlender.github.io/sponsors/screenshot.png)
