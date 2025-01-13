import { Axis, HandleTransformOptions } from '@pmndrs/handle'
import { RegisteredHandle } from '../context.js'
import { ColorRepresentation, CylinderGeometry, Euler, Vector2Tuple, Vector3Tuple } from 'three'
import { MeshHandlesContextMaterial } from '../material.js'
import { GroupProps } from '@react-three/fiber'
import { useExtractHandleTransformOptions } from '../utils.js'

const arrowHeadGeometry = new CylinderGeometry(0, 0.04, 0.1, 12)
arrowHeadGeometry.translate(0, 0.05, 0)

const arrowBodyGeometry = new CylinderGeometry(0.0075, 0.0075, 0.5, 3)
arrowBodyGeometry.translate(0, 0.25, 0)

export type AxisTranslateControlProperties = {
  tag: Axis
  tagPrefix?: string
  enabled?: Exclude<HandleTransformOptions, Array<Vector3Tuple>>
  invert?: boolean
  showArrowBody?: boolean
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
  axis?: Vector3Tuple
} & GroupProps

const normalRotation = new Euler(0, 0, -Math.PI / 2)
const invertedRotation = new Euler(0, 0, Math.PI / 2)

export function AxisTranslateHandle({
  tag,
  tagPrefix = '',
  invert = false,
  showArrowBody = true,
  enabled,
  color,
  opacity,
  hoverColor,
  hoverOpacity,
  axis,
  ...props
}: AxisTranslateControlProperties) {
  const rotation = invert ? invertedRotation : normalRotation
  const translateOptions = useExtractHandleTransformOptions(tag, enabled)
  if (translateOptions === false) {
    return null
  }
  return (
    <group {...props}>
      <RegisteredHandle
        tag={tagPrefix + tag}
        scale={false}
        rotate={false}
        translate={axis != null ? [axis] : translateOptions}
        multitouch={false}
      >
        <mesh visible={false} pointerEventsOrder={Infinity} position-x={invert ? -0.3 : 0.3} rotation={rotation}>
          <cylinderGeometry args={[0.13, 0, 0.6, 4]} />
        </mesh>
      </RegisteredHandle>
      <mesh renderOrder={Infinity} geometry={arrowHeadGeometry} position-x={invert ? -0.5 : 0.5} rotation={rotation}>
        <MeshHandlesContextMaterial
          tag={tagPrefix + tag}
          color={color}
          opacity={opacity}
          hoverOpacity={hoverOpacity}
          hoverColor={hoverColor}
        />
      </mesh>
      {showArrowBody && (
        <mesh renderOrder={Infinity} geometry={arrowBodyGeometry} rotation={rotation}>
          <MeshHandlesContextMaterial
            tag={tagPrefix + tag}
            color={color}
            opacity={opacity}
            hoverOpacity={hoverOpacity}
            hoverColor={hoverColor}
          />
        </mesh>
      )}
    </group>
  )
}
