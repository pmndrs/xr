---
title: Heads Up Displays
description: How to show static information in XR using a "Heads Up Display"
nav: 12
---

A heads up display is a fairly easy thing to implement in React Three XR, but a lot of people seem to want to implement them, so here's a quick tutorial on a simple way to implement a heads up display.


First thing to do is to create a new React Three XR project, and import UIKit. We will use UIKit to create the elements of our heads up display.

`npm i @react-three/uikit`

Next, we need a basic scene to start out with.

```tsx
import { Box } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
import * as THREE from 'three'
import './styles.css'

const store = createXRStore()

const axisColor = new THREE.Color('#9d3d4a')
const gridColor = new THREE.Color('#4f4f4f')

export function App() {
  return (
    <div className="App">
      <Canvas camera={{ position: [5, 3, 5] }}>
        <color attach={'background'} args={['#3f3f3f']} />
        <gridHelper args={[50, 50, axisColor, gridColor]} />
        <XR store={store}>
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={'darkgreen'} />
          </Plane>
        </XR>
      </Canvas>
      <button className="enterVRButton" onClick={() => store.enterVR()}>
        {'Enter VR'}
      </button>
    </div>
  )
}
```

```css
html {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
}

.App {
  font-family: sans-serif;
  text-align: center;
  width: 100vw;
  height: 100vh;
}

.enterVRButton {
  position: fixed;
  left: 2rem;
  top: 2rem;
}
```
