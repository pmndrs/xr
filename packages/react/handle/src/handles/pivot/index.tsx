import {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  RefObject,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { Group, Object3D, Quaternion, Vector3, Vector3Tuple } from 'three'
import { AxisTranslateHandle, PlaneTranslateHandle } from '../translate/index.js'
import { HandlesContext } from '../context.js'
import { GroupProps, useFrame } from '@react-three/fiber'
import { HandleOptions, HandleTransformOptions } from '@pmndrs/handle'
import { PivotAxisScaleHandle } from './scale.js'
import { PivotAxisRotateHandle } from './rotate.js'
import { HandlesSize } from '../size.js'

export type PivotHandlesProperties = Omit<GroupProps, 'scale'> &
  Pick<HandleOptions<any>, 'alwaysUpdate' | 'apply' | 'stopPropagation'> & {
    translate?: Exclude<HandleTransformOptions, Array<Vector3Tuple>>
    scale?: Exclude<HandleTransformOptions, Array<Vector3Tuple>>
    rotate?: Exclude<HandleTransformOptions, Array<Vector3Tuple>>
    size?: number
    fixed?: boolean
  }

export const PivotHandles: ForwardRefExoticComponent<PropsWithoutRef<PivotHandlesProperties> & RefAttributes<Group>> =
  forwardRef<Group, PivotHandlesProperties>(
    ({ children, alwaysUpdate, apply, stopPropagation, translate, scale, rotate, size, fixed, ...props }, ref) => {
      const groupRef = useRef<Group>(null)
      useImperativeHandle(ref, () => groupRef.current!, [])

      const xAxis = useLocalAxis(groupRef, 1, 0, 0)
      const yAxis = useLocalAxis(groupRef, 0, 1, 0)
      const zAxis = useLocalAxis(groupRef, 0, 0, 1)

      return (
        <HandlesContext
          alwaysUpdate={alwaysUpdate}
          apply={apply}
          stopPropagation={stopPropagation}
          targetRef={groupRef}
        >
          <group ref={groupRef} {...props}>
            <HandlesSize size={size} fixed={fixed}>
              {/** Translate */}
              <AxisTranslateHandle
                axis={xAxis}
                color={0xff2060}
                opacity={1}
                hoverColor={0xffff40}
                tag="x"
                tagPrefix="ta"
                enabled={translate}
              />
              <AxisTranslateHandle
                axis={yAxis}
                color={0x20df80}
                opacity={1}
                hoverColor={0xffff40}
                tag="y"
                tagPrefix="ta"
                enabled={translate}
                rotation-z={Math.PI / 2}
              />
              <AxisTranslateHandle
                axis={zAxis}
                color={0x2080ff}
                opacity={1}
                hoverColor={0xffff40}
                tag="z"
                tagPrefix="ta"
                enabled={translate}
                rotation-y={-Math.PI / 2}
              />
              <PlaneTranslateHandle
                axes={[xAxis, yAxis]}
                color={0xff2060}
                opacity={1}
                hoverColor={0xffff40}
                tag="xy"
                tagPrefix="tp"
                enabled={translate}
              />
              <PlaneTranslateHandle
                axes={[xAxis, zAxis]}
                color={0x20df80}
                opacity={1}
                hoverColor={0xffff40}
                tag="xz"
                tagPrefix="tp"
                enabled={translate}
                rotation-x={Math.PI / 2}
              />
              <PlaneTranslateHandle
                axes={[yAxis, zAxis]}
                color={0x2080ff}
                opacity={1}
                hoverColor={0xffff40}
                tag="yz"
                tagPrefix="tp"
                enabled={translate}
                rotation-y={-Math.PI / 2}
              />
              {/** Rotate */}
              <PivotAxisRotateHandle
                axis={xAxis}
                tag="x"
                tagPrefix="r"
                color={0xff2060}
                hoverColor={0xffff40}
                opacity={1}
                enabled={rotate}
              />
              <PivotAxisRotateHandle
                tag="y"
                tagPrefix="r"
                axis={yAxis}
                color={0x20df80}
                hoverColor={0xffff40}
                opacity={1}
                enabled={rotate}
                rotation-z={-Math.PI / 2}
              />
              <PivotAxisRotateHandle
                tag="z"
                tagPrefix="r"
                axis={zAxis}
                color={0x2080fff}
                hoverColor={0xffff40}
                opacity={1}
                enabled={rotate}
                rotation-y={Math.PI / 2}
              />
              {/** Scale */}
              <PivotAxisScaleHandle
                tagPrefix="s"
                tag="x"
                color={0xff2060}
                hoverColor={0xffff40}
                opacity={1}
                enabled={scale}
              />
              <PivotAxisScaleHandle
                tagPrefix="s"
                tag="y"
                color={0x20df80}
                hoverColor={0xffff40}
                opacity={1}
                enabled={scale}
                rotation-z={Math.PI / 2}
              />
              <PivotAxisScaleHandle
                tagPrefix="s"
                tag="z"
                color={0x2080ff}
                hoverColor={0xffff40}
                opacity={1}
                enabled={scale}
                rotation-y={-Math.PI / 2}
              />
            </HandlesSize>
            {children}
          </group>
        </HandlesContext>
      )
    },
  )

const vectorHelper = new Vector3()
const quaternionHelper = new Quaternion()
const scaleHelper = new Vector3()

function useLocalAxis(ref: RefObject<Object3D>, ...[x, y, z]: Vector3Tuple) {
  const result = useMemo<Vector3Tuple>(() => [0, 0, 0], [])
  useFrame(() => {
    if (ref.current == null) {
      return
    }

    ref.current.matrixWorld.decompose(vectorHelper, quaternionHelper, scaleHelper)
    vectorHelper.set(x, y, z)
    vectorHelper.applyQuaternion(quaternionHelper)
    vectorHelper.toArray(result)
  })
  return result
}

/**
 * @deprecated use PivotHandles instead
 */
export const PivotControls = PivotHandles
