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

### `useSessionSupported`

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

## Space

@react-three/xr provides several hooks to synchronize the space provided by WebXR with the scene.

### `useXRReferenceSpace`

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

### `useXRInputSourceEvent`

Hook for listening to xr input source events.

## Inputs

Building custom inputs requires access and bindings to the events. The following hook allow to access the inputs state and bind function to events.

### `useXRControllerButtonEvent`

Hook for subscribing to a button state change event on the controller.

- `id`: ID of the button.
- `onChange`: callback that gets executed when the state of the button changes.
- `handedness`: handedness of the controller.

### `useXRControllerState`

Hook for getting the XR controller state.

- `handedness`: (optional) the handedness that the XR controller state should have.

### `useXRGazeState`

Hook for getting the gaze state.

### `useXRHandState`

Hook for getting the XR hand state.

- `handedness`: (optional) the handedness that the XR hand state should have.

### `useXRTransientPointerState`

Hook for getting the transient-pointer state.

- `handedness`: (optional) the handedness that the XR transient pointer state should have.

### `useXRScreenInputState`

Hook for getting the screen-input state.

## Object Detection

@react-three/xr exposes WebXR's object detection capabilities for meshes and planes. The following functions allow to access these WebXR primitives inside of the components responsible for rendering these detected object and retrieving their geometry.

### `useXRMesh`

Hook for getting the detected mesh in the current context.

### `useXRMeshGeometry`

Hook for getting the geometry from the detected mesh.

- `mesh`: the detected mesh.
- `disposeBuffer`: allows to disable auto disposing the geometry buffer.

### `useXRMeshes`

Hook for getting all detected meshes with the provided semantic label.

### `useXRPlane`

Hook for getting the detected plane in the current context.

### `useXRPlaneGeometry`

Hook for getting the geometry from the detected plane.

- `plane`: the detected plane.
- `disposeBuffer`: allows to disable auto disposing the geometry buffer.

### `useXRPlanes`

Hook for getting all detected planes with the provided semantic label.