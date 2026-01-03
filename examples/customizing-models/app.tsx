import { Box, OrbitControls, Plane } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
import { useState } from 'react'
import * as THREE from 'three'
import { CustomHand } from './CustomHand.js'
import './styles.css'

const store = createXRStore({ hand: CustomHand })

const axisColor = new THREE.Color('#9d3d4a')
const gridColor = new THREE.Color('#4f4f4f')

export function App() {
  const [boxColor, setBoxColor] = useState('orange')

  const onBoxClick = () => {
    setBoxColor(boxColor === 'orange' ? 'purple' : 'orange')
  }

  return (
    <div className="App">
      <Canvas camera={{ position: [5, 3, 5] }}>
        <color attach={'background'} args={['#3f3f3f']} />
        <gridHelper args={[50, 50, axisColor, gridColor]} />
        <XR store={store}>
          <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={'darkgreen'} />
          </Plane>
          <Box onClick={onBoxClick} position={[0, 2, -1]}>
            <meshBasicMaterial color={boxColor} />
          </Box>
        </XR>
        <OrbitControls />
      </Canvas>
      <button onClick={() => store.enterVR()}>{'Enter VR'}</button>
    </div>
  )
}
