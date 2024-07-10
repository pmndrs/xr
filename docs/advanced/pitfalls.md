---
title: Pitfalls
description: Pitfalls to avoid when building immersive web applications with react-three/xr
nav: 14
---

## Changing the camera position in XR

In contrast to non-immersive 3D applications, the camera transformation in MR/VR/AR applications should never be directly controlled by the developer since the user's head movement must control the camera's transformation. Therefore, pmndrs/xr provides the XROrigin component, which allows to control where the session's origin is placed inside the 3D scene. The session origin is at the users' feet once they recenter their session. This allows to implicitly control the camera position but prevents the user from getting motion sick when their movement is not reflected in the camera's movement.

## Reading the camera position in XR

When using @react-three/xr, the useThree hook will return the XR camera when in XR. Therefore, the returned camera and the `getWorldPosition` function can be used to get the world position of the xr camera, as well as the normal camera, when not in XR. 

```tsx
const camera = useThree(state => state.camera)
useFrame(() => camera.getWorldPosition(target))
```