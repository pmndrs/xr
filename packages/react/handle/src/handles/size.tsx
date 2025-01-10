import { useFrame } from '@react-three/fiber'
import { ReactNode, useRef } from 'react'
import { Group, OrthographicCamera, Vector3 } from 'three'

const worldPositionHelper = new Vector3()
const cameraPositionHelper = new Vector3()

export function HandlesSize({
  size = 1,
  children,
  fixed = true,
}: {
  fixed?: boolean
  size?: number
  children?: ReactNode
}) {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    if (ref.current == null) {
      return
    }

    if (!fixed) {
      ref.current.scale.setScalar(size)
      return
    }

    const camera = state.camera

    //from https://github.com/mrdoob/three.js/blob/79497a2c9b86036cfcc0c7ed448574f2d62de64d/examples/jsm/controls/TransformControls.js#L1245
    let factor
    if (camera instanceof OrthographicCamera) {
      factor = (camera.top - camera.bottom) / camera.zoom
    } else {
      camera.getWorldPosition(worldPositionHelper)
      ref.current.getWorldPosition(cameraPositionHelper)
      factor =
        worldPositionHelper.distanceTo(cameraPositionHelper) *
        Math.min((1.9 * Math.tan((Math.PI * camera.fov) / 360)) / camera.zoom, 7)
    }

    ref.current.scale.set(1, 1, 1).multiplyScalar((factor * size) / 4)
  })
  return <group ref={ref}>{children}</group>
}
