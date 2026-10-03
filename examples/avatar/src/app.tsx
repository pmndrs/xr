import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { createXRStore, useXR, XR, XROrigin } from '@react-three/xr'
import { Suspense, useMemo, useState } from 'react'
import { BodyRetargeter } from './retarget.js'
import { createRig, loader } from './rig.js'

const store = createXRStore({
  bodyTracking: true,
  hand: { model: false },
})

export function App() {
  const [vrm, setVrm] = useState(true)
  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => store.enterVR()}>Enter VR</button>
        <button onClick={() => store.enterAR()}>Enter AR</button>
        <button onClick={() => setVrm(!vrm)}>Switch to {vrm ? 'Mixamo' : 'VRM'}</button>
      </div>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <XR store={store}>
          <color attach="background" args={['#111']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[1, 3, 2]} intensity={2.5} />
          <gridHelper args={[10, 20, '#444', '#222']} />
          <XROrigin>
            <Suspense fallback={null}>
              <Avatar url={vrm ? 'AvatarSample_B.vrm' : 'mixamo.glb'} />
            </Suspense>
          </XROrigin>
        </XR>
      </Canvas>
    </>
  )
}

function Avatar({ url }: { url: string }) {
  // loaded twice: one avatar for the user's own body, one for the mirror
  const [selfGltf, mirrorGltf] = useLoader(loader, [url, url])
  const [self, mirror] = useMemo(() => [createRig(selfGltf), createRig(mirrorGltf)], [selfGltf, mirrorGltf])
  const retargeter = useMemo(() => new BodyRetargeter(mirror), [mirror])
  const referenceSpace = useXR((xr) => xr.originReferenceSpace)
  self.hideHead = true

  useFrame((_, delta, frame: XRFrame | undefined) => {
    const tracked = frame != null && referenceSpace != null && retargeter.update(frame, referenceSpace)
    self.scene.visible = tracked
    if (tracked) {
      retargeter.apply(self)
      retargeter.apply(mirror)
    } else {
      mirror.resetPose()
      mirror.scene.position.set(0, 0, 0)
      mirror.scene.scale.setScalar(1)
      mirror.scene.rotation.y = mirror.facingYaw
    }
    self.update(delta)
    mirror.update(delta)
  })

  return (
    <>
      <primitive object={self.scene} />
      <group position-z={-2} scale-z={-1}>
        <primitive object={mirror.scene} />
      </group>
    </>
  )
}
