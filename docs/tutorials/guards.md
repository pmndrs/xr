---
title: Guards
description: Render and show parts of your application conditionally using guards
nav: 20
---

One of the coolest features of web development is the amount of devices that you can reach with your application. Everything from desktop browsers to mobile phones, and even some watches are able to visit webpages. While a large number of devices can access your application, not all of them are able to provide the same experiences. It's important to remember this and plan accordingly when building your application. This tutorial will show you how to conditionally enable or disable parts of your application based on the client's current device using the various guards provided by `@react-three/xr`.

# Setup
As always, we need a new project to work with. Create a new React vite project and install the following dependencies:
`npm i three @react-three/fiber @react-three/xr @react-three/drei @react-three/uikit; npm i -D @types/three`

In `App.tsx`, set up a basic scene, and in `App.css` add some basic styling::

**App.tsx:**
```tsx
import { Box } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
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

**App.css:**
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

button {
  position: absolute;
  background: black;
  border-radius: 0.5rem;
  border: none;
  font-weight: bold;
  color: white;
  padding: 1rem 2rem;
  cursor: pointer;
  font-size: 1.5rem;
  bottom: 1rem;
  left: 50%;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 1);
  transform: translate(-50%, 0);
}
```

# Our First Guard
Already in our application we have something worth putting a guard on. We have an XR scene already to go with an enter VR button, but what if the user is on a device that doesn't support VR? We can use the `IfInSessionMode` guard to only show the enter VR button when the user's device supports immersive VR sessions. `IfInSessionMode` accepts two props: `allow` and `deny`. The `allow` prop allows you to specify which in which sessions you content should be shown. `deny` does the opposite, specifying which sessions your content should not be shown in. In our case, we want to use the `allow` prop and only show the button when the session mode is `immersive-vr`.

```tsx
import { IfInSessionMode } from '@react-three/xr'

//... Previous code
    <IfInSessionMode allow="immersive-vr">
      <button className="enterVRButton" onClick={() => store.enterVR()}>
        {'Enter VR'}
      </button>
    </IfInSessionMode>
//... Previous code
```

IfFacingCamera ⛔
ShowIfFacingCamera ⛔
IfSessionVisible ⛔
ShowIfSessionVisible ⛔
IfInSessionMode ☑️ : Needs usage snippet, and links to tutorial and example in jsdoc
ShowIfInSessionMode ⛔ - Checks visibilty only, not rendering
IfSessionModeSupported ⛔ - Doesn't render if toggled off
ShowIfSessionModeSupported ⛔ - Checks visibilty only, not rendering
useXRSessionFeatureEnabled ⛔ - Check for if MeshDetection is enabled
useXRSessionModeSupported ⛔
useXRSessionVisibilityState ⛔






Guards allow to conditionally display or include content. For instance, the `IfInSessionMode` guard allows only displaying a background when the session is not an AR session. The `IfInSessionMode` can receive either a list of `allow` session modes or a list of `deny` session modes.

```tsx
import { Canvas } from '@react-three/fiber'
import { IfInSessionMode, XR, createXRStore } from '@react-three/xr'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas>
        <XR store={store}>
          <IfInSessionMode deny="immersive-ar">
            <color args={['red']} attach="background" />
          </IfInSessionMode>
        </XR>
      </Canvas>
    </>
 )
}
```
