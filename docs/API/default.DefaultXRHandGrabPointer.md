---
title: DefaultXRHandGrabPointer
nav: 8
sourcecode: packages/react/xr/src/default.tsx
---

> `const` **DefaultXRHandGrabPointer**: (`props`) => `ReactNode`

Grab pointer for the XRHand

## Parameters

### props

`DefaultXRInputSourceGrabPointerOptions`

* `clickThresholdMs` Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
* `dblClickThresholdMs` Time in milliseconds between the first click and the second click to trigger a `dblclick` event
* `contextMenuButton` The button that triggers context menu events
* `makeDefault` Used the set the default pointer inside a combined pointer
* `cursorModel` Properties for configuring how the cursor should look
* `radius` The size of the intersection sphere
* `customSort` Overrides the default sort function to use for sorting the intersection results

## Returns

`ReactNode`
