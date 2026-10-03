import { Canvas } from '@react-three/fiber'
import { createXRStore, XR, XROrigin } from '@react-three/xr'
import { Suspense, useState } from 'react'
import { MixamoAvatar, VRMAvatar } from './components/avatar.js'

const store = createXRStore({
  bodyTracking: true,
  hand: { model: false },
})

export function App() {
  const [avatar, setAvatar] = useState<'vrm' | 'mixamo'>('vrm')
  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => store.enterVR()}>Enter VR</button>
        <button onClick={() => store.enterAR()}>Enter AR</button>
        <button onClick={() => setAvatar(avatar === 'vrm' ? 'mixamo' : 'vrm')}>
          Switch to {avatar === 'vrm' ? 'Mixamo' : 'VRM'}
        </button>
      </div>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <XR store={store}>
          <color attach="background" args={['#111']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[1, 3, 2]} intensity={2.5} />
          <gridHelper args={[10, 20, '#444', '#222']} />
          <XROrigin>
            <Suspense fallback={null}>
              {avatar === 'vrm' ? <VRMAvatar url="AvatarSample_B.vrm" /> : <MixamoAvatar url="mixamo.glb" />}
            </Suspense>
          </XROrigin>
        </XR>
      </Canvas>
    </>
  )
}
