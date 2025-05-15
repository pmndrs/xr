import { Group, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three'
import { HandlesContext } from '../context.js'
import { HandlesProperties } from '../index.js'
import { computeHandlesScale } from '../utils.js'
import { AxisScaleHandle } from './axis.js'
import { PlaneScaleHandle } from './plane.js'
import { UniformAxisScaleHandle } from './uniform.js'

const vectorHelper = new Vector3()

export class ScaleHandles extends Group {
  private readonly scaleX: UniformAxisScaleHandle
  private readonly scaleY: UniformAxisScaleHandle
  private readonly scaleZ: UniformAxisScaleHandle
  private readonly scaleNegX: UniformAxisScaleHandle
  private readonly scaleNegY: UniformAxisScaleHandle
  private readonly scaleNegZ: UniformAxisScaleHandle

  private readonly translationX: AxisScaleHandle
  private readonly translationY: AxisScaleHandle
  private readonly translationZ: AxisScaleHandle
  private readonly translationNegX: AxisScaleHandle
  private readonly translationNegY: AxisScaleHandle
  private readonly translationNegZ: AxisScaleHandle
  private readonly translationXY: PlaneScaleHandle
  private readonly translationYZ: PlaneScaleHandle
  private readonly translationXZ: PlaneScaleHandle

  constructor(
    private readonly context: HandlesContext,
    public size?: number,
    public fixed?: boolean,
  ) {
    super()
    this.scaleX = new UniformAxisScaleHandle(this.context, undefined, 'x')
    this.add(this.scaleX)
    this.scaleY = new UniformAxisScaleHandle(this.context, undefined, 'y')
    this.scaleY.rotation.z = Math.PI / 2
    this.add(this.scaleY)
    this.scaleZ = new UniformAxisScaleHandle(this.context, undefined, 'z')
    this.scaleZ.rotation.y = -Math.PI / 2
    this.add(this.scaleZ)
    this.scaleNegX = new UniformAxisScaleHandle(this.context, undefined, 'x', true)
    this.add(this.scaleNegX)
    this.scaleNegY = new UniformAxisScaleHandle(this.context, undefined, 'y', true)
    this.scaleNegY.rotation.z = Math.PI / 2
    this.add(this.scaleNegY)
    this.scaleNegZ = new UniformAxisScaleHandle(this.context, undefined, 'z', true)
    this.scaleNegZ.rotation.y = -Math.PI / 2
    this.add(this.scaleNegZ)
    this.translationX = new AxisScaleHandle(this.context, 'x')
    this.add(this.translationX)
    this.translationY = new AxisScaleHandle(this.context, 'y')
    this.translationY.rotation.z = Math.PI / 2
    this.add(this.translationY)
    this.translationZ = new AxisScaleHandle(this.context, 'z')
    this.translationZ.rotation.y = -Math.PI / 2
    this.add(this.translationZ)
    this.translationNegX = new AxisScaleHandle(this.context, 'x', undefined, true, false)
    this.add(this.translationNegX)
    this.translationNegY = new AxisScaleHandle(this.context, 'y', undefined, true, false)
    this.translationNegY.rotation.z = Math.PI / 2
    this.add(this.translationNegY)
    this.translationNegZ = new AxisScaleHandle(this.context, 'z', undefined, true, false)
    this.translationNegZ.rotation.y = -Math.PI / 2
    this.add(this.translationNegZ)
    this.translationXY = new PlaneScaleHandle(this.context, 'xy')
    this.add(this.translationXY)
    this.translationXZ = new PlaneScaleHandle(this.context, 'xz')
    this.translationXZ.rotation.x = Math.PI / 2
    this.add(this.translationXZ)
    this.translationYZ = new PlaneScaleHandle(this.context, 'yz')
    this.translationYZ.rotation.y = -Math.PI / 2
    this.add(this.translationYZ)
  }

  update(camera: PerspectiveCamera | OrthographicCamera) {
    this.updateWorldMatrix(true, false)
    this.scale.setScalar(1)
    const target = this.context.getTarget()
    if (target != null) {
      target.getWorldScale(vectorHelper)
      this.scale.divide(vectorHelper)
    }
    this.scale.multiplyScalar(computeHandlesScale(this, camera, this.fixed ?? true, this.size ?? 1))
  }

  bind(options?: HandlesProperties) {
    const unbindScaleX = this.scaleX.bind(0xffffff, 0xffff00, options)
    const unbindScaleY = this.scaleY.bind(0xffffff, 0xffff00, options)
    const unbindScaleZ = this.scaleZ.bind(0xffffff, 0xffff00, options)
    const unbindScaleNegX = this.scaleNegX.bind(0xffffff, 0xffff00, options)
    const unbindScaleNegY = this.scaleNegY.bind(0xffffff, 0xffff00, options)
    const unbindScaleNegZ = this.scaleNegZ.bind(0xffffff, 0xffff00, options)

    const unbindTranslationX = this.translationX.bind(0xff0000, 0xffff00, options)
    const unbindTranslationY = this.translationY.bind(0x00ff00, 0xffff00, options)
    const unbindTranslationZ = this.translationZ.bind(0x0000ff, 0xffff00, options)
    const unbindTranslationNegX = this.translationNegX.bind(0xff0000, 0xffff00, options)
    const unbindTranslationNegY = this.translationNegY.bind(0x00ff00, 0xffff00, options)
    const unbindTranslationNegZ = this.translationNegZ.bind(0x0000ff, 0xffff00, options)
    const unbindTranslationXY = this.translationXY.bind(0x0000ff, 0xffff00, options)
    const unbindTranslationYZ = this.translationYZ.bind(0xff0000, 0xffff00, options)
    const unbindTranslationXZ = this.translationXZ.bind(0x00ff00, 0xffff00, options)

    return () => {
      unbindTranslationX?.()
      unbindTranslationY?.()
      unbindTranslationZ?.()
      unbindTranslationNegX?.()
      unbindTranslationNegY?.()
      unbindTranslationNegZ?.()
      unbindTranslationXY?.()
      unbindTranslationYZ?.()
      unbindTranslationXZ?.()
      unbindScaleX?.()
      unbindScaleY?.()
      unbindScaleZ?.()
      unbindScaleNegX?.()
      unbindScaleNegY?.()
      unbindScaleNegZ?.()
    }
  }
}

/*
import {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react'
import { Group, Vector3Tuple } from 'three'
import { HandlesContext } from '../context.js'
import { HandleOptions, HandleTransformOptions } from '@pmndrs/handle'
import { ThreeElements } from '@react-three/fiber'
import { FreeScaleControl } from './free.js'
import { HandlesAxisHighlight } from '../axis.js'
import { AxisScaleHande } from './axis.js'
import { PlaneScaleHandle } from './plane.js'
import { HandlesSize } from '../size.js'

export type ScaleHandlesProperties = ThreeElements['group'] &
  Pick<HandleOptions<any>, 'alwaysUpdate' | 'apply' | 'stopPropagation'> & {
    enabled?: Exclude<HandleTransformOptions, Array<Vector3Tuple>>
    size?: number
    fixed?: boolean
  }

export const ScaleHandles: ForwardRefExoticComponent<PropsWithoutRef<ScaleHandlesProperties> & RefAttributes<Group>> =
  forwardRef<Group, ScaleHandlesProperties>(
    ({ children, alwaysUpdate, apply, stopPropagation, enabled, size, fixed, ...props }, ref) => {
      const groupRef = useRef<Group>(null)
      useImperativeHandle(ref, () => groupRef.current!, [])
      return (
        <HandlesContext
          alwaysUpdate={alwaysUpdate}
          apply={apply}
          stopPropagation={stopPropagation}
          targetRef={groupRef}
        >
          <group {...props}>
            <HandlesSize size={size} fixed={fixed}>

              <PlaneScaleHandle
                enabled={enabled}
                color={0x0000ff}
                hoverColor={0xffff00}
                opacity={0.5}
                hoverOpacity={1}
                tag="xy"
              />

              <PlaneScaleHandle
                enabled={enabled}
                rotation-x={Math.PI / 2}
                color={0x00ff00}
                hoverColor={0xffff00}
                opacity={0.5}
                hoverOpacity={1}
                tag="xz"
              />

              <PlaneScaleHandle
                enabled={enabled}
                rotation-y={-Math.PI / 2}
                color={0xff0000}
                hoverColor={0xffff00}
                opacity={0.5}
                hoverOpacity={1}
                tag="yz"
              />

              <AxisScaleHande enabled={enabled} color={0xff0000} hoverColor={0xffff00} opacity={1} tag="x" />
              <AxisScaleHande
                enabled={enabled}
                color={0xff0000}
                hoverColor={0xffff00}
                opacity={1}
                invert
                showHandleLine={false}
                tag="x"
              />
              <HandlesAxisHighlight tag="x" enabled={enabled} />

              <AxisScaleHande
                enabled={enabled}
                rotation-z={Math.PI / 2}
                color={0x00ff00}
                hoverColor={0xffff00}
                opacity={1}
                tag="y"
              />
              <AxisScaleHande
                enabled={enabled}
                rotation-z={Math.PI / 2}
                color={0x00ff00}
                hoverColor={0xffff00}
                opacity={1}
                invert
                showHandleLine={false}
                tag="y"
              />
              <HandlesAxisHighlight enabled={enabled} rotation-z={Math.PI / 2} tag="y" />

              <AxisScaleHande
                rotation-y={-Math.PI / 2}
                enabled={enabled}
                color={0x0000ff}
                hoverColor={0xffff00}
                opacity={1}
                tag="z"
              />
              <AxisScaleHande
                rotation-y={-Math.PI / 2}
                enabled={enabled}
                color={0x0000ff}
                hoverColor={0xffff00}
                opacity={1}
                invert
                showHandleLine={false}
                tag="z"
              />
              <HandlesAxisHighlight rotation-y={-Math.PI / 2} enabled={enabled} tag="z" />

              <FreeScaleControl enabled={enabled} />
            </HandlesSize>

            <group ref={groupRef}>{children}</group>
          </group>
        </HandlesContext>
      )
    },
  )

export * from './free.js'
export * from './axis.js'
export * from './plane.js'
*/
