import { GroupProps } from '@react-three/fiber'
import { ColorRepresentation } from 'three'
import { Control } from '../context.js'
import { MeshControlsMaterial } from '../material.js'
import { HandleTransformOptions } from '@pmndrs/handle'

export type PlaneScaleControlProperties = {
  tag: 'yx' | 'xz' | 'zy'
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
} & GroupProps

const tagToScaleProperties: Record<PlaneScaleControlProperties['tag'], HandleTransformOptions> = {
  yx: {
    z: false,
  },
  xz: {
    y: false,
  },
  zy: { x: false },
}

export function PlaneScaleHandle({
  tag,
  color,
  hoverColor,
  opacity,
  hoverOpacity,
  ...props
}: PlaneScaleControlProperties) {
  return (
    <Control
      {...props}
      tag={tag}
      scale={tagToScaleProperties[tag]}
      rotate={false}
      translate="as-scale"
      multitouch={false}
    >
      <mesh position={[0.15, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.01]} />
        <MeshControlsMaterial
          tag={tag}
          color={color}
          opacity={opacity}
          hoverOpacity={hoverOpacity}
          hoverColor={hoverColor}
        />
      </mesh>
    </Control>
  )
}
