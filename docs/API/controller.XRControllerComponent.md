---
title: XRControllerComponent
nav: 70
sourcecode: packages/react/xr/src/controller.tsx
---

> **XRControllerComponent**(`props`): `ReactNode`

Component for placing content in the controller anchored at a specific component such as the Thumbstick

## Parameters

### props

`object` & `RefAttributes`\<`undefined` \| `Object3D`\<`Object3DEventMap`\>\>

* `id`: `XRControllerGamepadComponentId` - Is the id of the component where content should be placed (e.g. `"a-button"`)
* `onPress?`: `Function` - Is an optional callback to receive when the component is pressed
* `onRelease?`: `Function` - Is an optional callback to receive when the component is released
* `children?`: `ReactNode` - Children to be placed inside the componenent (e.g. visualizing a tooltip over the button...)

## Returns

`ReactNode`
