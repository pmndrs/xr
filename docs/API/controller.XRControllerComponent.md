---
title: XRControllerComponent
nav: 70
sourcecode: packages/react/xr/src/controller.tsx
---

> **XRControllerComponent**(`props`): `ReactNode`

component for placing content in the controller anchored at a specific component such as the Thumbstick

properties
- `id` is the id of the component (e.g. `"a-button"`)
- `onPress` is an optional callback to receive when the component is pressed
- `onRelease` is an optional callback to receive when the component is released

the component allows children to be placed inside for e.g. visualizing a tooltip over the button/...

## Parameters

### props

`object` & `RefAttributes`\<`undefined` \| `Object3D`\<`Object3DEventMap`\>\>

## Returns

`ReactNode`
