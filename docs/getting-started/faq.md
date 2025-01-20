---
title: FAQ
description: Frequently asked questions about react-three/xr.
nav: 7
---

## How can I read the camera position or rotation in XR?

The current global camera transformation can be accessed through `getWorldPosition` or `getWorldQuaternionn` This works inside of XR, as well as, outside of XR.

```tsx
useFrame((state) => console.log(state.camera.getWorldPosition(new Vector3())))
```

## How can I change the camera position in XR?

In contrast to non-immersive 3D applications, the camera transformation in MR/VR/AR applications should never be directly controlled by the developer since the user's head movement must control the camera's transformation. Therefore, pmndrs/xr provides the XROrigin component, which allows to control where the session's origin is placed inside the 3D scene. The session origin is at the users' feet once they recenter their session. This allows to implicitly control the camera position but prevents the user from getting motion sick when their movement is not reflected in the camera's movement.

##

## Having problems accessing the camera position or rotation.

Check if you have OrbitControls, CameraControls from `@react-three/drei`, or other controls in your scene and make sure to place an `<IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>` guard around them when in XR or replace them with `OrbitHandles` or `MapHandles` from `@react-three/handle`. This prevents overwriting the camera transformation which is controlled through WebXR when inside an immersive session and allows to access the correct transformation.

```tsx
import { OrbitHandles } from '@react-three/handles'
import { noEvents, PointerEvents } from '@react-three/xr'

<Canvas events={noEvents}>
  <PointerEvents />
  <OrbitHandles />
</Canvas>
```

## I cannot enter the XR session!

1. **Missing Https**  
   If you are trying to enter the AR or VR modus and nothing is happening, make sure that you are accessing the website using `https://`.
   In case you are using vite, we recommend using the `@vitejs/plugin-basic-ssl` to try out your vite application on your device while developing.

2. **Missing XR component**  
   If you made sure that the website is accessed using `https://` and still nothing happens when executing `enterAR` or `enterVR`, it is likely that the `<XR>` component is missing. Be sure to add the `<XR>` component directly into the `<Canvas>` and make sure both the `<Canvas>` and the `<XR>` component are present when the button is pressed.

3. **Entering while loading content**  
   If you cannot enter the VR or AR experience, there might be assets in your scene that are loading.
   Make sure to place a suspense boundary around your scene. With this setup, the `<XR>` component stays mounted while your scene loads.

```tsx
<Canvas>
  <XR>
    <Suspense>... your scene</Suspense>
  </XR>
</Canvas>
```

## How can I exit an XR session?

```ts
store.getState().session?.end()
```

## Is WebGPU supported?

WebGPU is finding its way to more and more devices. However, AR and VR devices do not yet implement WebGPU for WebXR, which requires the [WebXR-WebGPU-Binding](https://github.com/immersive-web/WebXR-WebGPU-Binding/blob/main/explainer.md). Therefore, WebGPU is not yet usable for WebXR in general.

## How can I put HTML in my XR scene?

If you are targeting only handheld AR experiences (e.g., for smartphones), you can use dom overlay. Here's a [tutorial for using XRDomOverlays](../tutorials/dom-overlay.md) in your `react-three/xr` experience.

For non-handheld VR and AR experiences, you can use [react-three/uikit](https://github.com/pmndrs/uikit), which renders user interfaces directly inside the 3D scene and is aligned with HTML and CSS concepts.

## Does it work on iOS?

WebXR for VR experiences is supported on Safari for Apple Vision Pro.
WebXR is not supported on iOS Safari yet. The alternative is to use products such as [Variant Launch](https://launch.variant3d.com/), which allow to build WebXR experiences for iOS.

## XRSpace

If you are placing `<XRSpace>` components outside of the `<XROrigin>` while changing the transformation of the `<XROrigin>` (e.g. by setting `<XROrigin position={[0,1,0]} />`), the elements rendered inside of the `<XRSpace>` will not be transformed with the origin. If the transformations of the origin should be applied to the `<XRSpace>`, make sure to place those components inside the `<XROrigin>`. Not placing `<XRSpace>` components into the `<XROrigin>` can be useful in scenarios where you want to move the `<XROrigin>` independently from the `<XRSpace>`. For instance, building a virtual elevator where your actual room is duplicated into the x-axis so that you can use the elevator to travel between multiple instances of your room.

## `onClick` does not play video or allow file uploading (in certain browsers)

As a performance optimization the react-three/xr event system batches html user events per frame. This only applies if you are using `PointerEvents`, `forwardHtmlEvents`, or `forwardObjectEvents`. This can cause issue when executing functions that require a user action. For instance, uploading a file through a input element in a safari can only be triggered manually when immediately caused by a user input. For these use cases, please disable the event batching performance optimization through the options by setting `batchEvents` to `false`.
