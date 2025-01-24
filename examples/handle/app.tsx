import { Canvas } from '@react-three/fiber'
import { createXRStore, noEvents, PointerEvents, useXRControllerLocomotion, XR, XROrigin } from '@react-three/xr'
import { Environment, Gltf, Sky } from '@react-three/drei'
import { Ship } from './ship.js'
import { Handle, OrbitHandles } from '@react-three/handle'
import { ReactNode, RefObject, useImperativeHandle, useMemo, useRef } from 'react'
import { Group, Object3D } from 'three'
import { Physics, RapierRigidBody, RigidBody } from '@react-three/rapier'
import { RigidBodyType } from '@dimforge/rapier3d-compat'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas camera={{ position: [1, 1, 1] }} events={noEvents} style={{ width: '100%', flexGrow: 1 }}>
        <PointerEvents />
        <OrbitHandles />
        <Sky />
        <XR store={store}>
          <Locomotion />
          <Environment preset="city" />
          <Physics>
            <PhysicsHandle>
              <Gltf scale={0.2} src="axe.gltf" />
            </PhysicsHandle>
            <RigidBody includeInvisible colliders="cuboid" type="fixed">
              <mesh visible={true} scale={[200, 1, 200]} position={[0, -0.5, 0]}>
                <boxGeometry />
              </mesh>
            </RigidBody>
          </Physics>
        </XR>
      </Canvas>
    </>
  )
}

function PhysicsHandle({ children }: { children?: ReactNode }) {
  const ref = useRef<RapierRigidBody>(null)
  const groupRef = useRef<Group>(null)
  const targetRef = useMemo(
    () =>
      new Proxy<RefObject<Object3D>>(
        { current: null },
        {
          get() {
            return groupRef.current?.parent
          },
        },
      ),
    [],
  )
  return (
    <RigidBody ref={ref} colliders="trimesh" position={[0, 1, 0]}>
      <group ref={groupRef}>
        <Handle
          multitouch={false}
          handleRef={groupRef}
          scale={false}
          targetRef={targetRef}
          apply={(state) => {
            const rigidBody = ref.current
            if (rigidBody == null) {
              return
            }
            if (state.first) {
              rigidBody.setBodyType(RigidBodyType.KinematicPositionBased, true)
            }
            if (state.last) {
              rigidBody.setBodyType(RigidBodyType.Dynamic, true)
              /*
              doesnt work yet. Probably because of:https://github.com/pmndrs/xr/issues/383
              if (state.delta != null) {
                rigidBody.setLinvel(state.delta.position.clone().divideScalar(deltaTime), true)
                const deltaRotation = state.delta.rotation.clone()
                deltaRotation.x /= deltaTime
                deltaRotation.y /= deltaTime
                deltaRotation.z /= deltaTime
                rigidBody.setAngvel(deltaRotation, true)
              }*/
            } else {
              rigidBody.setRotation(state.current.quaternion, true)
              rigidBody.setTranslation(state.current.position, true)
            }
          }}
        >
          {children}
        </Handle>
      </group>
    </RigidBody>
  )
}

function Locomotion() {
  const ref = useRef<Group>(null)
  useXRControllerLocomotion(ref)
  return <XROrigin ref={ref} />
}
