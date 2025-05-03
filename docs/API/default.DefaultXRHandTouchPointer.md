---
title: DefaultXRHandTouchPointer
nav: 9
sourcecode: packages/react/xr/src/default.tsx
---

> **DefaultXRHandTouchPointer**(`options`): `Element`

touch pointer for the XRHand

properties
- `clickThresholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
- `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
- `contextMenuButton` the button that triggers contextmenu events
- `makeDefault` used the set the default pointer inside a combined pointer
- `cursorModel` properties for configuring how the cursor should look
- `hoverRadius` the size of the intersection sphere
- `downRadius` the distance to the touch center to trigger a pointerdown event
- `button` the id of the button that is triggered when touching

## Parameters

### options

`DefaultXRHandTouchPointerOptions`

## Returns

`Element`
