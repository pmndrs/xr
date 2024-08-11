---
title: Object Detection
description: Use detected objects such as meshes and planes for rendering, scene understanding, physics, and more
nav: 10
---

@react-three/xr allows to use the devices mesh and plane detection functionality to detect the meshes and planes in the environment to modify the rendering, allow physics interactions with the environment, and more.

## Detected Planes

The detected planes are accessible through the `useXRPlanes` hook or directly from `useXR(xr => xr.detectPlanes)` and manually go through the returned array. To render the planes in the correct place, the planes' space must provided to the `XRSpace` component. The following example shows how to render the red planes for all detected walls.

```tsx
function RedWalls() {
  const wallPlanes = useXRPlanes('wall')
  return (
    <>
      {wallPlanes.map((plane) => (
        <XRSpace space={plane.planeSpace}>
          <XRPlaneModel>
            <meshBasicMaterial color="red" />
          </XRPlaneModel>
        </XRSpace>
 ))}
    </>
 )
}
```

## Detected Meshes

Mesh detection provides access to the geometry of the environment. Similarly to xr planes, @react-three/fiber allows to retrieve detected meshes using `useXRMeshes` and offers the `XRMeshModel` to render the individual meshes. 
