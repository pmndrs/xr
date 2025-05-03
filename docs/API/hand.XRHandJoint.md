---
title: XRHandJoint
nav: 73
sourcecode: packages/react/xr/src/hand.tsx
---

> [!CAUTION]
> Deprecated: use `<XRSpace space="wrist">` instead of `<XRHandJoint joint="wrist">`
component for placing content in the hand anchored at a specific joint such as the index finger tip

properties
- `joint` is the name of the joint (e.g. `"wrist"`)

the component allows children to be placed inside for e.g. visualizing a tooltip over the index finger tip

> **XRHandJoint**(`props`): `ReactNode`

## Parameters

### props

`object` & `RefAttributes`\<`Object3D`\<`Object3DEventMap`\>\>

## Returns

`ReactNode`

component for placing content in the hand anchored at a specific joint such as the index finger tip

properties
- `joint` is the name of the joint (e.g. `"wrist"`)

the component allows children to be placed inside for e.g. visualizing a tooltip over the index finger tip
