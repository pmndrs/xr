import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, createPortal, useFrame } from '@react-three/fiber'
import { createXRStore, XR, XROrigin } from '@react-three/xr'
import { useEffect, useMemo } from 'react'
import { AnimationMixer } from 'three'

const store = createXRStore({
  controller: false,
  offerSession: 'immersive-vr',
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
      console.log(animation)
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
