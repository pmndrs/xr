---
title: IfSessionVisible
nav: 17
sourcecode: packages/react/xr/src/guard/focus.tsx
---

> **IfSessionVisible**(`props`): `null` \| `Element`

Guard that only **renders** its children to the scene based on whether the current session is visible or not.
Typically used to hide/show content when operating system overlays are showing

## Parameters

### props

`SessionVisibleProps`

* `children?`: ReactNode - The ReactNode elements to conditionally show.

## Returns

`null` \| `Element`
