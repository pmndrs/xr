---
title: IfFacingCamera
nav: 14
sourcecode: packages/react/xr/src/guard/facing-camera.tsx
---

> **IfFacingCamera**(`props`): `null` \| `Element`

Guard that only **renders** its children into the scene if the camera is facing the object.
Calculation is based on the provided angle and direction.

## Parameters

### props

`FacingCameraProps`

* `children`: ReactNode - The ReactNode elements to conditionally render.
* `direction`: [Vector3](https://threejs.org/docs/#api/en/math/Vector3) - Direction vector to check against the camera's facing direction.
* `angle`: number - The angle in radians to determine visibility. Defaults to `Math.PI / 2` (90 degrees).

## Returns

`null` \| `Element`
