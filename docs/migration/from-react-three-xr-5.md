---
title: from @react-three/xr v5
description: Migrate your application from @react-three/xr v5
nav: 24
---

The goal of @react-three/xr v6 is to align this library closer to the react-three ecosystem. We, therefore, focussed on supporting the react-three/fiber event handlers. Another focus of v6 is to reduce boilerplate and provide more defaults while also giving developers more access to the lower-level WebXR primitives. In combination, these changes allow developers to build XR experiences that interoperate with the whole react-three ecosystem using only a few lines of code. 

For everybody that is transitioning from v5 to v6, we have created a small compatibility layer that includes `XRButton`, `ARButton`, `VRButton`, `useInteraction`, `useXREvent`, `Interactive`, and `RayGrab`. However, we recommend transitioning away from the compatibility layer as the new recommended way of building with @react-three/xr is more aligned with the whole react-three ecosystem.

For the `Controllers` and `Hands` components there are not correspondances in @react-three/xr v6 since input methods such as controllers, hands, but also transient-pointers are added by default. Users can configure the default implementation of those input methods as described [here](../tutorials/custom-inputs.md). The teleportation feature of @react-three/xr v5 has also slightly changed. The new API is explained [here](../tutorials/teleport.md).