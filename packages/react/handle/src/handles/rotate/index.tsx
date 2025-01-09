import { HandleOptions, HandleTransformOptions } from '@pmndrs/handle'
import { GroupProps } from '@react-three/fiber'
import {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react'
import { Group, TorusGeometry, Vector2Tuple, Vector3Tuple } from 'three'
import { HandlesContext } from '../context.js'
import { AxisRotateHandle } from './axis.js'
import { HandlesAxisHighlight } from '../axis.js'
import { FreeRotateHandle } from './free.js'
import { ScreenSpaceRotateHandle } from './screen.js'

export type RotateHandlesProperties = Omit<GroupProps, 'scale'> &
  HandleOptions<any> & {
    enabled?:
      | Exclude<HandleTransformOptions, Vector3Tuple>
      | 'e'
      | {
          x?: boolean | Vector2Tuple
          y?: boolean | Vector2Tuple
          z?: boolean | Vector2Tuple
          e?: boolean | Vector2Tuple
        }
  }

export function createCircleGeometry(radius: number, arc: number) {
  const geometry = new TorusGeometry(radius, 0.0075, 3, 64, arc * Math.PI * 2)
  geometry.rotateY(Math.PI / 2)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

export const RotateHandles: ForwardRefExoticComponent<PropsWithoutRef<RotateHandlesProperties> & RefAttributes<Group>> =
  forwardRef<Group, RotateHandlesProperties>(
    (
      { children, alwaysUpdate, scale, rotate, translate, multitouch, apply, stopPropagation, enabled, ...props },
      ref,
    ) => {
      const groupRef = useRef<Group>(null)
      useImperativeHandle(ref, () => groupRef.current!, [])
      return (
        <HandlesContext
          alwaysUpdate={alwaysUpdate}
          scale={scale}
          rotate={rotate}
          translate={translate}
          multitouch={multitouch}
          apply={apply}
          stopPropagation={stopPropagation}
          targetRef={groupRef}
        >
          <group {...props}>
            {/* X */}
            <AxisRotateHandle enabled={enabled} color={0xff0000} opacity={1} tag="x" hoverColor={0xffff00} />
            <HandlesAxisHighlight enabled={enabled} tag="x" />

            {/* Y */}
            <AxisRotateHandle enabled={enabled} color={0x00ff00} opacity={1} tag="y" hoverColor={0xffff00} />
            <HandlesAxisHighlight enabled={enabled} rotation-z={-Math.PI / 2} tag="y" />

            {/* Z */}
            <AxisRotateHandle enabled={enabled} color={0x0000ff} opacity={1} tag="z" hoverColor={0xffff00} />
            <HandlesAxisHighlight enabled={enabled} rotation-y={Math.PI / 2} tag="z" />

            <FreeRotateHandle enabled={enabled} />

            <ScreenSpaceRotateHandle enabled={enabled} />

            <group ref={groupRef}>{children}</group>
          </group>
        </HandlesContext>
      )
    },
  )

export * from './axis.js'
export * from './free.js'
export * from './screen.js'
