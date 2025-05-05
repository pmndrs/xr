---
title: useXRHitTest
nav: 51
sourcecode: packages/react/xr/src/hit-test.tsx
---

> **useXRHitTest**(`fn`, `relativeTo`, `trackableType?`): `void`

Hook for setting up a continous hit test originating from the provided object or xrspace

## Parameters

### fn

`undefined` | (`results`, `getWorldMatrix`) => `void`

### relativeTo

`XRSpace` | `XRReferenceSpaceType` | `RefObject`\<`null` \| `Object3D`\<`Object3DEventMap`\>\>

### trackableType?

`XRHitTestTrackableType` | `XRHitTestTrackableType`[]

## Returns

`void`
