---
title: ShowIfInSessionMode
nav: 24
sourcecode: packages/react/xr/src/guard/session-mode.tsx
---

> **ShowIfInSessionMode**(`props`): `Element`

Guard that only **shows** its children by toggling their visibility based on the current session mode.
If neither `allow` nor `deny` are provided, the visiblity will be based on whether or not any mode is currently being used.

## Parameters

### props

`InSessionModeProps`

* `children?`: `ReactNode` - The ReactNode elements to conditionally show.
* `allow?`: `XRSessionMode | ReadonlyArray<XRSessionMode | undefined>` - The session mode(s) where the children will be shown. If not provided, the children will be shown in all modes except the ones in `deny`.
* `deny?`: `XRSessionMode | ReadonlyArray<XRSessionMode | undefined>` - The session mode(s) where the children will be hidden.

## Returns

`Element`
