---
title: useHover
nav: 31
sourcecode: packages/react/xr/src/hooks.ts
---

> **useHover**(`ref`, `onChange?`): `undefined` \| `boolean`

Used to track the hover state of a 3D object.

## Parameters

### ref

`RefObject`\<`null` \| `Object3D`\<`Object3DEventMap`\>\>

`RefObject<Object3D | null>` : The reference to the 3D object.

### onChange?

(`hover`, `event`) => `void`

`(hover: boolean, event: PointerEvent) => void` : Callback for hover state changes.

## Returns

`undefined` \| `boolean`

- The hover state if no callback is provided.
