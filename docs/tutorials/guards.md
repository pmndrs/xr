---
title: Guards
description: Render and show parts of your application conditionally using guards
nav: 20
---

One of the coolest features of web development is the amount of devices that you can reach with your application. Everything from desktop browsers to mobile phones, and even some watches are able to visit webpages. While a large number of devices can access your application, not all of them are able to provide the same experiences. It's important to remember this and plan accordingly when building your application. This tutorial will show you how to conditionally enable or disable parts of your application based on the client's current device using the various "guard" components provided by `@react-three/xr`.

### Setup
As always, we need a new project to work with. Create a new React vite project and install the following dependencies:
`npm i three @react-three/fiber @react-three/xr @react-three/drei @react-three/uikit; npm i -D @types/three`

In `App.tsx`, set up a basic scene, and in `styles.css` add some basic styling::

**App.tsx:**
```tsx
import { OrbitControls, Plane } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { createXRStore, XR } from '@react-three/xr'
import './styles.css'

const store = createXRStore({ offerSession: false, emulate: false })

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
          <OrbitControls />
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

**styles.css:**
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
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 1);
}

.enterVRButton {
  bottom: 1rem;
  transform: translate(-50%, 0);
  left: 40%;
}

.enterARButton {
  bottom: 1rem;
  left: 60%;
  transform: translate(-50%, 0);
}
```

### Our First Guard
Already in our application we have something worth putting a guard on. We have an XR scene already to go with an enter VR button, but what if the user is on a device that doesn't support VR? We can use the `IfSessionModeSupported` guard to only show the enter VR button when the user's device supports immersive VR sessions. `IfSessionModeSupported` takes a `mode` prop which can be set to `immersive-vr`, `immersive-ar`, or `inline`. Let's wrap our enter VR and enter AR buttons with the `IfSessionModeSupported` guard.

**App.tsx:**
```tsx
import { IfSessionModeSupported } from '@react-three/xr'

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

### ShowIfSessionModeSupported
If you look in the API you might notice that there is also a `ShowIfSessionModeSupported` guard. There are 2 main differences between `ShowIfSessionModeSupported` and `IfSessionModeSupported`. The first difference is that `ShowIfSessionModeSupported` only works within the react-three/fiber canvas. The second difference is that `IfSessionModeSupported` will not **render** its children at all if mode doesn't match the session, while `ShowIfSessionModeSupported` will render its children, but set their **visibility** to false. This means that with `ShowIfSessionModeSupported` the components will still exist in the scene, but they will not be visible. We can demonstrate this by making a simple message component that we will only show when VR sessions are supported. Add a new file called `Message.tsx` with the following code:

**Message.tsx:**
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

**App.tsx:**
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

### IfFacingCamera
This guard allows us to only render children when they are seen by the camera from a specific direction. This can be helpful for optimizing performance by not showing things that the user can't see. To demonstrate this guard, let's create a simple spinning box that will only render if it is viewed from the negative z axis. First, create a new file called `SpinningBox.tsx` with the following code:

**SpinningBox.tsx:**
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

**App.tsx:**
```tsx
//... Previous code
import { SpinningBox } from './SpinningBox.js'
//... Previous code
        <XR store={store}>
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={'darkgreen'} />
          </Plane>
          {/* Add the SpinningBox component */}
          <SpinningBox position={[2, 1, 0]} />
          <OrbitControls />
        </XR>
