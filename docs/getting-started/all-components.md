---
title: All Components
description: Overview of all components offered by @react-three/xr.
nav: 4
---

### `XR`

Core XR component for connecting the XR store with the scene. It provides the XR store to its children.

### `XROrigin`

Component for setting the origin of the player (their feet).

### `XRControllerComponent`

Component for placing content in the controller, anchored at a specific component such as the Thumbstick.

- `id`: The ID of the component (e.g., `"a-button"`).
- `onPress`: Optional callback to be invoked when the component is pressed.
- `onRelease`: Optional callback to be invoked when the component is released.

Allows children to be placed inside for purposes such as visualizing a tooltip over the button.

### `XRControllerModel`

Component for rendering a 3D model for the XRController.

- `colorWrite`: Property to configure color writing.
- `renderOrder`: Property to configure render order.

### `XRHandJoint`

Component for placing content in the hand, anchored at a specific joint such as the index fingertip.

- `joint`: The name of the joint (e.g., `"wrist"`).

Allows children to be placed inside for purposes such as visualizing a tooltip over the index fingertip.

### `XRHandModel`

Component for rendering a 3D model for the XRHand.

- `colorWrite`: Property to configure color writing.
- `renderOrder`: Property to configure render order.

### `XRMeshModel`

Component for rendering a mesh for the XRMesh based on the detected mesh geometry.

### `XRPlaneModel`

Component for rendering a mesh for the XRPlane based on the detected plane geometry.

### `XRSpace`

Component that positions its children in the provided space.

### `TeleportTarget`

Component that allows to declare its children as teleport targets.

### `XRHitTest`

Component that allows to emit hit tests from its position in the scene graph.

## Pointer

The core interaction concept is based on (touch/grab/ray) pointers.

### `CombinedPointer`

Component for combining multiple pointers into one so that only one pointer is active at each time.

### `PointerCursorModel`

Component for rendering a cursor for a pointer.

### `PointerRayModel`

Component for rendering a ray for a pointer.

## Defaults

@react-three/xr provides extensible and configurable default implementations for different interaction methods such as touching that can all be exchanged with custom implementations.

### `DefaultXRHandGrabPointer`

Default implementation for a grab pointer for the XRHand.

- `clickThresholdMs`: Time in milliseconds between pointerdown and pointerup to trigger a click event.
- `dblClickThresholdMs`: Time in milliseconds between the first click and the second click to trigger a dblclick event.
- `contextMenuButton`: The button that triggers context menu events.
- `makeDefault`: Used to set the default pointer inside a combined pointer.
- `cursorModel`: Properties for configuring how the cursor should look.
- `radius`: The size of the intersection sphere.

### `DefaultXRControllerGrabPointer`

Default implementation for a grab pointer for the XRController.

- `clickThresholdMs`: Time in milliseconds between pointerdown and pointerup to trigger a click event.
- `dblClickThresholdMs`: Time in milliseconds between the first click and the second click to trigger a dblclick event.
- `contextMenuButton`: The button that triggers context menu events.
- `makeDefault`: Used to set the default pointer inside a combined pointer.
- `cursorModel`: Properties for configuring how the cursor should look.
- `radius`: The size of the intersection sphere.

### `DefaultXRInputSourceRayPointer`

Default implementation for a ray pointer for any XRInputSource.

- `clickThresholdMs`: Time in milliseconds between pointerdown and pointerup to trigger a click event.
- `dblClickThresholdMs`: Time in milliseconds between the first click and the second click to trigger a dblclick event.
- `contextMenuButton`: The button that triggers context menu events.
- `makeDefault`: Used to set the default pointer inside a combined pointer.
- `radius`: The size of the intersection sphere.
- `minDistance`: Minimal distance to trigger interactions.
- `linePoints`: The points that make up the shape of the ray. If undefined, the ray goes in a straight line.
- `direction`: The direction of the ray.
- `rayModel`: Properties for configuring how the ray should look.
- `cursorModel`: Properties for configuring how the cursor should look.

### `DefaultXRInputSourceTeleportPointer`

Default telport pointer implementation for all XRInputSources. This component should be used for implementing teleporting because it emits a downwards bend ray that only interesects with meshes marked as teleportable.

