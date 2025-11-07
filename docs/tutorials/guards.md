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

const store = createXRStore({ offerSession: false })

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
      <button className="enterARButton" onClick={() => store.enterAR()}>
        {'Enter AR'}
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
Already in our application we have something worth putting a guard on. We have an XR scene already to go with an enter VR button, but what if the user is on a device that doesn't support VR? We can use the `IfSessionModeSupported` guard to only show the enter VR button when the user's device supports immersive VR sessions. `IfSessionModeSupported` takes a `mode` prop which can be set to `immersive-vr`, `immersive-ar`, or `inline`. Let's wrap our enter VR and enter AR buttons with the `IfSessionModeSupported` guard.

```tsx
import { IfInSessionMode } from '@react-three/xr'

//... Previous code
    <IfSessionModeSupported mode="immersive-vr">
      <button className="enterVRButton" onClick={() => store.enterVR()}>
        {'Enter VR'}
      </button>
    </IfSessionModeSupported>
    <IfSessionModeSupported mode="immersive-ar">
      <button className="enterARButton" onClick={() => store.enterAR()}>
        {'Enter AR'}
      </button>
    </IfSessionModeSupported>
//... Previous code
```

# ShowIfSessionModeSupported
If you look in the API you might notice that there is also a `ShowIfSessionModeSupported` guard. There are 2 main differences between `ShowIfSessionModeSupported` and `IfSessionModeSupported`. The first difference is that `ShowIfSessionModeSupported` only works within the react-three/fiber canvas. The second difference is that `IfSessionModeSupported` will not **render** its children at all if mode doesn't match the session, while `ShowIfSessionModeSupported` will render its children but set their **visibility** to false. This means that with `ShowIfSessionModeSupported`, the components will still exist in the scene, but they will not be visible. We can demonstrate this by making a simple message component that we will only show when VR sessions are supported. Add a new file called `Message.tsx` with the following code:

Messages.tsx:
```tsx
import { Container, Text } from '@react-three/uikit'

interface MessageProps {
  message: string
}

export const Message = ({ message }: MessageProps) => {
  console.log('But I am still rendered no matter what!')
  return (
    <group position={[-2, 4, 0]}>
      <Container borderRadius={50} backgroundColor={'black'} padding={5}>
        <Text color={'white'}>{message}</Text>
      </Container>
    </group>
  )
}
```

Now add the `<Message />` component into our scene wrapped with the `ShowIfSessionModeSupported` guard:

```tsx
//... Previous code
import { createXRStore, IfSessionModeSupported, ShowIfSessionModeSupported, XR } from '@react-three/xr'
import { Message } from './Message.js'
//... Previous code
        <XR store={store}>
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={'darkgreen'} />
          </Plane>
          <OrbitControls />
        </XR>
        {/* Show message when VR is supported */}
        <ShowIfSessionModeSupported mode="immersive-vr">
          <Message message="VR is supported on this device!" />
        </ShowIfSessionModeSupported>
//... Previous code
```

Notice that when you run the application on your desktop web browser, you will see the message in the console from the `Message` component, but you won't see the `UIKit` message rendered in the scene. The next components that we are going to cover also have both show and conditional render versions, but for simplicity, we are only going to cover the versions that optionally render going forward.

# IfFacingCamera
This guard allows us to only render children when they are seen by the camera from a specific direction. This can be helpful for optimizing performance by not showing things that the user can't see.To show off this guard, let's create a simple spinning box that will only render viewed from the camera from the -z axis. First, create a new file called `SpinningBox.tsx` with the following code:

SpinningBox.tsx:
```tsx
import { Box } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { IfFacingCamera } from '@react-three/xr'
import { useRef } from 'react'
import * as THREE from 'three'

interface SpinningBoxProps {
  position?: [number, number, number]
}

const cameraDirectionHelper = new THREE.Vector3(0, 0, -1)

export const SpinningBox = ({ position }: SpinningBoxProps) => {
  const boxRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    const box = boxRef.current
    if (box) {
      box.rotation.y += delta
    }
  })

  return (
    <>
      <IfFacingCamera direction={cameraDirectionHelper} angle={Math.PI}>
        <Box ref={boxRef} position={position}>
          <meshBasicMaterial color="orange" />
        </Box>
      </IfFacingCamera>
    </>
  )
}
```

