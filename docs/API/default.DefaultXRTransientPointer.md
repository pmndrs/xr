---
title: DefaultXRTransientPointer
nav: 13
sourcecode: packages/react/xr/src/default.tsx
---

> **DefaultXRTransientPointer**(`props`): `Element`

Default transient-pointer implementation with ray pointer

## Parameters

### props

`DefaultXRTransientPointerOptions`

* `clickThresholdMs` Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
* `dblClickThresholdMs` Time in milliseconds between the first click and the second click to trigger a `dblclick` event
* `contextMenuButton` The button that triggers context menu events
* `minDistance` Minimal distance to trigger interactions
* `linePoints` The points thay make up the shape of the ray if undefined the ray goes in a straight line
* `direction` The direction of the ray
* `cursorModel` Properties for configuring how the cursor should look

## Returns

`Element`