//... Previous code
```
If you look at the scene now, you will not be able to see the spinning box, but if you rotate it around to view from the negative z axis, the box will appear and start spinning.

### IfInSessionMode
While experimenting with the previous guards, we have been using the `<OrbitControls />` component to move the camera around. In desktop react-three/fiber applications the `<OrbitControls />` component is a very handy way to move the camera around and explore your scene. Unfortunately, the `<OrbitControls />` component does not play nicely with XR sessions. Luckily, we have a guard that can help us in this situation. The `IfInSessionMode` guard allows us to conditionally render components based on the current XR session mode. It accepts two props, a deny, and an allow list. In our case we want to **deny** our content when we are in an "immersive-ar", or an "immersive-vr" session. In the `App.tsx` file, wrap the `<OrbitControls />` component with the `IfInSessionMode` guard, and set it to deny both "immersive-ar" and "immersive-vr" modes:

**App.tsx:**
```tsx
//... Previous code
import { createXRStore, IfInSessionMode, IfSessionModeSupported, ShowIfSessionModeSupported, XR } from '@react-three/xr'
//... Previous code
        // Wrap OrbitControls with IfInSessionMode
        <IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
          <OrbitControls />
        </IfInSessionMode>
//... Previous code
```

### IfSessionVisible
We are down to our last component guard! The `IfSessionVisible` guard allows us to conditionally render content based on whether the XR session is visible or not. This can be useful for pausing certain effects or animations when the session is not visible to the user (e.g. when they press the menu button on a VR controller). To demonstrate this guard, let's create a simple box that hides whenever the session is paused. Create a new file called `ShyBox.tsx` with the following code:

**ShyBox.tsx:**
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

**App.tsx:**
```tsx
//... Previous code
import { ShyBox } from './ShyBox.js'
//... Previous code
        <XR store={store}>
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={'darkgreen'} />
          </Plane>
          {/* Add the ShyBox component */}
          <ShyBox position={[-2, 1, 0]} />
          <SpinningBox position={[2, 1, 0]} />
          <IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
            <OrbitControls />
          </IfInSessionMode>
        </XR>
//... Previous code
```

The best way to test this guard is to run the application in a VR session, then press the menu button on your VR controller to bring up the system menu. You should see the `ShyBox` disappear when the system menu is open, and reappear when you close the menu.

> [!NOTE]
> Some VR devices may count bringing up the system menu as "blurring" the session rather than hiding it. If this happens to you, you can get the same effect by using the `useXRSessionVisibilityState` hook which we will cover in the next section, and checking for 'visible-blurred' instead of 'hidden'👍


### Hooks
We've made it through all of the component guards 🥳. All that's left now is to explore the hooks that are provided by `@react-three/xr`. Many of the components that we've covered so far use these hooks under the hood, and they can be useful for implementing logic based off of the state of the session rather than just hiding and displaying things. 

### useXRSessionFeatureEnabled
`useXRSessionFeatureEnabled` lets you check if a feature is enabled in the current XR session. For example, you can check if `hand-tracking` is available on your device. The full list of features can be found here at [MDN](https://developer.mozilla.org/en-US/docs/Web/API/XRSystem/requestSession#session_features). For our little demo app here, we're going to create a little panel that shows which features are supported by our device. Create a new file called `SupportedFeaturesPanel.tsx` with the following code:

**SupportedFeaturesPanel.tsx:**
```tsx
import { Container, Text } from '@react-three/uikit'
import { useXRSessionFeatureEnabled } from '@react-three/xr'

interface SupportedFeaturesPanelProps {
  position?: [number, number, number]
}

