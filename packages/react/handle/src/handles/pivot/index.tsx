import {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react'
import { Group, Vector3Tuple } from 'three'
import { AxisTranslateHandle, PlaneTranslateHandle } from '../translate/index.js'
import { HandlesContext } from '../context.js'
import { GroupProps } from '@react-three/fiber'
import { HandleOptions, HandleTransformOptions } from '@pmndrs/handle'
import { PivotAxisScaleHandle } from './scale.js'
import { PivotAxisRotateHandle } from './rotate.js'

export type PivotHandlesProperties = Omit<GroupProps, 'scale'> &
  Pick<HandleOptions<any>, 'alwaysUpdate' | 'apply' | 'stopPropagation'> & {
    translate?: Exclude<HandleTransformOptions, Vector3Tuple>
    scale?: Exclude<HandleTransformOptions, Vector3Tuple>
    rotate?: Exclude<HandleTransformOptions, Vector3Tuple>
  }

export const PivotHandles: ForwardRefExoticComponent<PropsWithoutRef<PivotHandlesProperties> & RefAttributes<Group>> =
  forwardRef<Group, PivotHandlesProperties>(
    ({ children, alwaysUpdate, apply, stopPropagation, translate, scale, rotate, ...props }, ref) => {
      const groupRef = useRef<Group>(null)
      useImperativeHandle(ref, () => groupRef.current!, [])
      return (
        <HandlesContext
          alwaysUpdate={alwaysUpdate}
          apply={apply}
          stopPropagation={stopPropagation}
          targetRef={groupRef}
        >
          <group ref={groupRef} {...props}>
            {/** Translate */}
            <AxisTranslateHandle color={0xff2060} opacity={1} hoverColor={0xffff40} tag="x" enabled={translate} />
            <AxisTranslateHandle
              color={0x20df80}
              opacity={1}
              hoverColor={0xffff40}
              tag="y"
              enabled={translate}
              rotation-z={Math.PI / 2}
            />
            <AxisTranslateHandle
              color={0x2080ff}
              opacity={1}
              hoverColor={0xffff40}
              tag="z"
              enabled={translate}
              rotation-y={-Math.PI / 2}
            />
            <PlaneTranslateHandle color={0xff2060} opacity={1} hoverColor={0xffff40} tag="xy" enabled={translate} />
            <PlaneTranslateHandle
              color={0x20df80}
              opacity={1}
              hoverColor={0xffff40}
              tag="xz"
              enabled={translate}
              rotation-x={Math.PI / 2}
            />
            <PlaneTranslateHandle
              color={0x2080ff}
              opacity={1}
              hoverColor={0xffff40}
              tag="yz"
              enabled={translate}
              rotation-y={-Math.PI / 2}
            />
            {/** Rotate */}
            <PivotAxisRotateHandle tag="x" color={0xff2060} hoverColor={0xffff40} opacity={1} enabled={rotate} />
            <PivotAxisRotateHandle
              tag="y"
              color={0x20df80}
              hoverColor={0xffff40}
              opacity={1}
              enabled={rotate}
              rotation-z={-Math.PI / 2}
            />
            <PivotAxisRotateHandle
              tag="z"
              color={0x2080fff}
              hoverColor={0xffff40}
              opacity={1}
              enabled={rotate}
              rotation-y={Math.PI / 2}
            />
            {/** Scale */}
            <PivotAxisScaleHandle tag="x" color={0xff2060} hoverColor={0xffff40} opacity={1} enabled={scale} />
            <PivotAxisScaleHandle
              tag="y"
              color={0x20df80}
              hoverColor={0xffff40}
              opacity={1}
              enabled={scale}
              rotation-z={Math.PI / 2}
            />
            <PivotAxisScaleHandle
              tag="z"
              color={0x2080ff}
              hoverColor={0xffff40}
              opacity={1}
              enabled={scale}
              rotation-y={-Math.PI / 2}
            />
            {children}
          </group>
        </HandlesContext>
      )
    },
  )

/**
 * @deprecated use PivotHandles instead
 */
export const PivotControls = PivotHandles
