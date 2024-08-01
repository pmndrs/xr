---
title: FAQ
description: Frequently asked questions about react-three/xr.
nav: 5
---

## How can I exit an XR session?

```ts
store.getState().session?.end()
```

## WebGPU

WebGPU is finding its way to more and more devices. However, AR and VR devices do not yet implement WebGPU for WebXR, which requires the [WebXR-WebGPU-Binding](https://github.com/immersive-web/WebXR-WebGPU-Binding/blob/main/explainer.md). Therefore, WebGPU is not yet usable for WebXR in general.

## How can I put HTML in my XR scene?

If you are targeting only handheld AR experiences (e.g., for smartphones), you can use dom overlay. Here's a [tutorial for using XRDomOverlays](../tutorials/dom-overlay.md) in your `react-three/xr` experience.

For non-handheld VR and AR experiences, you can use [react-three/uikit](https://github.com/pmndrs/uikit), which renders user interfaces directly inside the 3D scene and is aligned with HTML and CSS concepts.

## Does it work on iOS?

WebXR for VR experiences is supported on Safari for Apple Vision Pro. 
WebXR is not supported on iOS Safari yet. The alternative is to use products such as [Variant Launch](https://launch.variant3d.com/), which allow to build WebXR experiences for iOS.