Now import and add the `SpinningBox` component into our scene:

App.tsx:
```tsx
//... Previous code
import { SpinningBox } from './SpinningBox.js'
//... Previous code
        <XR store={store}>
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={'darkgreen'} />
          </Plane>
          {/* Add the SpinningBox component */}
          <SpinningBox position={[0, 1, 0]} />
          <OrbitControls />
        </XR>
//... Previous code
```
If you look at the scene now, you will not be able to see the spinning box, but if you rotate it around to view from the -z axis, the box will appear and start spinning.

# IfInSessionMode
While expiramenting with the previous guards, you were likely using the `<OrbitControls />` component to move the camera around. In desktop react-three/fiber applications, the orbit controls are a very handy way to move the camera around and explore your scene. Unfortunately, the `<OrbitControls />` component does not play nicely with XR sessions. Luckily, we have a guard that can help us in this situation. The `IfInSessionMode` guard allows us to conditionally render components based on the current XR session mode. It accepts two props, a deny, and an allow list. In our case we want to **deny** our content when we are in an "immersive-ar", or an "immersive-vr" session. In the `App.tsx` file, wrap the `<OrbitControls />` component with the `IfInSessionMode` guard, and set it to deny both "immersive-ar" and "immersive-vr" modes:

App.tsx:
```tsx
//... Previous code
import { createXRStore, IfSessionModeSupported, ShowIfSessionModeSupported, XR } from '@react-three/xr'
//... Previous code
// Wrap OrbitControls with IfInSessionMode
<IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
  <OrbitControls />
</IfInSessionMode>
//... Previous code
```

# IfSessionVisible
We are down to our last component guard! This guard is more of a special use guard. The `IfSessionVisible` guard allows us to conditionally render content based on whether the XR session is visible or not. This can be useful for pausing certain effects or animations when the session is not visible to the user. For example, if the user switches to another tab or minimizes the browser window, we might want to pause certain animations to save resources. To demonstrate this guard, let's create a simple box that hides whenever the session is paused. Create a new file called `ShyBox.tsx` with the following code:

ShyBox.tsx:
```tsx
import { Box } from '@react-three/drei'
import { IfSessionVisible } from '@react-three/xr'
import { useRef } from 'react'
import * as THREE from 'three'

interface ShyBoxProps {
  position?: [number, number, number]
}

export const ShyBox = ({ position }: ShyBoxProps) => {
  const boxRef = useRef<THREE.Mesh>(null)

  return (
    <IfSessionVisible>
      <Box ref={boxRef} position={position}>
        <meshBasicMaterial color="lightblue" />
      </Box>
    </IfSessionVisible>
  )
}
```

Now import and add the `ShyBox` component into our scene:

App.tsx:
```tsx
//... Previous code
import { ShyBox } from './ShyBox.js'
//... Previous code
        <XR store={store}>
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={'darkgreen'} />
          </Plane>
          {/* Add the ShyBox component */}
          <ShyBox position={[2, 1, 0]} />
          <SpinningBox position={[0, 1, 0]} />
          <IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
            <OrbitControls />
          </IfInSessionMode>
        </XR>
//... Previous code
```

The best way to test this guard is to run the application in a VR session, then press the menu button on your VR controller to bring up the system menu. You should see the `ShyBox` disappear when the system menu is open, and reappear when you close the menu.


# Hooks
We've made it through all of the component guards 🥳. All that's left now is to explore the hooks that are provided by `@react-three/xr`. Many of the components that we've covered so far use these hooks under the hood. 

### useXRSessionFeatureEnabled

### useXRSessionModeSupported

### useXRSessionVisibilityState

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
