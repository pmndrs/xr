---
title: DefaultXRInputSourceRayPointer
nav: 10
sourcecode: packages/react/xr/src/default.tsx
---

> **DefaultXRInputSourceRayPointer**(`options`): `Element`

ray pointer for the XRInputSource

properties
- `clickThresholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
- `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
- `contextMenuButton` the button that triggers contextmenu events
- `makeDefault` used the set the default pointer inside a combined pointer
- `radius` the size of the intersection sphere
- `minDistance` minimal distance to trigger interactions
- `linePoints` the points thay make up the shape of the ray if undefined the ray goes in a straight line
- `direction` the direction of the ray
- `rayModel` properties for configuring how the ray should look
- `cursorModel` properties for configuring how the cursor should look

## Parameters

### options

`DefaultXRInputSourceRayPointerOptions`

## Returns

`Element`
