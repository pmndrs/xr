<h1>@react-three/xr</h1>

[![Version](https://img.shields.io/npm/v/@react-three/xr?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/xr)
[![Downloads](https://img.shields.io/npm/dt/@react-three/xr.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/xr)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/poimandres)

React components and hooks for creating VR/AR applications with [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)

```
npm install @react-three/xr
```

<p align="center">
  <a href="https://codesandbox.io/s/react-xr-paddle-demo-v4uet"><img width="390" src="https://i.imgur.com/K71D3Ts.gif" /></a>
  <a href="https://codesandbox.io/s/react-xr-simple-demo-8i9ro"><img width="390" src="https://i.imgur.com/5yh7LKz.gif" /></a>
  <a href="https://codesandbox.io/s/react-xr-simple-ar-demo-8w8hm"><img height="221" src="https://i.imgur.com/yuNwPpn.gif" /></a>
  <a href="https://codesandbox.io/s/react-xr-hands-demo-gczkp"><img height="221" src="https://i.imgur.com/T7WKFCO.gif" /></a>
  <a href="https://codesandbox.io/s/react-xr-hands-physics-demo-tp97r"><img height="221" src="https://i.imgur.com/Cxes0Xj.gif" /></a>
</p>

<p align="middle">
  <i>These demos are real, you can click them! They contain the full code, too.</i>
</p>

## Getting started

Add `VRCanvas` or `ARCanvas` component (or replace your existing react-three-fiber `Canvas` component)

```jsx
import { VRCanvas } from '@react-three/xr'

function App() {
  return (
    <VRCanvas>
      {/* All your regular react-three-fiber elements go here */}
    </VRCanvas>
```

## Adding controllers to the scene

To get started with default controller models add `DefaultXRControllers` component. It will fetch appropriate input profile models. You can learn more [here](https://github.com/immersive-web/webxr-input-profiles/tree/main/packages/motion-controllers).

```jsx
import { VRCanvas, DefaultXRControllers } from '@react-three/xr'

<VRCanvas>
  <DefaultXRControllers />
```

You can access controllers' state (position, orientation, etc.) by using `useXR()` hook

```jsx
const { controllers } = useXR()
```

## Interactions

To interact with objects using controllers you can use `<Interactive>` component or `useInteraction` hook. They allow adding handlers to your objects. All interactions are use rays that are shot from the controllers.

### `<Interactive>`

Use this component to wrap your objects and pass handlers as props. Supports select, hover, blur and squeeze events.

```jsx
const [isHovered, setIsHovered] = useState(false)

return (
  <Interactive onSelect={() => console.log('clicked!')} onHover={() => setIsHovered(true)} onBlur={() => setIsHovered(false)}>
    <Box />
  </Interactive>
)
```

### `<RayGrab>`

Wrap any object with a `RayGrab` component to make it grabbable

```jsx
<RayGrab>
  <Box />
</RayGrab>
```

### `useInteraction`

Attach handler to an existing object in a scene

```jsx
const ref = useResource()

useInteraction(ref, 'onSelect', () => console.log('selected!'))

return <Box ref={ref} />
```

## Events

To handle controller events that are not bound to any object in the scene you can use `useXREvent()` hook.

Every controller emits following events: select, selectstart, selectend, squeeze, squeezestart, squeezeend.

```jsx
useXREvent('squeeze', (e) => console.log('squeeze event has been triggered'))
```

it supports optional third parameter with options

```jsx
useXREvent('squeeze', () => console.log('Left controller squeeze'), { handedness: 'left' })
```

## VRCanvas, ARCanvas componentss

Extended react-three-fiber [Canvas](https://docs.pmnd.rs/react-three-fiber/api/canvas) that includes:

- Button to start VR session
- Color management
- VR Mode
- react-xr context

For VR apps use `VRCanvas` and for AR apps use `ARCanvas`

```jsx
import { VRCanvas } from '@react-three/xr'

<VRCanvas>
  {/* All your regular react-three-fiber elements go here */}
```

## `useXR`

Hook that can only be used by components inside `XRCanvas` component.

```jsx
const { controllers, player, isPresenting } = useXR()
```

Controllers is an array of `XRController` objects

```jsx
interface XRController {
  grip: Group
  controller: Group
  inputSource: XRInputSource
  // ...
  // more in XRController.ts
}
```

`grip` and `controller` are ThreeJS groups that have the position and orientation of xr controllers. `grip` has an orientation that should be used to render virtual objects such that they appear to be held in the user’s hand and `controller` has an orientation of the preferred pointing ray.

<img width="200" height="200" src="https://i.imgur.com/3stLjfR.jpg" />

`inputSource` is the WebXR input source [(MDN)](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource). Note that it will not be available before controller is connected.

## `useXRFrame`

Accepts a callback which will be invoked in the animation loop of an active XR session.
[(MDN)](https://developer.mozilla.org/en-US/docs/Web/API/XRSession/requestAnimationFrame)

```jsx
useXRFrame((time, xrFrame) => {
  // do something on each frame of an active XR session
})
```

## `useController`

Use this hook to get an instance of the controller

```jsx
const leftController = useController('left')
```

## useHitTest

[codesandbox](https://codesandbox.io/s/react-xr-usehittest-demo-5iff9?file=/src/App.tsx)

Use this hook to perform a hit test for an AR environment

To enable hit testing in your AR app add `sessionInit` prop to `ARCanvas` like this

```jsx
<ARCanvas sessionInit={{ requiredFeatures: ['hit-test'] }}>
```

And then in your component handle hit with `useHitTest` hook

```jsx
useHitTest((hitMatrix, hit) => {
  // use hitMatrix to position any object on the real life surface
})
```

## `<Hands>`

Add hands model for hand-tracking. Works out of the box on Oculus Browser v13, and can be enabled on versions as low as v10.2 with #webxr-hands experimental flag enabled.

```jsx
<VRCanvas>
  <Hands />
```

### Custom hands model

While a default model is provided, you might want to use a different model that fit your design.
It can work with any glTF model as long as they're ready for WebXR handtracking. If you don't specify a model for one hand it'll use the default one.

```jsx
<Hands modelLeft={'/model_left.gltf'} modelRight={'/model_right.glb'} />
```

## Player

`player` group contains camera and controllers that you can use to move player around

```jsx
const { player } = useXR()

useEffect(() => {
  player.position.x += 5
}, [])
```
