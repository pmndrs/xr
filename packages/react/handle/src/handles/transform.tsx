import { GroupProps } from '@react-three/fiber'
import { RotateHandles, RotateHandlesProperties } from './rotate/index.js'
import { ScaleHandles } from './scale/index.js'
import { TranslateHandles } from './translate/index.js'
import { HandleOptions, HandleTransformOptions } from '@pmndrs/handle'
import { Group, Vector3Tuple } from 'three'
import { forwardRef, ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react'

export type TransformHandlesProperties = Omit<GroupProps, 'scale'> &
  HandleOptions<any> &
  (
    | {
        enabled?: RotateHandlesProperties['enabled']
        mode: 'rotate'
      }
    | {
        enabled?: Exclude<HandleTransformOptions, Vector3Tuple>
        mode?: 'translate' | 'scale'
      }
  )

export const TransformHandles: ForwardRefExoticComponent<
  PropsWithoutRef<TransformHandlesProperties> & RefAttributes<Group>
> = forwardRef<Group, TransformHandlesProperties>((props, ref) => {
  const {
    children,
    alwaysUpdate,
    scale,
    rotate,
    translate,
    multitouch,
    apply,
    stopPropagation,
    enabled,
    mode,
    ...rest
  } = props
  const forwardedProperties: HandleOptions<any> = {
    alwaysUpdate,
    scale,
    rotate,
    translate,
    multitouch,
    apply,
    stopPropagation,
  }
  return (
    <TranslateHandles
      ref={ref}
      enabled={props.mode === 'translate' || props.mode == null ? props.enabled : false}
      {...rest}
      {...forwardedProperties}
    >
      <RotateHandles enabled={props.mode === 'rotate' ? props.enabled : false} {...forwardedProperties}>
        <ScaleHandles enabled={props.mode === 'scale' ? props.enabled : false} {...forwardedProperties}>
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