export const SupportedFeaturesPanel = ({ position }: SupportedFeaturesPanelProps) => {
  const canUseAnchors = useXRSessionFeatureEnabled('anchors')
  const canUseBoundedFloor = useXRSessionFeatureEnabled('bounded-floor')
  const canUseDepthSensing = useXRSessionFeatureEnabled('depth-sensing')
  const canUseDomOverlay = useXRSessionFeatureEnabled('dom-overlay')
  const canUseHandTracking = useXRSessionFeatureEnabled('hand-tracking')
  const canUseHitTest = useXRSessionFeatureEnabled('hit-test')
  const canUseLayers = useXRSessionFeatureEnabled('layers')
  const canUseLightEstimation = useXRSessionFeatureEnabled('light-estimation')
  const canUseLocal = useXRSessionFeatureEnabled('local')
  const canUseLocalFloor = useXRSessionFeatureEnabled('local-floor')
  const canUseSecondaryViews = useXRSessionFeatureEnabled('secondary-views')
  const canUseUnbounded = useXRSessionFeatureEnabled('unbounded')
  const canUseViewer = useXRSessionFeatureEnabled('viewer')

  const getTextColor = (enabled: boolean) => (enabled ? 'lightgreen' : 'red')

  return (
    <group position={position}>
      <Container
        width={200}
        height={280}
        padding={5}
        backgroundColor={'#222222'}
        borderRadius={0.5}
        display={'flex'}
        flexDirection={'column'}
      >
        <Text color={'white'}>{'Supported Features:'}</Text>
        <Text color={getTextColor(canUseAnchors)}>{`Anchors: ${canUseAnchors}`}</Text>
        <Text color={getTextColor(canUseBoundedFloor)}>{`Bounded Floor: ${canUseBoundedFloor}`}</Text>
        <Text color={getTextColor(canUseDepthSensing)}>{`Depth Sensing: ${canUseDepthSensing}`}</Text>
        <Text color={getTextColor(canUseDomOverlay)}>{`DOM Overlay: ${canUseDomOverlay}`}</Text>
        <Text color={getTextColor(canUseHandTracking)}>{`Hand Tracking: ${canUseHandTracking}`}</Text>
        <Text color={getTextColor(canUseHitTest)}>{`Hit Test: ${canUseHitTest}`}</Text>
        <Text color={getTextColor(canUseLayers)}>{`Layers: ${canUseLayers}`}</Text>
        <Text color={getTextColor(canUseLightEstimation)}>{`Light Estimation: ${canUseLightEstimation}`}</Text>
        <Text color={getTextColor(canUseLocal)}>{`Local: ${canUseLocal}`}</Text>
        <Text color={getTextColor(canUseLocalFloor)}>{`Local Floor: ${canUseLocalFloor}`}</Text>
        <Text color={getTextColor(canUseSecondaryViews)}>{`Secondary Views: ${canUseSecondaryViews}`}</Text>
        <Text color={getTextColor(canUseUnbounded)}>{`Unbounded: ${canUseUnbounded}`}</Text>
        <Text color={getTextColor(canUseViewer)}>{`Viewer: ${canUseViewer}`}</Text>
      </Container>
    </group>
  )
}
```

Now add the `SupportedFeaturesPanel` component into our scene, and we have a nice view of what features are supported by our device.

**App.tsx:**
```tsx
//... Previous code
import { SupportedFeaturesPanel } from './SupportedFeaturesPanel.js'
//... Previous code
        <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={'darkgreen'} />
        </Plane>
        <ShyBox position={[-2, 1, 0]} />
        <SpinningBox position={[2, 1, 0]} />
        {/* Add the SupportedFeaturesPanel component */}
        <SupportedFeaturesPanel position={[2, 3, -3]} />
        {/* Previous code */}
```

*Note:* Just for clarity, in practice, you only need to check for the features that you actually plan on using in your application.

### useXRSessionVisibilityState
The `useXRSessionVisibilityState` hook allows you to get the current visibility state of the XR session. The visibility state can be one of three values: `visible`, `hidden`, or `visible-blurred`. This can be useful for hiding elements, pausing or resuming animations, or changing effects based on whether the session is currently visible to the user. In our demo here, we're going to create a box that changes color based on the visibility state of the session. Create a new file called `ColorChangingBox.tsx` with the following code:

**ColorChangingBox.tsx:**
```tsx
import { Box } from '@react-three/drei'
import { useXRSessionVisibilityState } from '@react-three/xr'
import { useEffect, useState } from 'react'
import * as THREE from 'three'

interface ColorChangingBoxProps {
  position?: [number, number, number]
}

