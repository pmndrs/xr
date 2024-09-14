import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  CapsuleCollider,
  interactionGroups,
  RapierRigidBody,
  RigidBody,
  useRapier,
  Vector3Object,
} from '@react-three/rapier'
import { IfInSessionMode } from '@react-three/xr'
import { useRef } from 'react'
import * as THREE from 'three'

import { Axe } from './Axe.jsx'
import { VRPlayerControl } from './VRPlayerControl.jsx'

const SPEED = 5
const direction = new THREE.Vector3()
const frontVector = new THREE.Vector3()
const sideVector = new THREE.Vector3()
const rotation = new THREE.Vector3()

const vectorHelper = new THREE.Vector3()

export function Player({ lerp = THREE.MathUtils.lerp }) {
  const axe = useRef<THREE.Group>(null)
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const { rapier, world } = useRapier()
  const [, getKeys] = useKeyboardControls()

  const playerMove = ({
    forward,
    backward,
    left,
    right,
    rotation,
    velocity,
    newVelocity,
  }: {
    forward: boolean
    backward: boolean
    left: boolean
    right: boolean
    rotation: THREE.Euler
    velocity?: Vector3Object
    newVelocity?: THREE.Vector3
  }) => {
    if (!velocity) {
      velocity = rigidBodyRef.current?.linvel()
    }

    if (newVelocity) {
      // If we have a new velocity, we're in VR mode
      rigidBodyRef.current?.setLinvel({ x: newVelocity.x, y: velocity?.y ?? 0, z: newVelocity.z }, true)
      rigidBodyRef.current?.setRotation(new THREE.Quaternion().setFromEuler(rotation), true)
      return
    }

    frontVector.set(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0))
    sideVector.set((left ? 1 : 0) - (right ? 1 : 0), 0, 0)
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED).applyEuler(rotation)
    rigidBodyRef.current?.setLinvel({ x: direction.x, y: velocity?.y ?? 0, z: direction.z }, true)
  }

  const playerJump = () => {
    if (rigidBodyRef.current == null) {
      return
    }
    const ray = world.castRay(
      new rapier.Ray(rigidBodyRef.current.translation(), { x: 0, y: -1, z: 0 }),
      Infinity,
      false,
      undefined,
      interactionGroups([1, 0], [1]),
    )
    const grounded = ray != null && Math.abs(ray.timeOfImpact) <= 1.25

    if (grounded) {
      rigidBodyRef.current.setLinvel({ x: 0, y: 7.5, z: 0 }, true)
    }
  }

  useFrame((state) => {
    if (rigidBodyRef.current == null) {
      return
    }
    const { forward, backward, left, right, jump } = getKeys()
    const velocity = rigidBodyRef.current.linvel()

    vectorHelper.set(velocity.x, velocity.y, velocity.z)

    // update camera
    const { x, y, z } = rigidBodyRef.current.translation()
    state.camera.position.set(x, y, z)

    // update axe
    if (axe.current != null) {
      axe.current.children[0].rotation.x = lerp(
        axe.current.children[0].rotation.x,
        Math.sin((vectorHelper.length() > 1 ? 1 : 0) * state.clock.elapsedTime * 10) / 6,
        0.1,
      )
      axe.current.rotation.copy(state.camera.rotation)
      axe.current.position.copy(state.camera.position).add(state.camera.getWorldDirection(rotation).multiplyScalar(1))
    }

    // movement
    if (rigidBodyRef.current) {
      playerMove({
        forward,
        backward,
        left,
        right,
        rotation: state.camera.rotation,
        velocity,
      })

      if (jump) {
        playerJump()
      }
    }
  })

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 10, 0]}
        enabledRotations={[false, false, false]}
        canSleep={false}
        collisionGroups={interactionGroups([0], [0])}
      >
        <CapsuleCollider args={[0.75, 0.5]} />

        <IfInSessionMode allow={['immersive-ar', 'immersive-vr']}>
          <VRPlayerControl playerJump={playerJump} playerMove={playerMove} />
        </IfInSessionMode>
      </RigidBody>

      <IfInSessionMode deny="immersive-vr">
        <group
          ref={axe}
          onPointerMissed={(e) => {
            if (axe.current == null) {
              return
            }
            axe.current.children[0].rotation.x = -0.5
          }}
        >
          <Axe position={[0.3, -0.35, 0.5]} />
        </group>
      </IfInSessionMode>
    </>
  )
}
