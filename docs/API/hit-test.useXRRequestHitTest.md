---
title: useXRRequestHitTest
nav: 59
sourcecode: packages/react/xr/src/hit-test.tsx
---

> **useXRRequestHitTest**(): (`relativeTo`, `trackableType?`) => `undefined` \| `Promise`\<`undefined` \| \{ `getWorldMatrix`: (`target`, `result`) => `boolean`; `results`: `XRHitTestResult`[]; \}\>

Hook that returns a function to request a single hit test

## Returns

> (`relativeTo`, `trackableType?`): `undefined` \| `Promise`\<`undefined` \| \{ `getWorldMatrix`: (`target`, `result`) => `boolean`; `results`: `XRHitTestResult`[]; \}\>

### Parameters

#### relativeTo

`XRSpace` | `XRReferenceSpaceType` | `RefObject`\<`null` \| `Object3D`\<`Object3DEventMap`\>\>

#### trackableType?

`XRHitTestTrackableType` | `XRHitTestTrackableType`[]

### Returns

`undefined` \| `Promise`\<`undefined` \| \{ `getWorldMatrix`: (`target`, `result`) => `boolean`; `results`: `XRHitTestResult`[]; \}\>
