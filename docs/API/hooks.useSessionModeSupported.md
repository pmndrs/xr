---
title: useSessionModeSupported
nav: 41
sourcecode: packages/react/xr/src/hooks.ts
---

> [!CAUTION]
> Deprecated: use `useXRSessionModeSupported` instead

> `const` **useSessionModeSupported**: (`mode`, `onError?`) => `undefined` \| `boolean` = `useXRSessionModeSupported`

Checks whether a specific XRSessionMode is supported or not

## Parameters

### mode

`XRSessionMode`

The session mode to check.

### onError?

(`error`) => `void`

Callback executed when an error occurs.

## Returns

`undefined` \| `boolean`