export const ColorChangingBox = ({ position }: ColorChangingBoxProps) => {
  const [color, setColor] = useState(new THREE.Color('blue'))
  const visState = useXRSessionVisibilityState()

  useEffect(() => {
    if (visState === 'hidden') {
      setColor(new THREE.Color(Math.random() * 0xffffff))
    }
  }, [visState])

  return (
    <Box position={position} args={[0.5, 0.5, 0.5]}>
      <meshBasicMaterial color={color} />
    </Box>
  )
}
```

Add the box to our scene next to the other boxes:

**App.tsx:**
```tsx
//... Previous code
import { ColorChangingBox } from './ColorChangingBox.js'
//... Previous code
        <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={'darkgreen'} />
        </Plane>
        <ShyBox position={[-2, 1, 0]} />
        <SpinningBox position={[2, 1, 0]} />
        <SupportedFeaturesPanel position={[2, 3, -3]} />
        {/* Add the ColorChangingBox component */}
        <ColorChangingBox position={[1.5, 1, -2]} />
//... Previous code
```

Now when wearing a VR headset, if you pause the application by bringing up the system menu, the box will change to a random color.

> [!NOTE]
> As mentioned earlier, some VR devices may count bringing up the system menu as "blurring" the session rather than hiding it. If you don't see the box change color, try checking for 'visible-blurred' in the `useEffect` instead of 'hidden'👍

### useXRSessionModeSupported
We've finally made it to the last hook! The `useXRSessionModeSupported` hook allows you to check if a specific session mode is supported by the current device. This can be useful for conditionally enabling or disabling features based on the capabilities of the device. For example, you might want to check if `immersive-ar` is supported before showing an AR-specific feature in your application. In our case, we're going to keep things nice and simple and show another panel that displays which session modes are supported by our current device. Create a new file called `SupportedSessionModesPanel.tsx` with the following code:

**SupportedSessionModesPanel.tsx:**
```tsx
import { Container, Text } from '@react-three/uikit'
import { useXRSessionModeSupported } from '@react-three/xr'

interface SupportedSessionModesPanelProps {
  position?: [number, number, number]
}

export const SupportedSessionModesPanel = ({ position }: SupportedSessionModesPanelProps) => {
  const supportsImmersiveVR = useXRSessionModeSupported('immersive-vr')
  const supportsImmersiveAR = useXRSessionModeSupported('immersive-ar')
  const supportsInline = useXRSessionModeSupported('inline')

  const getTextColor = (supported?: boolean) => (supported ? 'lightgreen' : 'red')

  return (
    <group position={position}>
      <Container
        width={200}
        height={120}
        padding={5}
        backgroundColor={'#222222'}
        borderRadius={0.5}
        display={'flex'}
        flexDirection={'column'}
      >
        <Text color={'white'}>{'Supported Session Modes:'}</Text>
        <Text color={getTextColor(supportsImmersiveVR)}>{`Immersive VR: ${supportsImmersiveVR}`}</Text>
        <Text color={getTextColor(supportsImmersiveAR)}>{`Immersive AR: ${supportsImmersiveAR}`}</Text>
        <Text color={getTextColor(supportsInline)}>{`Inline: ${supportsInline}`}</Text>
      </Container>
    </group>
  )
}
```

By now you should be well familiar with the drill. Add the `SupportedSessionModesPanel` component into our scene next to the other panel:

**App.tsx:**
```tsx
//... Previous code
import { SupportedSessionModesPanel } from './SupportedSessionModesPanel.js'
//... Previous code
          <ShyBox position={[-2, 1, 0]} />
          <SpinningBox position={[2, 1, 0]} />
          <SupportedFeaturesPanel position={[2, 3, -3]} />
          {/* Add the SupportedSessionModesPanel component */}
          <SupportedSessionModesPanel position={[-2, 3.7, -3]} />
          <ColorChangingBox position={[1.5, 1, -2]} />
//... Previous code
```

### Conclusion
With that, we've covered all of the guards and hooks that allow you to implement conditional rendering and logic into your XR applications. Best of luck using these techniques and happy coding!

- *The example project can be found here: [Guard Example](https://pmndrs.github.io/xr/examples/guards/)*
- *Full source code for this tutorial can be found here: [Guard Example Source](https://github.com/pmndrs/xr/tree/main/examples/guards)*
