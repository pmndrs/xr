import ReactDOM from 'react-dom'
import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react'
import {
  useXREvent,
  DefaultXRControllers,
  Hands,
  Select,
  Hover,
  useXR,
  XR,
  Interactive,
  InteractionManager,
  RayGrab,
  useHitTest,
  enableXR,
} from '@react-three/xr'
// import { OrbitControls, Sky, Text, Plane, Box } from '@react-three/drei'
import { Box, Sky, Text } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Group } from 'three'

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

function App() {
  return (
    <Canvas frameloop="never" onCreated={({ gl }) => enableXR(gl)}>
      <XR arButton={true} sessionInit={{ requiredFeatures: ['hit-test'] }}>
        <InteractionManager>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} />
          {/* <Button position={[0, 0.8, -1]} /> */}
          <DefaultXRControllers />
          {/* <HitTestExample /> */}
        </InteractionManager>
      </XR>
    </Canvas>
  )
}

ReactDOM.render(<App />, document.querySelector('#root'))
