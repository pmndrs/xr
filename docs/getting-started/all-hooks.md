---
title: All Hooks
description: Overview of all hooks offered by @react-three/xr.
nav: 6
---

### `useXR`

Hook for reading the state from the XR store.

### `useXRStore`

Hook for getting the XR store from the context.

### `useInitRoomCapture`

Hook for getting the function to initialize the room capture for scanning the room.

### `useSessionModeSupported`

Hook for checking if a session mode is supported.

- `onError`: callback executed when an error happens while checking if the session mode is supported.

### `useXRSessionVisibilityState`

Hook for getting the session visibility state.

### `useXRHitTestSource`

Hook for creating a hit test source originating from the provided object or xr space.

### `useXRHitTest`

Hook that allows to set up a continous hit test originating from the provided object or xr space.

### `useXRRequestHitTest`

Hook that returns a function to request a single hit test.


### `useRequestXRAnchor`

Hook that returns a function that allows to request a xr anchor.

### `useXRAnchor`

Hook for requesting and storing a single xr anchor.

## Inputs

Inputs are a key aspect of react-three/fiber. The following hooks provide access to inputs, xr input source events, their state, and more.


### `useXRInputSourceEvent`

Hook for listening to xr input source events.

### `useXRInputSourceStateContext`

Hook for getting the XR input source state inside of a component that renders the input source. For example, the `DefaultXRHand` uses this hook to get the state of the hand it renders using `useXRInputSourceStateContext("hand")`.

- `type`: the type that the input source state should have (e.g. `"hand"`)

### `useXRInputSourceState`

Hook for getting the XR input source state.

- `type`: the type that the input source state should have (e.g. `"hand"`)
- `handedness`: (optional) the handedness that the XR input source state should have.

### `useXRControllerButtonEvent`

Hook for subscribing to a button state change event on the controller.

- `controller`: the xr controller state.
- `id`: ID of the button.
- `onChange`: callback that gets executed when the state of the button changes.

## Space

@react-three/xr provides several hooks to synchronize the space provided by WebXR with the scene.

### `useXRSpace`

Hook for retrieving the XR reference space from the context.

### `useApplyXRSpaceMatrix`

Hook that applies the transformation of the provided XR space to the provided object reference.

- `onFrame`: optional callback that gets executed after the matrix of the reference object is updated.
- Requires that `matrixAutoUpdate` is disabled for the referenced object.

### `useGetXRSpaceMatrix`

Hook that returns a function to compute a matrix that contains the transformation of the provided XR space.

## Pointers

### `useTouchPointer`

Hook for creating a touch pointer.

### `useGrabPointer`

Hook for creating a grab pointer.

### `useRayPointer`

Hook for creating a ray pointer.

### `usePointerXRInputSourceEvents`

Hook for binding the XR session events such as `selectstart` to the provided pointer down/up events.


## Object Detection

@react-three/xr exposes WebXR's object detection capabilities for meshes and planes. The following functions allow to access these WebXR primitives inside of the components responsible for rendering these detected object and retrieving their geometry.

### `useXRMeshGeometry`

Hook for getting the geometry from the detected mesh.

- `mesh`: the detected mesh.
- `disposeBuffer`: allows to disable auto disposing the geometry buffer.

### `useXRMeshes`

Hook for getting all detected meshes with the provided semantic label.

### `useXRPlaneGeometry`

Hook for getting the geometry from the detected plane.

- `plane`: the detected plane.
- `disposeBuffer`: allows to disable auto disposing the geometry buffer.

### `useXRPlanes`

Hook for getting all detected planes with the provided semantic label.

### `useXRControllerLocomotion`

Hook for abstracting boilerplate needed to use controller based locomotion in XR.

  - `target`: Either a `THREE.Group` ref, or a callback function. Recieves movement input. (required)
  - `translationOptions`: 
    - `speed`: The speed at which the user moves.
  - `rotationOptions`: 
    - `deadZone`: How far the joystick must be pushed to trigger a turn.
    - `type`: Controls how rotation using the controller functions. Can be either 'smooth' or 'snap'.
      - `degrees`: If `rotationType` is 'snap', this specifies the number of degrees to snap the user's view by.
      - `speed`: If `rotationType` is 'smooth', this specifies the speed at which the user's view rotates.
  - `translationController`: Specifies which hand will control the translation. Can be either 'left' or 'right' (i.e. `XRHandedness`).

```tsx
// Example showing basic usage
export const userMovement = () => {
  const originRef = useRef<THREE.Group>(null);
   useXRControllerLocomotion(originRef);
  return <XROrigin ref={originRef} />
}

// Example using rapier physics
export const userMovementWithPhysics = () => {
  const userRigidBodyRef = useRef<RapierRigidBody>(null);

  const userMove = (inputVector: Vector3, rotationInfo: Euler) => {
    if (userRigidBodyRef.current) {
      const currentLinvel = userRigidBodyRef.current.linvel()
      const newLinvel = { x: inputVector.x, y: currentLinvel.y, z: inputVector.z }
      userRigidBodyRef.current.setLinvel(newLinvel, true)
      userRigidBodyRef.current.setRotation(new Quaternion().setFromEuler(rotationInfo), true)
    }
  }

  useXRControllerLocomotion(userMove)

  return <>
    <RigidBody
      ref={userRigidBodyRef}
      colliders={false}
      type='dynamic'
      position={[0, 2, 0]}
      enabledRotations={[false, false, false]}
      canSleep={false}
    >
      <CapsuleCollider args={[.3, .5]} />
      <XROrigin position={[0, -1, 0]} />
    </RigidBody>
}
```

## Controller model and layout

@react-three/xr exposes some hook to load controller models and layouts without actual xr controllers for building controller demos/tutoials.

### `useLoadXRControllerLayout`

Hook for loading a controller layout, which contains info about the controller model and its buttons / controls. For xr controllers provided through WebXR the layout is loaded and provided through the controller state automatically, therefore, this hook's purpose is for building controller demos/tutorials. 

### `useLoadXRControllerModel`

Hook for loading a controller model using the handedness and the controller layout.
