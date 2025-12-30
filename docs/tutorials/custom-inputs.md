---
title: Custom Hands/Controllers/...
description: Customize interactions and style of inputs such as hands, controllers, and more
nav: 16
---

@react-three/xr provides a set of default hands, controllers, transient pointers, gazes, and a screen input that can be configured and completely exchanged with your own implementations. The following tutorial will teach you how to swap out each piece with your own implementations. 

### Setup
Like many of the other tutorials, we'll start with this basic scene. Create your new React project and add the following to your `App.tsx` file and your `styles.css` files respectively:

**App.tsx:**
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
  bottom: 1rem;
  left: 50%;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 1);
  transform: translate(-50%, 0);
}
```

### Modifying Default Implementations
The purpose of this section is to demonstrate how to modify the default implementation of components already included with @react-three/xr. Often the default implementations are sufficient for most applications, but just need some minor tweaking to get them to work how you want them to. We're going to start nice and easy here by chaniging the color of the ray pointer on the default hand implementation. This can be done by passing in options to the `createXRStore` function like so:

**App.tsx:**
```tsx
const store = createXRStore({ hand: { rayPointer: { rayModel: { color: 'red' } } } })
```

Running your application should now show a red Ray Pointer instead of the default white one. Let's go a step further and modify the behavior of the default hand implementation by adding a touch interaction to the pinky finger. To do this, we need to create a new `CustomHand` component which we will pass into the `createXRStore` function. Create a new file called `CustomHand.tsx` and add the following code:

**CustomHand.tsx:**
```tsx
import { defaultTouchPointerOpacity, PointerCursorModel, useTouchPointer, useXRInputSourceStateContext, XRHandModel, XRSpace } from '@react-three/xr'
import { Suspense, useRef } from 'react'
import { Object3D } from 'three'

export function CustomHand() {
  const state = useXRInputSourceStateContext('hand')
  const middleFingerRef = useRef<Object3D>(null)
  const pointer = useTouchPointer(middleFingerRef, state)

  return (
    <>
      <XRSpace ref={middleFingerRef} space={state.inputSource.hand.get('middle-finger-tip')!} />
      <Suspense>
        <XRHandModel />
      </Suspense>
      <PointerCursorModel pointer={pointer} opacity={defaultTouchPointerOpacity} />
    </>
  )
}
```

There's a lot to unpack here, so let's take a second to go through it.

// TODO: Continue from here








## Custom Hand

Let's build our own hand implementation which renders the normal hand model but only has a touch interaction which works using the middle finger.

First we're getting the state of the hand, creating a reference to the position of the middle finger, and creating a touch pointer.

```tsx
const state = useXRInputSourceStateContext('hand')
const middleFingerRef = useRef<Object3D>(null)
const pointer = useTouchPointer(middleFingerRef, state)
```

Next, we use the `state` to place an `XRSpace` for setting up the `middleFingerRef` and add an `XRHandModel` and `PointerCursorModel` to render the hand and a cursor visualization.

```tsx
<XRSpace ref={middleFingerRef} space={state.inputSource.hand.get('middle-finger-tip')!}/>
<Suspense>
  <XRHandModel />
</Suspense>
<PointerCursorModel pointer={pointer} opacity={defaultTouchPointerOpacity} />
```

<details>
  <summary>Full Code</summary>

```tsx
export function CustomHand() {
  const state = useXRInputSourceStateContext('hand')
  const middleFingerRef = useRef<Object3D>(null)
  const pointer = useTouchPointer(middleFingerRef, state)
  return (
    <>
      <XRSpace ref={middleFingerRef} space={state.inputSource.hand.get('middle-finger-tip')!} />
      <Suspense>
        <XRHandModel />
      </Suspense>
      <PointerCursorModel pointer={pointer} opacity={defaultTouchPointerOpacity} />
    </>
  )
}
```

</details>

This tutorial also applies to building custom controllers, transient pointers, gaze, and screen input implementations.
