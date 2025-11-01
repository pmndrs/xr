import { OrbitControls, Plane } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createXRStore, IfSessionModeSupported, XR } from '@react-three/xr'
import * as THREE from 'three'
import './styles.css'

const store = createXRStore()

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
          <OrbitControls />
        </XR>
      </Canvas>
      <IfSessionModeSupported mode="immersive-vr">
        <button onClick={() => store.enterVR()}>{'Enter VR'}</button>
      </IfSessionModeSupported>
      <IfSessionModeSupported mode="immersive-ar">
        <button onClick={() => store.enterAR()}>{'Enter AR'}</button>
      </IfSessionModeSupported>
      <IfSessionModeSupported mode="inline">
        <span className='desktopMessage'>{"You're on desktop lols"}</span>
      </IfSessionModeSupported>
    </div>
  )
}