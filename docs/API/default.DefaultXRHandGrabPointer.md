---
title: DefaultXRHandGrabPointer
nav: 8
sourcecode: packages/react/xr/src/default.tsx
---

> `const` **DefaultXRHandGrabPointer**: (...`args`) => `Element`

grab pointer for the XRHand

properties
- `clickThresholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
- `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
- `contextMenuButton` the button that triggers contextmenu events
- `makeDefault` used the set the default pointer inside a combined pointer
- `cursorModel` properties for configuring how the cursor should look
- `radius` the size of the intersection sphere

## Parameters

### args

...\[`DefaultXRInputSourceGrabPointerOptions`\]

## Returns

`Element`
