---
title: useLoadXRControllerLayout
nav: 35
sourcecode: packages/react/xr/src/controller.tsx
---

> **useLoadXRControllerLayout**(`profileIds`, `handedness`, `XRControllerLayoutLoaderOptions`): `XRControllerLayout`

Hook for loading a controller layout, which contains info about the controller model and its buttons / controls.
For xr controllers provided through WebXR, the layout is loaded and provided through the controller state automatically.
Therefore, this hook's purpose is for building controller demos/tutorials.

## Parameters

### profileIds

`string`[]

### handedness

`XRHandedness`

### XRControllerLayoutLoaderOptions

`XRControllerLayoutLoaderOptions` = `{}`

## Returns

`XRControllerLayout`

`Promise<XRControllerLayout>`
