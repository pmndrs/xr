import { isFacingCamera } from '@pmndrs/xr'
import { useFrame, useThree } from '@react-three/fiber'
import { ReactNode, RefObject, useRef, useState } from 'react'
import { Group, Vector3 } from 'three'

function useIsFacingCamera(
  ref: RefObject<Group | null>,
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

interface FacingCameraProps {
  children?: ReactNode
  direction: Vector3
  angle?: number
}
/**
 * Guard that only **shows** its children by toggling their visibility if the camera is facing the object.
 * Calculation is based on the provided angle and direction.
 *
 * @param props
 * #### `children` - `ReactNode` The ReactNode elements to conditionally show.
 * #### `direction` - [Vector3](https://threejs.org/docs/#api/en/math/Vector3) Direction vector to check against the camera's facing direction.
 * #### `angle` - `number` The angle in radians to determine visibility. Defaults to `Math.PI / 2` (90 degrees).
 */
export function ShowIfFacingCamera({ children, direction, angle = Math.PI / 2 }: FacingCameraProps) {
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
 * Guard that only **renders** its children into the scene if the camera is facing the object.
 * Calculation is based on the provided angle and direction.
 *
 * @param props
 * #### `children` - `ReactNode` The ReactNode elements to conditionally render.
 * #### `direction` - [Vector3](https://threejs.org/docs/#api/en/math/Vector3) Direction vector to check against the camera's facing direction.
 * #### `angle` - `number` The angle in radians to determine visibility. Defaults to `Math.PI / 2` (90 degrees).
 */
export function IfFacingCamera({ children, direction, angle = Math.PI / 2 }: FacingCameraProps) {
  const ref = useRef<Group>(null)
  const [show, setShow] = useState(false)
  useIsFacingCamera(ref, setShow, direction, angle)
  return <group ref={ref}>{show ? children : null}</group>
}
