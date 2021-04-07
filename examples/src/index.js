import ReactDOM from 'react-dom'
import React, { useState, useRef } from 'react'
import { DefaultXRControllers, useXR, XR, Interactive, useHitTest, startXRloop } from '@react-three/xr'
import { Box } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'

function Button(props) {
  const [hover, setHover] = useState(false)
  const [color, setColor] = useState(0x123456)

  return (
    <Interactive
      onSelect={() => setColor((Math.random() * 0xffffff) | 0)}
      onHover={() => setHover(true)}
      onBlur={() => setHover(false)}>
      <Box scale={hover ? [1.5, 1.5, 1.5] : [1, 1, 1]} args={[0.4, 0.1, 0.1]} {...props}>
        <meshStandardMaterial attach="material" color={color} />
        {/* <Text position={[0, 0, 0.06]} fontSize={0.05} color="#000" anchorX="center" anchorY="middle">
          Hello react-xr!
        </Text> */}
      </Box>
    </Interactive>
  )
}

function PlayerExample() {
  const { player } = useXR()

  useFrame(() => {
    player.rotation.x = player.rotation.y += 0.01
  })

  return null
}

function HitTestExample() {
  const ref = useRef()

  useHitTest((hit) => {
    hit.decompose(ref.current.position, ref.current.rotation, ref.current.scale)
  })

  return <Box ref={ref} args={[0.1, 0.1, 0.1]} />
}

function ARExample() {
  return (
    <Canvas frameloop="never" onCreated={({ gl }) => startXRloop(gl)}>
      <XR buttonAR={true} sessionInit={{ requiredFeatures: ['hit-test'] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} />
        <HitTestExample />
      </XR>
    </Canvas>
  )
}

function VRExample() {
  return (
    <Canvas frameloop="never" onCreated={({ gl }) => startXRloop(gl)}>
      <XR buttonVR={true}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} />
        <Button position={[0, 0.8, -1]} />
        <DefaultXRControllers />
      </XR>
    </Canvas>
  )
}

function App() {
  return <ARExample />
}

ReactDOM.render(<App />, document.querySelector('#root'))
