import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
import { Suspense, useState } from 'react'
import * as THREE from 'three'
import { InstructionsPage } from './InstructionsPage.js'
import { Scene } from './Scene.js'
import { SelectableComponents } from './SelectableComponents.enum'
import './styles.css'

const store = createXRStore()

const axisColor = new THREE.Color('#9d3d4a')
const gridColor = new THREE.Color('#4f4f4f')

export default function App() {
  const [selectedElement, setSelectedElement] = useState(SelectableComponents.default)

  const onNextClick = () => {
    setSelectedElement(SelectableComponents.getNextValue(selectedElement))
  }

  const onPrevClick = () => {
    setSelectedElement(SelectableComponents.getPrevValue(selectedElement))
  }

  return (
    <div className="App">
      <Canvas
        camera={{
          position: [3.0, 2.1, 4.0],
        }}
      >
        <color attach={'background'} args={['#3f3f3f']} />
        <fog attach={'fog'} args={['#3f3f3f', 5, 30]} />
        <ambientLight />
        <directionalLight position={[0, 5, 5]} />
        <gridHelper args={[50, 50, axisColor, gridColor]} />
        <Suspense fallback={null}>
          <XR store={store}>
            <Scene
              selectedElement={selectedElement}
              isPositionedObjectSelected={SelectableComponents.isPositionedObjectSelected(selectedElement)}
              setSelectedElement={setSelectedElement}
            />
          </XR>
        </Suspense>
        <OrbitControls target={[1, 1, 0]} />
      </Canvas>
      <div className="titleText" onClick={() => setSelectedElement(SelectableComponents.default)}>
        {'WebXR Spaces'}
      </div>
      <InstructionsPage selectedElement={selectedElement} onNextClick={onNextClick} onPrevClick={onPrevClick} />
    </div>
  )
}
