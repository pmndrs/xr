import { isFacingCamera } from '@pmndrs/xr'
import { useFrame, useThree } from '@react-three/fiber'
import { ReactNode, RefObject, useRef, useState } from 'react'
import { Group, Vector3 } from 'three'

function useIsFacingCamera(
  ref: RefObject<Group>,
  set: (show: boolean) => void,
  direction: Vector3,
  angle: number,
): void {
  const camera = useThree((state) => state.camera)
  useFrame(() => {
    if (ref.current == null) {
      return
    }
    set(isFacingCamera(camera, ref.current, direction, angle))
  })
}

/**
 * guard that only shows its shildren if the camera towards the object based on the provided angle and direction
 */
export function ShowIfFacingCamera({
  children,
  direction,
  angle = Math.PI / 2,
}: {
  children?: ReactNode
  direction: Vector3
  angle?: number
}) {
  const ref = useRef<Group>(null)
  useIsFacingCamera(
    ref,
    (visible) => {
      if (ref.current == null) {
        return
      }
      ref.current.visible = visible
    },
    direction,
    angle,
  )
  return <group ref={ref}>{children}</group>
}

/**
 * guard that only renders its shildren if the camera towards the object based on the provided angle and direction
 */
export function IfFacingCamera({
  children,
  direction,
  angle = Math.PI / 2,
}: {
  children?: ReactNode
  direction: Vector3
  angle?: number
}) {
  const ref = useRef<Group>(null)
  const [show, setShow] = useState(false)
  useIsFacingCamera(ref, setShow, direction, angle)
  return show ? <>{children}</> : null
}
