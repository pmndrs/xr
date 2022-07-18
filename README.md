<h1>@react-three/xr</h1>

[![Version](https://img.shields.io/npm/v/@react-three/xr?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/xr)
[![Downloads](https://img.shields.io/npm/dt/@react-three/xr.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/xr)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/poimandres)

React components and hooks for creating VR/AR applications with [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)

```
npm install @react-three/xr
```

## Examples

[<img height="50px" src="https://i.imgur.com/K71D3Ts.gif" />](https://codesandbox.io/s/react-xr-paddle-demo-v4uet)
[<img height="50px" src="https://i.imgur.com/5yh7LKz.gif" />](https://codesandbox.io/s/react-xr-simple-demo-8i9ro)
[<img height="50px" src="https://i.imgur.com/yuNwPpn.gif" />](https://codesandbox.io/s/react-xr-simple-ar-demo-8w8hm)
[<img height="50px" src="https://i.imgur.com/T7WKFCO.gif" />](https://codesandbox.io/s/react-xr-hands-demo-gczkp)
[<img height="50px" src="https://i.imgur.com/Cxes0Xj.gif" />](https://codesandbox.io/s/react-xr-hands-physics-demo-tp97r)

<p align="middle">
  <i>These demos are real, you can click them! They contain the full code, too.</i>
</p>

## Getting started

react-xr provides immersive `VRCanvas` and `ARCanvas` components that extend the react-three-fiber `Canvas`. These components configure an XR button and configures your scene for XR rendering and interaction.

```jsx
import { VRCanvas, ARCanvas } from '@react-three/xr'

function App() {
  return (
    <VRCanvas>
      <mesh>
        <boxGeometry />
        <meshBasicMaterial color="blue" />
      </mesh>
    </VRCanvas>
  )
}
```

See [XRCanvas](#xrcanvas) for a full list of props.

## Adding controllers to the scene

To get started with default controller models add `<DefaultXRControllers />` to your scene. It will fetch appropriate input profile models for your device from [`@webxr-input-profiles/motion-controllers`](https://github.com/immersive-web/webxr-input-profiles/tree/main/packages/motion-controllers).

```jsx
<DefaultXRControllers
  /** Optional material props to pass to controllers' ray indicators */
  rayMaterial={{ color: 'blue' }}
  /** Whether to hide controllers' rays on blur. Default is `false` */
  hideRaysOnBlur={false}
/>
```

You can access controllers' state (position, orientation, etc.) by using `useXR()` hook

```jsx
const { controllers } = useXR()

// or, via a Zustand selector
const controllers = useXR((state) => state.controllers)
```

## Interactions

To interact with objects using controllers you can use `<Interactive>` component or `useInteraction` hook. They allow adding controller event handlers to your objects.

### Interactive

`<Interactive />` wraps your objects and accepts XR controller event handlers as props. Supports `select`, `hover`, `blur` and `squeeze` events (see [XR inputsources](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Inputs#input_sources)).

```jsx
<Interactive
  /* Called when hovered by a controller */
  onHover={(event: XRInteractionEvent) => ...}
  /* Called when unhovered by a controller */
  onBlur={(event: XRInteractionEvent) => ...}
  /* Called on button press when selected by a controller */
  onSelectStart={(event: XRInteractionEvent) => ...}
  /* Called on button release when selected by a controller */
  onSelectEnd={(event: XRInteractionEvent) => ...}
  /* Called when selected by a controller */
  onSelect={(event: XRInteractionEvent) => ...}
  /* Called on button press when squeezed by a controller */
  onSqueezeStart={(event: XRInteractionEvent) => ...}
  /* Called on button release when squeezed by a controller */
  onSqueezeEnd={(event: XRInteractionEvent) => ...}
  /* Called when squeezed by a controller */
  onSqueeze={(event: XRInteractionEvent) => ...}
>
  <Box />
</Interactive>
```

### RayGrab

`<RayGrab />` is a specialized `<Interactive />` that can be grabbed and moved by controllers.

```jsx
<RayGrab>
  <Box />
</RayGrab>
```

### useInteraction

`useInteraction` subscribes an existing element to controller events.

The following interaction events are supported: `onHover`, `onBlur`, `onSelect`, `onSelectEnd`, `onSelectStart`, `onSelectMissed`, `onSqueeze`, `onSqueezeEnd`, `onSqueezeStart`, `onSqueezeMissed`.

```jsx
const boxRef = useRef()
useInteraction(boxRef, 'onSelect', (event: XRInteractionEvent) => ...)

<Box ref={boxRef} />
```

## Events

To handle controller events that are not bound to any object in the scene you can use `useXREvent` hook. This is a low-level abstraction that subscribes directly into the native XRInputSource (see [`XRInputSourceEvent`](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSourceEvent#event_types)).

```jsx
useXREvent('squeeze', (event: XRControllerEvent) => ...)
```

It supports an optional third parameter with options for filtering by handedness.

```jsx
useXREvent('squeeze', (event: XRControllerEvent) => ..., { handedness: 'left' | 'right' | 'none' })
```

## Custom XRButton and XRCanvas

react-xr includes a primitive `XRCanvas` and `XRButton` to compose your canvas and session buttons in your UI.

For example, this would be equivalent to `VRCanvas`:

```jsx
<XRButton mode="VR" sessionInit={sessionInit} />
<XRCanvas>
  // ...
</XRCanvas>
```

### XRButton

`<XRButton />` is an HTML `<button />` that can be used to init and display info for your WebXR session.

```jsx
<XRButton
  /* The type of `XRSession` to create */
  mode={'AR' | 'VR' | 'inline'}
  /**
   * `XRSession` configuration options
   * @see https://immersive-web.github.io/webxr/#feature-dependencies
   */
  sessionInit={{
    domOverlay: { root: document.body },
    optionalFeatures: ['hit-test', 'dom-overlay', 'dom-overlay-for-handheld-ar', 'local-floor', 'bounded-floor', 'hand-tracking']
  }}
  /** Whether this button should only enter an `XRSession`. Default is `false` */
  enterOnly={false}
  /** Whether this button should only exit an `XRSession`. Default is `false` */
  exitOnly={false}
>
  {/* Can accept regular DOM children and has an optional callback with the XR button status (unsupported, exited, entered) */}
  {(status) => `WebXR ${status}`}
</XRButton>
```

### XRCanvas

`<XRCanvas />` is a react-three-fiber `<Canvas />` that configures your scene for XR rendering and interaction. It is the base component of `<VRCanvas />` and `<ARCanvas />`.

```jsx
<XRCanvas
  /**
   * Enables foveated rendering. Default is `0`
   * 0 = no foveation, full resolution
   * 1 = maximum foveation, the edges render at lower resolution
   */
  foveation={0}
  /** Type of WebXR reference space to use. Default is `local-space` */
  referenceSpace="local-space"
  /** Called as an XRSession is requested */
  onSessionStart={(event: XREvent<XRManagerEvent>) => ...}
  /** Called after an XRSession is terminated */
  onSessionEnd={(event: XREvent<XRManagerEvent>) => ...}
  /** Called when an XRSession is hidden or unfocused. */
  onVisibilityChange={(event: XREvent<XRSessionEvent>) => ...}
  /** Called when available inputsources change */
  onInputSourcesChange={(event: XREvent<XRSessionEvent>) => ...}
>
  {/* All your regular react-three-fiber elements go here */}
</XRCanvas>
```

## useXR

This hook gives you access to the current WebXR state defined by `<XRCanvas />`.

```jsx
const {
  // An array of connected `XRController`
  controllers,
  // Whether the XR device is presenting in an XR session
  isPresenting,
  // Whether hand tracking inputs are active
  isHandTracking,
  // A THREE.Group representing the XR viewer or player
  player,
  // The active `XRSession`
  session,
  // `XRSession` foveation. This can be configured as `foveation` on ARCanvas or VRCanvas. Default is `0`
  foveation,
  // `XRSession` reference-space type. This can be configured as `referenceSpace` on ARCanvas or VRCanvas. Default is `local-floor`
  referenceSpace
} = useXR()
```

## `useController`

Use this hook to get an instance of the controller

```jsx
const leftController = useController('left')
```

## useHitTest

Use this hook to perform a hit test for an AR environment. Also see [`XRHitTestResult`](https://developer.mozilla.org/en-US/docs/Web/API/XRFrame/getHitTestResults).

```tsx
useHitTest((hitMatrix: Matrix4, hit: XRHitTestResult) => {
  // use hitMatrix to position any object on the real life surface
  mesh.applyMatrix4(hitMatrix)
})
```

## Hands

Add hands model for hand-tracking. Works out of the box on Oculus Browser v13, and can be enabled on versions as low as v10.2 with `#webxr-hands` experimental flag enabled.

```jsx
<VRCanvas>
  <Hands />
```

### Custom hands model

While a default model is provided, you might want to use a different model that fit your design.

It can work with any glTF model as long as they're ready for WebXR handtracking. If you don't specify a model for one hand it'll use the default one.

```jsx
<Hands modelLeft="/model-left.glb" modelRight="model-right.glb />
```

## Player

`player` group contains camera and controllers that you can use to move player around

```jsx
const { player } = useXR()

useEffect(() => {
  player.position.x += 5
}, [])
```
