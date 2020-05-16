# react-xr

[![npm version](https://badge.fury.io/js/react-xr.svg)](https://badge.fury.io/js/react-xr) ![npm](https://img.shields.io/npm/dt/react-xr.svg)

WebXR + react-three-fiber

React components and hooks for creating VR/AR/XR applications with [react-three-fiber](https://github.com/react-spring/react-three-fiber)

**Note: Extremely early in development. Contributors welcome!**

<p align="center">
  <a href="https://codesandbox.io/s/react-xr-paddle-demo-v4uet"><img width="288" src="https://i.imgur.com/K71D3Ts.gif" /></a>
  <a href="https://codesandbox.io/s/react-xr-simple-demo-8i9ro"><img width="288" src="https://i.imgur.com/5yh7LKz.gif" /></a>
</p>

## Installation

```
npm install react-xr
```

## Getting started

Enable VR in the `Canvas` component, add VR button and add `XR` component at the root of your application. This will provide context for XR related state.

```js
import { XR } from 'react-xr'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'

function App() {
  return (
    <Canvas
      vr
      colorManagement
      onCreated={({ gl }) => {
        document.body.appendChild(VRButton.createButton(gl))
      }}>
      <XR>{/* All the stuff goes here */}</XR>
    </Canvas>
  )
}
```

## Adding controllers to the scene

You can access controllers' state (position, orientation, etc.) by using `useXR()` hook

```js
const { controllers } = useXR()
```

To get started with default controller models add `DefaultXRControllers` component. It will fetch appropriate input profile models. You can learn more [here](https://github.com/immersive-web/webxr-input-profiles/tree/master/packages/motion-controllers).

```js
import { XR, DefaultXRControllers } from 'react-xr'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'

function App() {
  return (
    <Canvas
      vr
      colorManagement
      onCreated={({ gl }) => {
        document.body.appendChild(VRButton.createButton(gl))
      }}>
      <XR>
        <DefaultXRControllers />
      </XR>
    </Canvas>
  )
}
```

## API

### XR

Context for all XR related state

```js
import { XR } from 'react-xr'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'

function App() {
  return (
    <Canvas
      vr
      colorManagement
      onCreated={({ gl }) => {
        document.body.appendChild(VRButton.createButton(gl))
      }}>
      <XR>{/* All the stuff goes here */}</XR>
    </Canvas>
  )
}
```

### useXR

Hook that can only beused by components insde <XR> component.

```js
const { controllers } = useXR()
```

Controllers is an array of `XRController` objects

```js
interface XRController {
  grip: Group
  controller: Group
  inputSource?: XRInputSource
  // ...
  // more in XRController.ts
}
```

`grip` and `controller` are ThreeJS groups that have the position and orientation of xr controllers. `grip` has an orientation that should be used to render virtual objects such that they appear to be held in the user’s hand and `controller` has an orientation of the preferred pointing ray.

`inputSource` is the WebXR input source [(MDN)](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource). Note that it will not be available before controller is connected.

### useXREvent

Every controller emits following events: select, selectstart, selectend, squeeze, squeezestart, squeezeend.

To listen to those events use `useXREvent` hook:

```js
const onSqueeze = useCallback(() => console.log('Squeezed'), [])

useXREvent('squeeze', onSqueeze)
```

it supports optional third parameter with options

```js
const onSqueeze = useCallback(() => console.log('Left controller squeeze'), [])

useXREvent('squeeze', onSqueeze, { handedness: 'left' })
```

### Interactions

`react-xr` comes with built-in high level interaction components.

#### `<Hover>`

`Hover` component will allow you for detecting when ray shot from the controllers is pointing at the given mesh.

```js
<Hover onChange={(value) => console.log(value ? 'hovered' : 'blurred')}>{/* your mesh here */}</Hover>
```

#### `<Select>`

`Select` can be used when you need to select some mesh. Component will trigger `onSelect` function when controller is pointing at the given mesh and `select` event was fired.

```js
<Select onSelect={() => console.log('selected')}>{/* your mesh here */}</Select>
```
