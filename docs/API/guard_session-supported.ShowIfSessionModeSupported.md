---
title: ShowIfSessionModeSupported
nav: 25
sourcecode: packages/react/xr/src/guard/session-supported.tsx
---

> **ShowIfSessionModeSupported**(`props`): `Element`

Guard that only **shows** its children by toggling their visibility based on whether the user's device supports a session mode.

## Parameters

### props

`SessionModeSupportedProps`

* `children?`: ReactNode - The ReactNode elements to conditionally show.
* `mode`: XRSessionMode - The session mode used to determine if the children will be shown.

## Returns

`Element`
