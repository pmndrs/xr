import * as THREE from 'three'
import { useCallback, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider, BallCollider } from '@react-three/rapier'
import { createXRStore, XR, XROrigin } from '@react-three/xr'
import { Hand } from './Hand.jsx'
import { Suspense } from 'react'
import { state } from './state.js'

const store = createXRStore({ hand: Hand })

export function App() {
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          position: 'absolute',
          zIndex: 10000,
          bottom: '1rem',
          left: '50%',
          transform: 'translate(-50%, 0)',
        }}
      >
        <button
          style={{
            background: 'black',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 'bold',
            color: 'white',
            padding: '1rem 2rem',
            cursor: 'pointer',
            fontSize: '1.5rem',
            boxShadow: '0px 0px 20px rgba(0,0,0,1)',
          }}
          onClick={() => store.enterAR()}
        >
          Enter AR
        </button>
        <button
          style={{
            background: 'black',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 'bold',
            color: 'white',
            padding: '1rem 2rem',
            cursor: 'pointer',
            fontSize: '1.5rem',
            boxShadow: '0px 0px 20px rgba(0,0,0,1)',
          }}
          onClick={() => store.enterVR()}
        >
          Enter VR
        </button>
      </div>
      <Canvas shadows dpr={[1, 1.5]}>
        <Physics maxCcdSubsteps={10} gravity={[0, -5, 0]} timeStep="vary">
          <XR store={store}>
            <color attach="background" args={['#f0f0f0']} />
            <ambientLight intensity={0.5 * Math.PI} />
            <spotLight
              decay={0}
              position={[-10, 15, -5]}
              angle={1}
              penumbra={1}
              intensity={2}
              castShadow
              shadow-mapSize={1024}
              shadow-bias={-0.0001}
            />
            <Suspense>
              <Ball />
            </Suspense>
            <XROrigin />
          </XR>
        </Physics>
      </Canvas>
    </>
  )
}

function Ball() {
  const api = useRef()
  const map = useTexture('crossp.jpg')
  const onCollisionEnter = useCallback(() => {
    state.api.reset()
    api.current.resetForces(true)
    api.current.resetTorques(true)
    api.current.setTranslation({ x: 0, y: 2, z: -0.5 })
    api.current.setAngvel({ x: 0, y: 0, z: 0 })
    api.current.setLinvel({ x: 0, y: 2, z: 0 })
  }, [])
  return (
    <>
      <RigidBody
        ccd
        ref={api}
        angularDamping={0.1}
        restitution={1.5}
        canSleep={false}
        colliders={false}
        enabledTranslations={[true, true, false]}
      >
        <BallCollider args={[0.02]} />
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.02, 64, 64]} />
          <meshStandardMaterial map={map} />
        </mesh>
      </RigidBody>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, -3, 0]}
        restitution={2.1}
        onCollisionEnter={onCollisionEnter}
      >
        <CuboidCollider args={[1000, 2, 1000]} />
      </RigidBody>
    </>
  )
}
