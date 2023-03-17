import * as React from 'react'
import { useThree } from '@react-three/fiber'
import { Interactive, useXR } from '@react-three/xr'
import { useCallback, useEffect, useState } from 'react'
import { Quaternion, Vector3 } from 'three'

export function useTeleportation() {
  const [baseReferenceSpace, setBaseReferenceSpace] = useState<XRReferenceSpace | null>(null)
  const { xr: xrManager } = useThree((state) => state.gl)
  const { session } = useXR()

  useEffect(() => {
    const b = xrManager.getReferenceSpace()
    if (b) {
      setBaseReferenceSpace(b)
    }
    const onSessionStart = () => {
      if (xrManager) {
        setBaseReferenceSpace(xrManager.getReferenceSpace())
      }
    }
    xrManager.addEventListener('sessionstart', onSessionStart)
    return () => {
      xrManager.removeEventListener('sessionstart', onSessionStart)
    }
  }, [xrManager])

  const teleportTo = useCallback(
    async (worldPosition: Vector3) => {
      if (baseReferenceSpace && session) {
        const pose = await new Promise<XRViewerPose | undefined>((resolve) => {
          session.requestAnimationFrame((_, xrFrame) => {
            const pose = xrFrame.getViewerPose(baseReferenceSpace)
            resolve(pose)
          })
        })

        const offsetX = pose?.transform.position.x || 0
        const offsetZ = pose?.transform.position.z || 0

        const offsetFromBase = {
          x: -worldPosition.x + offsetX,
          y: -worldPosition.y,
          z: -worldPosition.z + offsetZ
        }
        const transform = new XRRigidTransform(offsetFromBase, new Quaternion())
        const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace(transform)
        xrManager.setReferenceSpace(teleportSpaceOffset)
      }
    },
    [baseReferenceSpace, xrManager, session]
  )

  return teleportTo
}

export type TeleportationPlaneProps = {
  leftHand?: boolean
  rightHand?: boolean
  maxDistance?: number
}

const MARKER_SIZE = 0.25

export function TeleportationPlane(props: TeleportationPlaneProps) {
  const teleportTo = useTeleportation()
  const [intersection, setIntersection] = useState<Vector3 | null>(null)
  const [size, setSize] = useState(MARKER_SIZE)
  const maxDistanceTeleport = props.maxDistance || 10
  const { camera } = useThree()

  return (
    <>
      {intersection && (
        <mesh position={[intersection?.x, 0, intersection?.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry attach="geometry" args={[size, 32]} />
          <meshBasicMaterial attach="material" color="white" />
        </mesh>
      )}
      <Interactive
        onMove={(e) => {
          if (
            (e.target.inputSource.handedness === 'left' && !props.leftHand) ||
            (e.target.inputSource.handedness === 'right' && !props.rightHand)
          ) {
            return
          }

          if (e.intersection) {
            const distanceFromCamera = e.intersection.point.distanceTo(camera.position)
            if (distanceFromCamera > maxDistanceTeleport) {
              setSize(0)
            } else {
              setSize(MARKER_SIZE)
            }
            setIntersection(new Vector3(e.intersection.point.x, e.intersection.point.y, e.intersection.point.z))
          }
        }}
        onHover={(e) => {
          if (
            (e.target.inputSource.handedness === 'left' && !props.leftHand) ||
            (e.target.inputSource.handedness === 'right' && !props.rightHand)
          ) {
            return
          }
          if (e.intersection) {
            const distanceFromCamera = e.intersection.point.distanceTo(camera.position)
            if (distanceFromCamera > maxDistanceTeleport) {
              setSize(0)
            } else {
              setSize(MARKER_SIZE)
            }
            setSize(MARKER_SIZE)
          }
        }}
        onBlur={(e) => {
          if (
            (e.target.inputSource.handedness === 'left' && !props.leftHand) ||
            (e.target.inputSource.handedness === 'right' && !props.rightHand)
          ) {
            return
          }
          setSize(0)
        }}
        onSelectStart={(e) => {
          if (
            (e.target.inputSource.handedness === 'left' && !props.leftHand) ||
            (e.target.inputSource.handedness === 'right' && !props.rightHand)
          ) {
            return
          }
          if (e.intersection) {
            const distanceFromCamera = e.intersection.point.distanceTo(camera.position)
            if (distanceFromCamera > maxDistanceTeleport) {
              setSize(0)
            } else {
              setSize(MARKER_SIZE * 1.1)
            }
          }
        }}
        onSelectEnd={(e) => {
          setSize(MARKER_SIZE)
          if (
            (e.target.inputSource.handedness === 'left' && !props.leftHand) ||
            (e.target.inputSource.handedness === 'right' && !props.rightHand)
          ) {
            return
          }
          if (intersection) {
            const distanceFromCamera = intersection.distanceTo(camera.position)
            if (distanceFromCamera <= maxDistanceTeleport) {
              teleportTo(intersection)
            }
          }
        }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1000, 1000, 1000]}>
          <planeGeometry attach="geometry" args={[1, 1]} />
          <meshBasicMaterial attach="material" transparent opacity={0} />
        </mesh>
      </Interactive>
    </>
  )
}
