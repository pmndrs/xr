import { GroupProps } from '@react-three/fiber'
import { RotateHandles, RotateHandlesProperties } from './rotate/index.js'
import { ScaleHandles } from './scale/index.js'
import { TranslateHandles } from './translate/index.js'
import { HandleOptions, HandleTransformOptions } from '@pmndrs/handle'
import { Group, Vector3Tuple } from 'three'
import { forwardRef, ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react'

export type TransformHandlesProperties = GroupProps &
  Pick<HandleOptions<any>, 'alwaysUpdate' | 'apply' | 'stopPropagation'> & { size?: number; fixed?: boolean } & (
    | {
        enabled?: RotateHandlesProperties['enabled']
        mode: 'rotate'
      }
    | {
        enabled?: Exclude<HandleTransformOptions, Array<Vector3Tuple>>
        mode?: 'translate' | 'scale'
      }
  )

export const TransformHandles: ForwardRefExoticComponent<
  PropsWithoutRef<TransformHandlesProperties> & RefAttributes<Group>
> = forwardRef<Group, TransformHandlesProperties>((props, ref) => {
  const { children, alwaysUpdate, apply, stopPropagation, enabled, mode, size, fixed, ...rest } = props
  const forwardedProperties: Pick<HandleOptions<any>, 'alwaysUpdate' | 'apply' | 'stopPropagation'> = {
    alwaysUpdate,
    apply,
    stopPropagation,
  }
  return (
    <TranslateHandles
      ref={ref}
      enabled={props.mode === 'translate' || props.mode == null ? props.enabled : false}
      size={size}
      fixed={fixed}
      {...rest}
      {...forwardedProperties}
    >
      <RotateHandles
        enabled={props.mode === 'rotate' ? props.enabled : false}
        size={size}
        fixed={fixed}
        {...forwardedProperties}
      >
        <ScaleHandles
          enabled={props.mode === 'scale' ? props.enabled : false}
          size={size}
          fixed={fixed}
          {...forwardedProperties}
        >
          {children}
        </ScaleHandles>
      </RotateHandles>
    </TranslateHandles>
  )
})

/**
 * @deprecated use TransformHandles instead
 */
export const TransformControls = TransformHandles
