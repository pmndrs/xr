---
title: DefaultXRInputSourceTeleportPointer
nav: 11
sourcecode: packages/react/xr/src/default.tsx
---

> **DefaultXRInputSourceTeleportPointer**(`props`): `Element`

Telport pointer for the XRInputSource.
Emits a downward bend ray that only interesects with meshes marked as teleportable

## Parameters

### props

`DefaultXRInputSourceTeleportPointerOptions`

* `clickThresholdMs` Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
* `dblClickThresholdMs` Time in milliseconds between the first click and the second click to trigger a `dblclick` event
* `contextMenuButton` The button that triggers context menu events
* `makeDefault` Used the set the default pointer inside a combined pointer
* `radius` The size of the intersection sphere
* `minDistance` Minimal distance to trigger interactions
* `direction` The direction of the ray
* `rayModel` Properties for configuring how the ray should look
* `cursorModel` Properties for configuring how the cursor should look

## Returns

`Element`
