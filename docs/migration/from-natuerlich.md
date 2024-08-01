---
title: from Natuerlich
description: Migrate your application from natuerlich
nav: 22
---

@react-three/xr is inspired by natuerlich, and therefore, many things are similar, especially the way interactions are handled. However, a few things have been changed and renamed.

- use `XROrigin` instead of `ImmersiveSessionOrigin`
- use `<Canvas><XR>...</XR></Canvas>` instead of `XRCanvas`
- configure settings such as `foveation` through `createXRStore`
- use `store.enterXR` instead of `useEnterXR`
- use `DragControls` **TBD** instead of `Grabbale`
- don't add hands and controllers yourself, and configure them through the `createXRStore` options. Click [here](../tutorials/custom-inputs.md) for more info regarding controller/hand/... customization.
- use teleport as described [here](../tutorials/teleport.md)
