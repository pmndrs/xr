---
title: XRHandJoint
nav: 73
sourcecode: packages/react/xr/src/hand.tsx
---

> [!CAUTION]
> Deprecated: use `<XRSpace space="wrist">` instead of `<XRHandJoint joint="wrist">`

> **XRHandJoint**(`props`): `ReactNode`

Component for placing content in the hand anchored at a specific joint such as the index finger tip.

## Parameters

### props

`object` & `RefAttributes`\<`Object3D`\<`Object3DEventMap`\>\>

* `joint`: [XRHandJoint](https://developer.mozilla.org/en-US/docs/Web/API/XRHand#hand_joints) - Is the name of the joint where content should be placed (e.g. `"wrist"`)
* `children`: Components to be placed inside the joint (e.g. For visualizing a tooltip over the index finger tip)

## Returns

`ReactNode`

