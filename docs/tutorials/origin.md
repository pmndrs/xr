---
title: Origin
description: Control the user's transformation by setting the XR session origin
nav: 11
---

The origin of an XR session is a 3D transformation that represents the position of the feet when the user recenters the session. Therefore, we recommend treating the session origin as the position of the feet. @react-three/xr provides the `XROrigin` component to control this transformation and place it anywhere inside the scene.

## Roller coaster example

Since the `XROrigin` is a react component, it can be placed anywhere, including moving objects. In the following example, we'll create an XR roller coaster.

```tsx
const store = createXRStore({
  controller: false,
})

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <Canvas>
        <directionalLight position={[1, 1, 1]} />
        <ambientLight />
        <OrbitControls />
        <XR store={store}>
          <RollerCoaster />
        </XR>
      </Canvas>
    </>
  )
}

function RollerCoaster() {
  const gltf = useGLTF('rollercoaster.glb')

  const mixer = useMemo(() => new AnimationMixer(gltf.scene), [])
  useEffect(() => {
    for (const animation of gltf.animations) {
      mixer.clipAction(animation).play()
    }
  }, [gltf, mixer])
  useFrame((state, delta) => mixer.update(delta))
  return (
    <>
      <primitive object={gltf.scene} />
      {createPortal(
        <group rotation-y={-Math.PI / 2} rotation-x={Math.PI / 2}>
          <XROrigin scale={0.24} position-y={-0.1} />
        </group>,
        gltf.scene.getObjectByName('Sessel')!,
      )}
    </>
  )
}
```

## Resizing example

Transforming the `XROrigin` is not limited to position but can also include rotation and scale. The following example shows how the `XROrigin` can be used to achieve a resizing interaction.

```tsx
const store = createXRStore()

function App() {
  const [miniature, setMinitature] = useState(false)
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter VR</button>
      <Canvas>
        <XR store={store}>
          <Gltf src="model.glb" />
          <XROrigin scale={miniature ? 0.01 : 1} position-y={miniature ? -1 : 0} />
        </XR>
      </Canvas>
    </>
  )
}
```
