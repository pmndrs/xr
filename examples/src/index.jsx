import { render } from 'react-dom'
import { useState, useRef, useMemo } from 'react'
import {
  XRCanvas,
  Hands,
  useXR,
  Interactive,
  useHitTest,
  DefaultXRControllers,
  XRSessionManager,
  EnterXRButton,
  ExitXRButton,
  useAvailableXRSessionModes,
  useXRSessionInfo,
} from '@react-three/xr'
import { Box, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

function Button(props) {
  const [hover, setHover] = useState(false)
  const [color, setColor] = useState(0x123456)

  return (
    <Interactive onSelect={() => setColor((Math.random() * 0xffffff) | 0)} onHover={() => setHover(true)} onBlur={() => setHover(false)}>
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
    <XRSessionManager>
      <XRCanvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} />

        <Hands
        // modelLeft={"https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/left-hand-black-webxr-tracking-ready/model.gltf"}
        // modelRight={"https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/right-hand-black-webxr-tracking-ready/model.gltf"}
        />
        <Button position={[0, 0.8, -1]} />
        <DefaultXRControllers />
        {/* <HitTestExample /> */}
      </XRCanvas>
      <XRButton />
    </XRSessionManager>
  )
}

const interestedSessions = ['immersive-ar', 'immersive-vr']

function XRButton() {
  const availableXRSessionModes = useAvailableXRSessionModes(interestedSessions)
  const sessionInfo = useXRSessionInfo()

  const sessionMode = useMemo(
    () => (availableXRSessionModes != null ? availableXRSessionModes[0] : undefined),
    [availableXRSessionModes]
  )

  if (sessionMode == null) {
    return null
  }

  if (sessionInfo == null) {
    return (
      <EnterXRButton {...props} sessionMode={sessionMode}>
        ENTER {sessionMode.toUpperCase()}
      </EnterXRButton>
    )
  } else {
    return (
      <ExitXRButton {...props} sessionMode={sessionMode}>
        EXIT {sessionMode.toUpperCase()}
      </ExitXRButton>
    )
  }
}

const props = {
  style: {
    cursor: 'pointer',
    background: '#fff',
    color: '#000',
    padding: '1rem 1.5rem',
    borderRadius: '1rem',
    position: 'absolute',
    left: '50%',
    transform: 'translate(-50%, 0)',
    bottom: '10vh',
    zIndex: 1,
  },
  sessionInit: {
    domOverlay: { root: document.body },
    optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar', 'local-floor', 'bounded-floor', 'hand-tracking'],
  },
}

render(<App />, document.querySelector('#root'))
