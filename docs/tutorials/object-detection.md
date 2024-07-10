---
title: Object Detection
description: Use detected objects such as meshes and planes for rendering, scene understanding, physics, and more
nav: 8
---

@react-three/xr allows to use the devices mesh and plane detection functionality to detect the meshes and planes in the environment to modify the rendering, allow physics interactions with the environment, and more.

## Detected Planes

There are several ways to access and use the detected planes. In case you'd like to render the detected planes using a react component, we recommend providing the implementation to the options when executing `createXRStore`. The following example shows how to render a red plane based on where all walls are.

```tsx
function RedWall() {
  const geometry = useXRPlaneGeometry()
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="red" />
    </mesh>
 )
}

const store = createXRStore({ detectPlanes: { wall: RedWall } })
```

Another alternative is to get the detected planes through the `useXRPlanes` or directly from `useXR(xr => xr.detectPlanes)` and manually go through the returned array. To render the planes in the correct place, the planes' space must be used and provided to the `XRSpace` component. The following example shows how to render the red walls manually without using the XR store options.

```tsx
function RedWalls() {
  const wallPlanes = useXRPlanes('wall')
  return (
    <>
      {wallPlanes.map((plane) => (
        <XRSpace space={plane.placeSpace}>
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

Mesh detection provides access to the geometry of the environment. @react-three/fiber xr provides ways to provide implementations for rendering and using the detected meshes via the xr store options. Alternatively the xr meshes can be retrieved and manually processed using `useXRMeshes`. 
