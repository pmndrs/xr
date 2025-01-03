import { GroupProps } from '@react-three/fiber'
import { ColorRepresentation } from 'three'
import { Control } from '../context.js'
import { MeshControlsMaterial } from '../material.js'
import { HandleTransformOptions } from '@pmndrs/handle'

export type PlaneTranslateControlProperties = {
  tag: 'yx' | 'xz' | 'zy'
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
} & GroupProps

const tagToTranslateProperties: Record<PlaneTranslateControlProperties['tag'], HandleTransformOptions> = {
  yx: {
    z: false,
  },
  xz: {
    y: false,
  },
  zy: { x: false },
}

export function PlaneTranslateControl({
  tag,
  color,
  hoverColor,
  opacity,
  hoverOpacity,
  ...props
}: PlaneTranslateControlProperties) {
  return (
    <Control
      {...props}
      tag={tag}
      scale={false}
      rotate={false}
      translate={tagToTranslateProperties[tag]}
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
