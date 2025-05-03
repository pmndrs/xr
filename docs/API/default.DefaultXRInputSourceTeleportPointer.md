---
title: DefaultXRInputSourceTeleportPointer
nav: 11
sourcecode: packages/react/xr/src/default.tsx
---

> **DefaultXRInputSourceTeleportPointer**(`options`): `Element`

telport pointer for the XRInputSource
emits a downwards bend ray that only interesects with meshes marked as teleportable

properties
- `clickThresholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
- `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
- `contextMenuButton` the button that triggers contextmenu events
- `makeDefault` used the set the default pointer inside a combined pointer
- `radius` the size of the intersection sphere
- `minDistance` minimal distance to trigger interactions
- `direction` the direction of the ray
- `rayModel` properties for configuring how the ray should look
- `cursorModel` properties for configuring how the cursor should look

## Parameters

### options

`DefaultXRInputSourceTeleportPointerOptions`

## Returns

`Element`
