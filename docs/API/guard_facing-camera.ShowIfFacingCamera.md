---
title: ShowIfFacingCamera
nav: 23
sourcecode: packages/react/xr/src/guard/facing-camera.tsx
---

> **ShowIfFacingCamera**(`props`): `Element`

Guard that only **shows** its children by toggling their visibility if the camera is facing the object.
Calculation is based on the provided angle and direction.

## Parameters

### props

`FacingCameraProps`

* `children`: ReactNode - The ReactNode elements to conditionally show.
* `direction`: [Vector3](https://threejs.org/docs/#api/en/math/Vector3) - Direction vector to check against the camera's facing direction.
* `angle`: number - The angle in radians to determine visibility. Defaults to `Math.PI / 2` (90 degrees).

## Returns

`Element`
