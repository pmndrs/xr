import { Axis, HandleTransformOptions } from '@pmndrs/handle'
import { ColorRepresentation, Euler, Vector3Tuple } from 'three'
import { MeshHandlesContextMaterial } from '../material.js'
import { RegisteredHandle } from '../context.js'
import { useExtractHandleTransformOptions } from '../utils.js'

export type AxisScaleHandleProperties = {
  enabled?: Exclude<HandleTransformOptions, Array<Vector3Tuple>>
  invert?: boolean
  showHandleLine?: boolean
  tag: Axis
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
}

const normalRotation = new Euler(0, 0, -Math.PI / 2)
const invertedRotation = new Euler(0, 0, Math.PI / 2)

export function AxisScaleHande({
  color,
  opacity,
  tag,
  hoverColor,
  hoverOpacity,
  invert = false,
  showHandleLine = true,
  enabled,
  ...props
}: AxisScaleHandleProperties) {
  const rotation = invert ? invertedRotation : normalRotation
  const scaleOptions = useExtractHandleTransformOptions(tag, enabled)
  if (scaleOptions === false) {
    return null
  }
  return (
    <group {...props}>
      <RegisteredHandle tag={tag} scale={scaleOptions} rotate={false} translate="as-scale" multitouch={false}>
        <group visible={false} position-x={invert ? -0.3 : 0.3} rotation={rotation}>
          <mesh pointerEventsOrder={Infinity} position-y={0.04}>
            <cylinderGeometry args={[0.2, 0, 0.6, 4]} />
          </mesh>
        </group>
      </RegisteredHandle>
      <group position-x={invert ? -0.5 : 0.5} rotation={rotation}>
        <mesh renderOrder={Infinity} position-y={0.04}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <MeshHandlesContextMaterial
            tag={tag}
            color={color}
            opacity={opacity}
            hoverOpacity={hoverOpacity}
            hoverColor={hoverColor}
          />
        </mesh>
      </group>
      {showHandleLine && (
        <group rotation={rotation}>
          <mesh renderOrder={Infinity} position-y={0.25}>
            <cylinderGeometry args={[0.0075, 0.0075, 0.5, 3]} />
            <MeshHandlesContextMaterial
              tag={tag}
              color={color}
              opacity={opacity}
              hoverOpacity={hoverOpacity}
              hoverColor={hoverColor}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
