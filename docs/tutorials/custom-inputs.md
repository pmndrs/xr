---
title: Customizing Components
description: Customize interactions and style of inputs such as hands, controllers, and more
nav: 16
---

@react-three/xr provides a set of default hands, controllers, transient pointers, gazes, and a screen input. All of these defaults can be configured or completely exchanged with your own implementations. The following tutorial will teach you the basics of customizing these components in react-three/xr. 

### Setup
Like many of the other tutorials, we'll start with this basic scene. Create your new React project and add the following to your `App.tsx` file and your `styles.css` files respectively:

**App.tsx:**
```tsx
import { Box, OrbitControls, Plane } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
import { useState } from 'react'
import * as THREE from 'three'
import './styles.css'

const store = createXRStore()

const axisColor = new THREE.Color('#9d3d4a')
const gridColor = new THREE.Color('#4f4f4f')

export function App() {
  const [boxColor, setBoxColor] = useState('orange')

  const onBoxClick = () => {
    setBoxColor(boxColor === 'orange' ? 'purple' : 'orange')
  }

  return (
    <div className="App">
      <Canvas camera={{ position: [5, 3, 5] }}>
        <color attach={'background'} args={['#3f3f3f']} />
        <gridHelper args={[50, 50, axisColor, gridColor]} />
        <XR store={store}>
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={'darkgreen'} />
          </Plane>
          <Box onClick={onBoxClick} position={[0, 2, -1]}>
            <meshBasicMaterial color={boxColor} />
          </Box>
        </XR>
        <OrbitControls />
      </Canvas>
      <button onClick={() => store.enterVR()}>{'Enter VR'}</button>
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
The purpose of this section is to demonstrate how to modify the default implementation of components already included with @react-three/xr. Often the default implementations are sufficient for most applications, but just need some minor tweaking to get them to work how you want them to. We're going to start nice and easy here by changing the color of the ray pointer for our hand. This can be done by passing in options to the `createXRStore` function. In your `App.tsx` file replace the existing `createXRStore` call with the following:

**App.tsx:**
```tsx
//Previous Code ...
const store = createXRStore({ hand: { rayPointer: { rayModel: { color: 'red' } } } })
//Previous Code ...
```

Running your application should now show a red `rayPointer` instead of the default white one. Let's go a step further and modify the behavior of the default hand implementation by adding a touch interaction to the pinky finger. To do this, we need to create a new `CustomHand` component which we will pass into the `createXRStore` function. Create a new file called `CustomHand.tsx` and add the following code:

**CustomHand.tsx:**
```tsx
import { defaultTouchPointerOpacity, PointerCursorModel, useTouchPointer, useXRInputSourceStateContext, XRHandModel, XRSpace } from '@react-three/xr'
import { Suspense, useRef } from 'react'
import { Object3D } from 'three'

export function CustomHand() {
  const state = useXRInputSourceStateContext('hand')
  const pinkyFingerRef = useRef<Object3D>(null)
  const pointer = useTouchPointer(pinkyFingerRef, state)

  return (
    <>
      <XRSpace ref={pinkyFingerRef} space={state.inputSource.hand.get('pinky-finger-tip')!} />
      <Suspense>
        <XRHandModel />
      </Suspense>
      <PointerCursorModel pointer={pointer} opacity={defaultTouchPointerOpacity} />
    </>
  )
}
```

There's a lot to unpack here, so let's take a second to go through it.
  - `useXRInputSourceStateContext('hand')`: This is a hook that gives access to the state of the hand input source.
  - `useTouchPointer()`: This hook allows us to create a touch pointer, and attach it to a specific reference space.
  - `XRHandModel`: This component is the default hand model provided by @react-three/xr. By including it here, we get the default hand with our custom touch interaction included with it.

With our `CustomHand` component created, we can now pass it into the `createXRStore` function like so:

**App.tsx:**
```tsx
//Previous Code...
import { CustomHand } from './CustomHand'
//Previous Code...

const store = createXRStore({ hand: CustomHand })
//Previous Code...
```

With our custom hand component passed into the store, we can now use our pinky finger touch pointer to change the color of the box in our scene.


### Custom Models
So far we've seen how to tweak the default implementation, and how to add interactions onto the default models, but what if we want to add our own custom models for the hands? Adding a custom model is tricky, but not impossible. Technically any gltf should be fine, however, if you want it to animate, then it will need to have the necessary armature, and the bones will need to be named correctly. If you are interested in creating your own animated hand model, the easiest way to do so would be to start with the [default hand model gltf found here](https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/generic-hand/). This model has the correct armature and bone names to work with WebXR, so you can use it as a starting point, or as a template for your own model. When you have your model ready, you can use the starting code for the default hand as a base, and load in your model instead of the default one. The default implementation is found [here](https://github.com/pmndrs/xr/blob/main/packages/react/xr/src/hand.tsx). For this tutorial, we'll keep things simple and just use a sphere to represent our hand. Create a new file called `CustomHandModel.tsx` and add the following code:

**CustomHandModel.tsx:**

```tsx
import { Sphere } from '@react-three/drei'

export function CustomHandModel() {
  return (
    <group>
      <Sphere args={[0.05, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial color="blue" />
      </Sphere>
    </group>
  )
}
```

once we have our custom hand model, swap it out for our `CustomHand` in the `app.tsx`. 

**App.tsx:**

```tsx
//Previous Code ...
import { CustomHandModel } from './CustomHandModel'
//Previous Code ...

const store = createXRStore({ hand: CustomHandModel })
//Previous Code ...
```

With that done, we should now have blue spheres representing our hands in our scene.


### Where to go from here?

There are many more ways to customize the functionality of `@react-three/xr`. Most of the concepts shown in this tutorial can be applied to building custom controllers, transient pointers, gaze, and screen input implementations as needed for your own applications. All you have to do is find the default implementation, then tweak or replace it as necessary. Good luck, and as always, happy coding! 

- *The example project can be found here: [Customization Example](https://pmndrs.github.io/xr/examples/customizing-models/)*
- *Full source code for this tutorial can be found here: [Customization Example Source](https://github.com/pmndrs/xr/tree/main/examples/customizing-models)*