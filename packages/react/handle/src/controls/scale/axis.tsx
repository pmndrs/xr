import { Axis } from '@pmndrs/handle'
import { GroupProps } from '@react-three/fiber'
import { ColorRepresentation, CylinderGeometry, Euler } from 'three'
import { MeshControlsMaterial } from '../material.js'
import { Control } from '../context.js'

export type AxisScaleHandleProperties = {
  invert?: boolean
  showHandleLine?: boolean
  tag: Axis
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
} & GroupProps

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
  ...props
}: AxisScaleHandleProperties) {
  const rotation = invert ? invertedRotation : normalRotation
  return (
    <group {...props}>
      <Control tag={tag} scale={tag} rotate={false} translate="as-scale" multitouch={false}>
        <group visible={false} position-x={invert ? -0.3 : 0.3} rotation={rotation}>
          <mesh position-y={0.04}>
            <cylinderGeometry args={[0.2, 0, 0.6, 4]} />
          </mesh>
        </group>
      </Control>
      <group position-x={invert ? -0.5 : 0.5} rotation={rotation}>
        <mesh position-y={0.04}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <MeshControlsMaterial
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
          <mesh position-y={0.25}>
            <cylinderGeometry args={[0.0075, 0.0075, 0.5, 3]} />
            <MeshControlsMaterial
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
