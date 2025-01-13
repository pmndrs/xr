import { HandleTransformOptions, Axis, HandleStore } from '@pmndrs/handle'
import { config } from 'chai'
import { Vector3Tuple, ColorRepresentation, Group } from 'three'
import { RegisteredHandle } from '../context.js'
import { MeshHandlesContextMaterial } from '../material.js'
import { useExtractHandleTransformOptions } from '../utils.js'
import { ForwardRefExoticComponent, PropsWithoutRef, RefAttributes, forwardRef } from 'react'
import { RotateHandlesProperties } from '../rotate/index.js'

export type PivotAxisScaleHandleProperties = {
  axis?: Vector3Tuple
  enabled?: Exclude<HandleTransformOptions, Array<Vector3Tuple>>
  tag: Axis
  tagPrefix?: string
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
}

export const PivotAxisRotateHandle: ForwardRefExoticComponent<
  PropsWithoutRef<PivotAxisScaleHandleProperties> & RefAttributes<HandleStore<unknown>>
> = forwardRef<HandleStore<unknown>, PivotAxisScaleHandleProperties>(
  (
    {
      tagPrefix = '',
      color,
      opacity,
      tag,
      hoverColor,
      hoverOpacity,
      enabled,
      axis,
      ...props
    }: PivotAxisScaleHandleProperties,
    ref,
  ) => {
    const rotateOptions = useExtractHandleTransformOptions(tag, enabled)
    if (rotateOptions === false) {
      return null
    }
    return (
      <group {...props}>
        <RegisteredHandle
          tag={tagPrefix + tag}
          ref={ref}
          scale={false}
          translate="as-rotate"
          rotate={axis != null ? [axis] : rotateOptions}
          multitouch={false}
        >
          <mesh pointerEventsOrder={Infinity} visible={false} rotation={[0, Math.PI / 2, Math.PI / 2]}>
            <torusGeometry args={[0.45, 0.05, 4, 24, Math.PI / 2]} />
          </mesh>
        </RegisteredHandle>
        <mesh renderOrder={Infinity} rotation={[0, Math.PI / 2, Math.PI / 2]}>
          <torusGeometry args={[0.45, 0.0075, 3, 64, Math.PI / 2]} />
          <MeshHandlesContextMaterial
            color={color}
            opacity={opacity}
            tag={tagPrefix + tag}
            hoverColor={hoverColor}
            hoverOpacity={hoverOpacity}
          />
        </mesh>
      </group>
    )
  },
)
