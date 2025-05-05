---
title: DefaultXRInputSourceRayPointer
nav: 10
sourcecode: packages/react/xr/src/default.tsx
---

> **DefaultXRInputSourceRayPointer**(`props`): `Element`

Ray pointer for the XRInputSource

## Parameters

### props

`DefaultXRInputSourceRayPointerOptions`

* `clickThresholdMs` Time in milliseconds between pointerdown and pointerup to trigger a click event
* `dblClickThresholdMs` Time in milliseconds between the first click and the second click to trigger a dblclick event
* `contextMenuButton` The button that triggers contextmenu events
* `makeDefault` Used the set the default pointer inside a combined pointer
* `radius` The size of the intersection sphere
* `minDistance` Minimal distance to trigger interactions
* `linePoints` The points thay make up the shape of the ray if undefined the ray goes in a straight line
* `direction` The direction of the ray
* `rayModel` Properties for configuring how the ray should look
* `cursorModel` Properties for configuring how the cursor should look

## Returns

`Element`
