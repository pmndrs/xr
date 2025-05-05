---
title: IfInSessionMode
nav: 15
sourcecode: packages/react/xr/src/guard/session-mode.tsx
---

> **IfInSessionMode**(`props`): `null` \| `Element`

Guard that only **renders** its children to the scene based on the current session mode.
If neither `allow` nor `deny` are provided, the elements will be rendered based on whether or not any mode is currently being used.

## Parameters

### props

`InSessionModeProps`

* `children?`: ReactNode - The ReactNode elements to conditionally render.
* `allow?`: XRSessionMode | ReadonlyArray<XRSessionMode | undefined> - The session mode(s) where the children will be rendered. If not provided, the children will be rendered in all modes except the ones in `deny`.
* `deny?`: XRSessionMode | ReadonlyArray<XRSessionMode | undefined> - The session mode(s) where the children will not be rendered.

## Returns

`null` \| `Element`
