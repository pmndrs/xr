import {
  ForwardRefExoticComponent,
  MutableRefObject,
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
import { HandleOptions, HandleStore, HandleTransformOptions } from '@pmndrs/handle'
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

      const xAxis = useLocalAxis(groupRef, undefined, 1, 0, 0)
      const yAxis = useLocalAxis(groupRef, undefined, 0, 1, 0)
      const zAxis = useLocalAxis(groupRef, undefined, 0, 0, 1)

      const xRotationHandleStoreRef = useRef<HandleStore<unknown>>(null)
      const yRotationHandleStoreRef = useRef<HandleStore<unknown>>(null)
      const zRotationHandleStoreRef = useRef<HandleStore<unknown>>(null)
      const xRotationAxis = useLocalAxis(groupRef, xRotationHandleStoreRef, 1, 0, 0)
      const yRotationAxis = useLocalAxis(groupRef, yRotationHandleStoreRef, 0, 1, 0)
      const zRotationAxis = useLocalAxis(groupRef, zRotationHandleStoreRef, 0, 0, 1)

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
                axis={xRotationAxis}
                ref={xRotationHandleStoreRef}
                tag="x"
                tagPrefix="r"
                color={0xff2060}
                hoverColor={0xffff40}
                opacity={1}
                enabled={rotate}
              />
              <PivotAxisRotateHandle
                axis={yRotationAxis}
                ref={yRotationHandleStoreRef}
                tag="y"
                tagPrefix="r"
                color={0x20df80}
                hoverColor={0xffff40}
                opacity={1}
                enabled={rotate}
                rotation-z={-Math.PI / 2}
              />
              <PivotAxisRotateHandle
                axis={zRotationAxis}
                ref={zRotationHandleStoreRef}
                tag="z"
                tagPrefix="r"
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

function useLocalAxis(
  ref: RefObject<Object3D>,
  handleStoreRef: RefObject<HandleStore<unknown>> | undefined,
  ...[x, y, z]: Vector3Tuple
) {
  const result = useMemo<Vector3Tuple>(() => [0, 0, 0], [])
  useFrame(() => {
    //if the ref is not yet set or the we are currently interacting with the handle through the handle store (and therefore the state is set) we are not updating the result array
    if (ref.current == null) {
      return
    }
    if (handleStoreRef?.current?.getState() != null) {
      return
    }

    vectorHelper.set(x, y, z)
    vectorHelper.applyQuaternion(ref.current.quaternion)
    vectorHelper.toArray(result)
  })
  return result
}

/**
 * @deprecated use PivotHandles instead
 */
export const PivotControls = PivotHandles
