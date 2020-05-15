# react-xr

React components and hooks for creating VR/AR/XR applications with [react-three-fiber](https://github.com/react-spring/react-three-fiber)

**Note: Extremely early in development. Contributors welcome!**

## Installation

```
npm install react-xr
```

## Getting started

Enable VR in the `Canvas` component, add VR button and add `XR` component at the root of your application. This will provide context for XR related state.

```js
import { XR } from 'react-xr'

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
import { XR } from 'react-xr'

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
