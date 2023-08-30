<h1>@react-three/xr</h1>

[![Version](https://img.shields.io/npm/v/@react-three/xr?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/xr)
[![Downloads](https://img.shields.io/npm/dt/@react-three/xr.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/xr)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/poimandres)

React components and hooks for creating VR/AR applications with [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)

```bash
npm install @react-three/xr
```

## Examples

<p align="center">
  <a href="https://codesandbox.io/s/v4uet"><img width="288" height="160" src="https://i.imgur.com/K71D3Ts.gif" /></a>
  <a href="https://codesandbox.io/s/8i9ro"><img width="288" height="160" src="https://i.imgur.com/5yh7LKz.gif" /></a>
  <a href="https://codesandbox.io/s/8w8hm"><img width="288" height="160" src="https://i.imgur.com/yuNwPpn.gif" /></a>
  <a href="https://codesandbox.io/s/gczkp"><img width="288" height="160" src="https://i.imgur.com/T7WKFCO.gif" /></a>
  <a href="https://codesandbox.io/s/tp97r"><img width="288" height="160" src="https://i.imgur.com/Cxes0Xj.gif" /></a>
</p>
<p align="middle">
  <i>These demos are real, you can click them! They contain the full code, too.</i>
</p>

## Getting started

The following adds a button to start your session and controllers inside an XR manager to prepare your scene for WebXR rendering and interaction.

```jsx
import { VRButton, ARButton, XR, Controllers, Hands } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'

function App() {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <Controllers />
          <Hands />
          <mesh>
            <boxGeometry />
            <meshBasicMaterial color="blue" />
          </mesh>
        </XR>
      </Canvas>
    </>
  )
}
```

## XRButton

`<XRButton />` is an HTML `<button />` that can be used to init and display info about your WebXR session. This is aliased by `ARButton` and `VRButton` with sensible session defaults.

```jsx
<XRButton
  /* The type of `XRSession` to create */
  mode={'AR' | 'VR' | 'inline'}
  /**
   * `XRSession` configuration options
   * @see https://immersive-web.github.io/webxr/#feature-dependencies
   */
  sessionInit={{ optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'] }}
  /** Whether this button should only enter an `XRSession`. Default is `false` */
  enterOnly={false}
  /** Whether this button should only exit an `XRSession`. Default is `false` */
  exitOnly={false}
  /** This callback gets fired if XR initialization fails. */
  onError={(error) => ...}
>
  {/* Can accept regular DOM children and has an optional callback with the XR button status (unsupported, exited, entered) */}
  {(status) => `WebXR ${status}`}
</XRButton>
```

## XR

`<XR />` is a WebXR manager that configures your scene for XR rendering and interaction. This lives within a R3F `<Canvas />`.

```jsx
<Canvas>
  <XR
    /**
     * Enables foveated rendering. Default is `0`
     * 0 = no foveation, full resolution
     * 1 = maximum foveation, the edges render at lower resolution
     */
    foveation={0}
    /**
     * The target framerate for the XRSystem. Smaller rates give more CPU headroom at the cost of responsiveness.
     * Recommended range is `72`-`120`. Default is unset and left to the device.
     * @note If your experience cannot effectively reach the target framerate, it will be subject to frame reprojection
     * which will halve the effective framerate. Choose a conservative estimate that balances responsiveness and
     * headroom based on your experience.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Rendering#refresh_rate_and_frame_rate
    */
    frameRate={72 | 90 | 120}
    /** Type of WebXR reference space to use. Default is `local-floor` */
    referenceSpace="local-floor"
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
  </XR>
</Canvas>
```

### useXR

This hook gives you access to the current `XRState` configured by `<XR />`.

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
  // `XRSession` foveation. This can be configured as `foveation` on <XR>. Default is `0`
  foveation,
  // `XRSession` reference-space type. This can be configured as `referenceSpace` on <XR>. Default is `local-floor`
  referenceSpace
} = useXR()
```

To subscribe to a specific key, `useXR` accepts a [Zustand](https://github.com/pmndrs/zustand) selector:

```jsx
const player = useXR((state) => state.player)
```

## Controllers

Controllers can be added with `<Controllers />` for [motion-controllers](https://github.com/immersive-web/webxr-input-profiles/tree/main/packages/motion-controllers) and/or `<Hands />` for hand-tracking. These will activate whenever their respective input mode is enabled on-device and provide live models for a left and right `XRController`.

```jsx
<Controllers
  /** Optional material props to pass to controllers' ray indicators */
  rayMaterial={{ color: 'blue' }}
  /** Whether to hide controllers' rays on blur. Default is `false` */
  hideRaysOnBlur={false}
  /**
   * Optional environment map to apply to controller models.
   * Useful for make controllers look more realistic
   * if you don't want to apply an env map globally on a scene
   */
  envMap={Texture}
  /**
   * Optional environment map intensity to apply to controller models.
   * Useful for tweaking the env map intensity if they look too bright or dark
   */
  envMapIntensity={1}
/>
<Hands
  // Optional custom models per hand. Default is the Oculus hand model
  modelLeft="/model-left.glb"
  modelRight="/model-right.glb"
/>
```

### Environment map

You can set an environment map and/or its intensity on controller models via the `envMap` and `envMapIntensity` props of `<Controllers />`. See [ControllerEnvMap](./examples/src/demos/ControllersEnvMap.tsx) for reference.

### useController

`useController` references an `XRController` by handedness, exposing position and orientation info.

```jsx
const leftController = useController('left')
const rightController = useController('right')
const gazeController = useController('none')
```

### XRController

`XRController` is a long-living `Object3D` that represents an [`XRInputSource`](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource) with the following properties:

```jsx
index: number
controller: THREE.XRTargetRaySpace
grip: THREE.XRGripSpace
hand: THREE.XRHandSpace
inputSource: XRInputSource | null
xrControllerModel: XRControllerModel | null
```

## Interactions

To interact with objects using controllers you can use `<Interactive />` component or `useInteraction` hook. They allow adding controller event handlers to your objects.

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
  /* Called on button release when another interactive is selected by a controller */
  onSelectMissed={(event: XRInteractionEvent) => ...}
  /* Called when selected by a controller */
  onSelect={(event: XRInteractionEvent) => ...}
  /* Called on button press when squeezed by a controller */
  onSqueezeStart={(event: XRInteractionEvent) => ...}
  /* Called on button release when squeezed by a controller */
  onSqueezeEnd={(event: XRInteractionEvent) => ...}
  /* Called on button release when another interactive is squeezed by a controller */
  onSqueezeMissed={(event: XRInteractionEvent) => ...}
  /* Called when squeezed by a controller */
  onSqueeze={(event: XRInteractionEvent) => ...}
  /* Called when a controller moves over the object, equivalent to pointermove */
  onMove={(event: XRInteractionEvent) => ...}
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

The following interaction events are supported: `onHover`, `onBlur`, `onSelect`, `onSelectEnd`, `onSelectStart`, `onSelectMissed`, `onSqueeze`, `onSqueezeEnd`, `onSqueezeStart`, `onSqueezeMissed`, `onMove`.

```jsx
const boxRef = useRef()
useInteraction(boxRef, 'onSelect', (event: XRInteractionEvent) => ...)

<Box ref={boxRef} />
```

### useHitTest

Use this hook to perform a hit test for an AR environment. Also see [`XRHitTestResult`](https://developer.mozilla.org/en-US/docs/Web/API/XRFrame/getHitTestResults).

```tsx
useHitTest((hitMatrix: Matrix4, hit: XRHitTestResult) => {
  // use hitMatrix to position any object on the real life surface
  hitMatrix.decompose(mesh.position, mesh.quaternion, mesh.scale)
})
```

### useXREvent

To handle controller events that are not bound to any object in the scene you can use `useXREvent` hook. This is a low-level abstraction that subscribes directly into the native XRInputSource (see [`XRInputSourceEvent`](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSourceEvent#event_types)).

```jsx
useXREvent('squeeze', (event: XRControllerEvent) => ...)
```

It supports an optional third parameter with options for filtering by handedness.

```jsx
useXREvent('squeeze', (event: XRControllerEvent) => ..., { handedness: 'left' | 'right' | 'none' })
```

### Custom XRButton

While you can customize XRButton, there's a way to shave off `react-dom` and customize it even more. For this there's a couple of low-level utilities of a headless xr button: `startSession`, `stopSession` and `toggleSession`.

```jsx
import { toggleSession } from '@react-three/xr'

const handleClick = async () => {
  const session = await toggleSession('immersive-vr')
  if (session) {
    button.innerText = 'Exit VR'
  } else {
    button.innerText = 'Enter VR'
  }
}

const button = document.createElement('button')
button.innerText = 'Enter VR'
button.addEventListener('click', handleClick)
document.appendChild(button)
```

## Teleportation

To facilitate instant or accessible movement, react-xr provides teleportation helpers.

### TeleportationPlane

A teleportation plane with a marker that will teleport on interaction.

```jsx
import { TeleportationPlane } from '@react-three/xr'
;<TeleportationPlane
  /** Whether to allow teleportation from left controller. Default is `false` */
  leftHand={false}
  /** Whether to allow teleportation from right controller. Default is `false` */
  rightHand={false}
  /** The maximum distance from the camera to the teleportation point. Default is `10` */
  maxDistance={10}
  /** The radial size of the teleportation marker. Default is `0.25` */
  size={0.25}
/>
```

### useTeleportation

Returns a `TeleportCallback` to teleport the player to a position.

```jsx
import { useTeleportation } from '@react-three/xr'

const teleport = useTeleportation()

teleport([x, y, z])
teleport(new THREE.Vector3(x, y, z))
```

## Built with react-xr

- <a href="https://github.com/richardanaya/avatar-poser"><img src="https://raw.githubusercontent.com/richardanaya/avatar-poser/main/public/avatar-poser.png" alt="Avatar Poser github link" width="100"/></a>
