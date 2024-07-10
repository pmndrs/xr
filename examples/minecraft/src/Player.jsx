import * as THREE from 'three'
import * as RAPIER from '@dimforge/rapier3d-compat'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { CapsuleCollider, RigidBody, useRapier } from '@react-three/rapier'
import { Axe } from './Axe.jsx'
import { IfInSessionMode } from '@react-three/xr'

const SPEED = 5
const direction = new THREE.Vector3()
const frontVector = new THREE.Vector3()
const sideVector = new THREE.Vector3()
const rotation = new THREE.Vector3()

const vectorHelper = new THREE.Vector3()

export function Player({ lerp = THREE.MathUtils.lerp }) {
  const axe = useRef()
  const ref = useRef()
  const rapier = useRapier()
  const [, get] = useKeyboardControls()
  useFrame((state) => {
    const { forward, backward, left, right, jump } = get()
    const velocity = ref.current.linvel()
    vectorHelper.set(velocity.x, velocity.y, velocity.z)
    // update camera
    const { x, y, z } = ref.current.translation()
    state.camera.position.set(x, y, z)
    // update axe
    if (axe.current != null) {
      axe.current.children[0].rotation.x = lerp(
        axe.current.children[0].rotation.x,
        Math.sin((vectorHelper.length() > 1) * state.clock.elapsedTime * 10) / 6,
        0.1,
      )
      axe.current.rotation.copy(state.camera.rotation)
      axe.current.position.copy(state.camera.position).add(state.camera.getWorldDirection(rotation).multiplyScalar(1))
    } // movement
    frontVector.set(0, 0, backward - forward)
    sideVector.set(left - right, 0, 0)
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED).applyEuler(state.camera.rotation)
    ref.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z })
    // jumping
    const world = rapier.world
    // eslint-disable-next-line @react-three/no-new-in-loop
    const ray = world.castRay(new RAPIER.Ray(ref.current.translation(), { x: 0, y: -1, z: 0 }))
    const grounded = ray && ray.collider && Math.abs(ray.toi) <= 1.75
    if (jump && grounded) ref.current.setLinvel({ x: 0, y: 7.5, z: 0 })
  })
  return (
    <>
      <RigidBody
        ref={ref}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 10, 0]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[0.75, 0.5]} />
      </RigidBody>
      <IfInSessionMode deny="immersive-vr">
        <group ref={axe} onPointerMissed={(e) => (axe.current.children[0].rotation.x = -0.5)}>
          <Axe position={[0.3, -0.35, 0.5]} />
        </group>
      </IfInSessionMode>
    </>
  )
}
