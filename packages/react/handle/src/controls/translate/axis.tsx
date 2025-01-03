import { Axis } from '@pmndrs/handle'
import { Control } from '../context.js'
import { ColorRepresentation, CylinderGeometry, Euler } from 'three'
import { MeshControlsMaterial } from '../material.js'
import { GroupProps } from '@react-three/fiber'

const arrowHeadGeometry = new CylinderGeometry(0, 0.04, 0.1, 12)
arrowHeadGeometry.translate(0, 0.05, 0)

const arrowBodyGeometry = new CylinderGeometry(0.0075, 0.0075, 0.5, 3)
arrowBodyGeometry.translate(0, 0.25, 0)

export type AxisTranslateControlProperties = {
  tag: Axis
  invert?: boolean
  showArrowBody?: boolean
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
} & GroupProps

const normalRotation = new Euler(0, 0, -Math.PI / 2)
const invertedRotation = new Euler(0, 0, Math.PI / 2)

export function AxisTranslateControl({
  tag,
  invert = false,
  showArrowBody = true,
  color,
  opacity,
  hoverColor,
  hoverOpacity,
  ...props
}: AxisTranslateControlProperties) {
  const rotation = invert ? invertedRotation : normalRotation
  return (
    <group {...props}>
      <Control tag={tag} scale={false} rotate={false} translate={tag} multitouch={false}>
        <mesh visible={false} position-x={invert ? -0.3 : 0.3} rotation={rotation}>
          <cylinderGeometry args={[0.2, 0, 0.6, 4]} />
        </mesh>
      </Control>
      <mesh geometry={arrowHeadGeometry} position-x={invert ? -0.5 : 0.5} rotation={rotation}>
        <MeshControlsMaterial
          tag={tag}
          color={color}
          opacity={opacity}
          hoverOpacity={hoverOpacity}
          hoverColor={hoverColor}
        />
      </mesh>
      {showArrowBody && (
        <mesh geometry={arrowBodyGeometry} rotation={rotation}>
          <MeshControlsMaterial
            tag={tag}
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
