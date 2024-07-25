import { useCallback, useRef } from 'react'
import { Text, useGLTF } from '@react-three/drei'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import { useSnapshot } from 'valtio'
import { state } from './state.js'
import { Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3 } from 'three'
import { useXRHandState, XRHandModel } from '@react-three/xr'

export function Hand() {
  const handState = useXRHandState()
  return (
    <>
      <Suspense>
        <XRHandModel renderOrder={-1} colorWrite={false} />
      </Suspense>
      <group scale={0.045}>
        <Suspense>
          <Paddle handedness={handState.inputSource.handedness} />
        </Suspense>
      </group>
    </>
  )
}

const vectorHelper = new Vector3()
const quaternionHelper = new Quaternion()

function Paddle({ handedness }) {
  const api = useRef()
  const ref = useRef()
  const model = useRef()
  const { count } = useSnapshot(state)
  const { nodes, materials } = useGLTF('pingpong.glb')
  const contactForce = useCallback((payload) => {
    state.api.pong(payload.totalForceMagnitude * 1300)
  }, [])
  useFrame(() => {
    ref.current.getWorldPosition(vectorHelper)
    api.current.setTranslation(vectorHelper)

    ref.current.getWorldQuaternion(quaternionHelper)
    api.current.setRotation(quaternionHelper)
  })
  return (
    <group
      position={[0, -1, -1.6]}
      rotation-z={handedness === 'left' ? 0.6 : -0.6}
      rotation-x={0}
      rotation-y={handedness === 'left' ? -0.7 : 0.7}
    >
      <group ref={ref} position={[0.1, 0.3, -2.6]}>
        <Text
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, Math.PI, 0]}
          position={[0, -0.2, 0]}
          fontSize={10}
          scale={0.15}
          children={count}
        />
      </group>
      <RigidBody ccd canSleep={false} ref={api} type="kinematicPosition" colliders={false}>
        <CylinderCollider onContactForce={contactForce} args={[0.15, 1.9]} />
      </RigidBody>
      <group ref={model} scale={0.15}>
        <group rotation={[0, -0.04, 0]} scale={141.94}>
          <mesh castShadow receiveShadow material={materials.wood} geometry={nodes.mesh.geometry} />
          <mesh castShadow receiveShadow material={materials.side} geometry={nodes.mesh_1.geometry} />
          <mesh castShadow receiveShadow material={materials.foam} geometry={nodes.mesh_2.geometry} />
          <mesh castShadow receiveShadow material={materials.lower} geometry={nodes.mesh_3.geometry} />
          <mesh castShadow receiveShadow material={materials.upper} geometry={nodes.mesh_4.geometry} />
        </group>
      </group>
    </group>
  )
}
