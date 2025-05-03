---
title: useApplyXRSpaceMatrix
nav: 28
sourcecode: packages/react/xr/src/space.tsx
---

> **useApplyXRSpaceMatrix**(`ref`, `space`, `onFrame?`): `void`

hook that applies the transformation of the provided xr space to the provided object reference

## Parameters

### ref

#### current?

`null` \| `Group`\<`Object3DEventMap`\>

### space

`undefined` | `XRSpace`

### onFrame?

(`state`, `delta`, `frame`) => `void`

optional callback that gets executed after the matrix of the reference object was updated

## Returns

`void`

## Requires

that matrixAutoUpdate is disabled for the referenced object
