---
title: Pitfalls
description: Pitfalls to avoid when building immersive web applications with react-three/xr
nav: 19
---

## Changing the camera position in XR

In contrast to non-immersive 3D applications, the camera transformation in MR/VR/AR applications should never be directly controlled by the developer since the user's head movement must control the camera's transformation. Therefore, pmndrs/xr provides the XROrigin component, which allows to control where the session's origin is placed inside the 3D scene. The session origin is at the users' feet once they recenter their session. This allows to implicitly control the camera position but prevents the user from getting motion sick when their movement is not reflected in the camera's movement.

## Reading the camera position in XR

When using @react-three/xr, the useThree hook will return the XR camera when in XR. Therefore, the returned camera and the `getWorldPosition` function can be used to get the world position of the xr camera, as well as the normal camera, when not in XR.

```tsx
const camera = useThree((state) => state.camera)
useFrame(() => camera.getWorldPosition(target))
```

## Missing Https

If you are trying to enter the AR or VR modus and nothing is happening, make sure that you are accessing the website using `https://`.
In case you are using vite, we recommend using the `@vitejs/plugin-basic-ssl` to try out your vite application on your device while developing.

## Missing XR component

If you made sure that the website is accessed using `https://` and still nothing happens when executing `enterAR` or `enterVR`, it is likely that the `<XR>` component is missing. Be sure to add the `<XR>` component directly into the `<Canvas>` and make sure both the `<Canvas>` and the `<XR>` component are present when the button is pressed.

## Entering while loading content

If you cannot enter the VR or AR experience while the assets in your scene are loading, make sure to place a suspense boundary around your scene. With this setup, the `<XR>` component stays mounted while your scene loads.

```tsx
<Canvas>
  <XR>
    <Suspense>... your scene</Suspense>
  </XR>
</Canvas>
```

## XRSpace

If you are placing `<XRSpace>` components outside of the `<XROrigin>` while changing the transformation of the `<XROrigin>` (e.g. by setting `<XROrigin position={[0,1,0]} />`), the elements rendered inside of the `<XRSpace>` will not be transformed with the origin. If the transformations of the origin should be applied to the `<XRSpace>`, make sure to place those components inside the `<XROrigin>`. Not placing `<XRSpace>` components into the `<XROrigin>` can be useful in scenarios where you want to move the `<XROrigin>` independently from the `<XRSpace>`. For instance, building a virtual elevator where your actual room is duplicated into the x-axis so that you can use the elevator to travel between multiple instances of your room.
