---
title: useXRHitTestSource
nav: 52
sourcecode: packages/react/xr/src/hit-test.tsx
---

> **useXRHitTestSource**(`relativeTo`, `trackableType?`): `undefined` \| \{ `getWorldMatrix`: (`target`, `result`) => `boolean`; `source`: `XRHitTestSource`; \}

hook for creating a hit test source originating from the provided object or xrspace

## Parameters

### relativeTo

`XRSpace` | `XRReferenceSpaceType` | `RefObject`\<`null` \| `Object3D`\<`Object3DEventMap`\>\>

### trackableType?

`XRHitTestTrackableType` | `XRHitTestTrackableType`[]

## Returns

`undefined` \| \{ `getWorldMatrix`: (`target`, `result`) => `boolean`; `source`: `XRHitTestSource`; \}
