---
title: DefaultXRHandTouchPointer
nav: 9
sourcecode: packages/react/xr/src/default.tsx
---

> **DefaultXRHandTouchPointer**(`props`): `Element`

Touch pointer for the XRHand

## Parameters

### props

`DefaultXRHandTouchPointerOptions`

* `clickThresholdMs` Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
* `dblClickThresholdMs` Time in milliseconds between the first click and the second click to trigger a `dblclick` event
* `contextMenuButton` The button that triggers context menu events
* `makeDefault` Used the set the default pointer inside a combined pointer
* `cursorModel` Properties for configuring how the cursor should look
* `hoverRadius` The size of the intersection sphere
* `downRadius` The distance to the touch center to trigger a `pointerdown` event
* `button` The id of the button that is triggered when touching

## Returns

`Element`
