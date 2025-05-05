---
title: IfSessionModeSupported
nav: 16
sourcecode: packages/react/xr/src/guard/session-supported.tsx
---

> **IfSessionModeSupported**(`props`): `null` \| `Element`

Guard that only **renders** its children to the scene based on whether the user's device supports a session mode.

## Parameters

### props

`SessionModeSupportedProps`

* `children?`: ReactNode - The ReactNode elements to conditionally render.
* `mode`: XRSessionMode - The session mode used to determine if the children will be rendered.

## Returns

`null` \| `Element`
