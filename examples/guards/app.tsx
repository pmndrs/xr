import { OrbitControls, Plane } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createXRStore, IfInSessionMode, IfSessionModeSupported, ShowIfSessionModeSupported, XR } from '@react-three/xr'
import * as THREE from 'three'
import { Message } from './Message.js'
import { ShyBox } from './ShyBox.js'
import { SpinningBox } from './SpinningBox.js'
import './styles.css'

const store = createXRStore({ offerSession: false, emulate: false })

const axisColor = new THREE.Color('#9d3d4a')
const gridColor = new THREE.Color('#4f4f4f')

export function App() {
  return (
    <div className="App">
      <Canvas camera={{ position: [5, 3, 5] }}>
        <color attach={'background'} args={['#3f3f3f']} />
        <gridHelper args={[50, 50, axisColor, gridColor]} />
        <XR store={store}>
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={'darkgreen'} />
          </Plane>
          <ShyBox position={[-2, 1, 0]} />
          <SpinningBox position={[2, 1, 0]} />
          <IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
            <OrbitControls />
          </IfInSessionMode>
        </XR>
        <ShowIfSessionModeSupported mode="immersive-vr">
          <Message message="This text is only visible when VR sessions are supported" />
        </ShowIfSessionModeSupported>
      </Canvas>
      <IfSessionModeSupported mode="immersive-vr">
        <button onClick={() => store.enterVR()}>{'Enter VR'}</button>
      </IfSessionModeSupported>
      <IfSessionModeSupported mode="immersive-ar">
        <button onClick={() => store.enterAR()}>{'Enter AR'}</button>
      </IfSessionModeSupported>
    </div>
  )
}