- `clickThesholdMs`: The time in milliseconds between pointerdown and pointerup to trigger a click event.
- `dblClickThresholdMs`: The time in milliseconds between the first click and the second click to trigger a dblclick event.
- `contextMenuButton`: The button that triggers contextmenu events.
- `makeDefault`: Used to set the default pointer inside a combined pointer.
- `radius`: The size of the intersection sphere.
- `minDistance`: Minimal distance to trigger interactions.
- `direction`: The direction of the ray.
- `rayModel`: The properties for configuring how the ray should look.
- `cursorModel`: The properties for configuring how the cursor should look.

### `DefaultXRHandTouchPointer`

Default implementation for a touch pointer for the XRHand.

- `clickThresholdMs`: Time in milliseconds between pointerdown and pointerup to trigger a click event.
- `dblClickThresholdMs`: Time in milliseconds between the first click and the second click to trigger a dblclick event.
- `contextMenuButton`: The button that triggers context menu events.
- `makeDefault`: Used to set the default pointer inside a combined pointer.
- `cursorModel`: Properties for configuring how the cursor should look.
- `hoverRadius`: The size of the intersection sphere.
- `downRadius`: The distance to the touch center to trigger a pointerdown event.
- `button`: The ID of the button that is triggered when touching.

### `DefaultXRController`

Default controller implementation with grab and ray pointers.

- `model`: Options for configuring the controller appearance.
- `grabPointer`: Options for configuring the grab pointer.
- `rayPointer`: Options for configuring the ray pointer.

### `DefaultXRHand`

Default hand implementation with touch, grab, and ray pointers.

- `model`: Options for configuring the hand appearance.
- `grabPointer`: Options for configuring the grab pointer.
- `rayPointer`: Options for configuring the ray pointer.
- `touchPointer`: Options for configuring the touch pointer.

### `DefaultXRTransientPointer`

Default transient-pointer implementation with a ray pointer.

- `clickThresholdMs`: Time in milliseconds between pointerdown and pointerup to trigger a click event.
- `dblClickThresholdMs`: Time in milliseconds between the first click and the second click to trigger a dblclick event.
- `contextMenuButton`: The button that triggers context menu events.
- `minDistance`: Minimal distance to trigger interactions.
- `linePoints`: The points that make up the shape of the ray. If undefined, the ray goes in a straight line.
- `direction`: The direction of the ray.
- `cursorModel`: Properties for configuring how the cursor should look.

### `DefaultXRGaze`

Default gaze implementation with a ray pointer.

- `clickThresholdMs`: Time in milliseconds between pointerdown and pointerup to trigger a click event.
- `dblClickThresholdMs`: Time in milliseconds between the first click and the second click to trigger a dblclick event.
- `contextMenuButton`: The button that triggers context menu events.
- `minDistance`: Minimal distance to trigger interactions.
- `linePoints`: The points that make up the shape of the ray. If undefined, the ray goes in a straight line.
- `direction`: The direction of the ray.
- `cursorModel`: Properties for configuring how the cursor should look.

### `DefaultXRScreenInput`

Default screen-input implementation with a ray pointer.

- `clickThresholdMs`: Time in milliseconds between pointerdown and pointerup to trigger a click event.
- `dblClickThresholdMs`: Time in milliseconds between the first click and the second click to trigger a dblclick event.
- `contextMenuButton`: The button that triggers context menu events.
- `minDistance`: Minimal distance to trigger interactions.
- `linePoints`: The points that make up the shape of the ray. If undefined, the ray goes in a straight line.
- `direction`: The direction of the ray.

## Guards

@react-three/xr provides simple guards to conditionally show or include content.

### `IfFacingCamera`

Guard that only renders its children if the camera is facing the object based on the provided angle and direction.

### `IfInSessionMode`

Guard that renders its children based on the current session mode.

### `IfSessionSupported`

Guard that only renders its children if the session mode is supported.

### `IfSessionVisible`

Guard that only renders its children when the session is not blurred or when not in a session.

### `ShowIfInSessionMode`

Guard that shows its children based on the current session mode.

### `ShowIfSessionSupported`

Guard that only shows its children if the session mode is supported.

### `ShowIfSessionVisible`

Guard that only makes its children visible when the session is not blurred or when not in a session.

### `ShowIfFacingCamera`

Guard that only shows its children if the camera is facing the object based on the provided angle and direction.
