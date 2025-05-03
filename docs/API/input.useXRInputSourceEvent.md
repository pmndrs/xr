---
title: useXRInputSourceEvent
nav: 53
sourcecode: packages/react/xr/src/input.tsx
---

> **useXRInputSourceEvent**(`inputSource`, `event`, `fn`, `deps`): `void`

Hook for listening to xr input source events

## Parameters

### inputSource

The input source to listen to, or 'all' to listen to all input sources

`undefined` | `XRInputSource` | `"all"`

### event

The event to listen to. ([List of events](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSourceEvent))

`"select"` | `"selectstart"` | `"selectend"` | `"squeeze"` | `"squeezestart"` | `"squeezeend"`

### fn

(`event`) => `void`

Callback function called when the event is triggered.

### deps

`any`[]

Retriggers the binding of the event when the dependencies change.

## Returns

`void`
