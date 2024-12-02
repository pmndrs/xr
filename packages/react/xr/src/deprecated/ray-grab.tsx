import { ComponentPropsWithoutRef, forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { Interactive } from './interactive.js'
import { Group, Matrix4, Object3D } from 'three'
import { useFrame } from '@react-three/fiber'
import { isXRInputSourceState } from '@pmndrs/xr/internals'

/**
 * @deprecated use DragControls instead
 */
export const RayGrab = forwardRef<Group, ComponentPropsWithoutRef<typeof Interactive>>(function RayGrab(
  { onSelectStart, onSelectEnd, children, ...rest },
  forwardedRef,
) {
  const grabbingController = useRef<Object3D>()
  const groupRef = useRef<Group>(null)
  const previousTransform = useMemo(() => new Matrix4(), [])
  useImperativeHandle(forwardedRef, () => groupRef.current!)

  useFrame(() => {
    const controller = grabbingController.current
    const group = groupRef.current
    if (!group || !controller) return

    group.applyMatrix4(previousTransform)
    controller.updateWorldMatrix(true, false)
    group.applyMatrix4(controller.matrixWorld)
    group.updateMatrixWorld()

    previousTransform.copy(controller.matrixWorld).invert()
  })

  return (
    <Interactive
      ref={groupRef}
      onSelectStart={(e) => {
        if (
          isXRInputSourceState(e.target) &&
          (e.target.type === 'controller' || e.target.type === 'hand') &&
          e.target.object != null
        ) {
          grabbingController.current = e.target.object
          e.target.object.updateWorldMatrix(true, false)
          previousTransform.copy(e.target.object.matrixWorld).invert()
          onSelectStart?.(e)
        }
      }}
      onSelectEnd={(e) => {
        if (e.target.controller === grabbingController.current) {
          grabbingController.current = undefined
        }
        onSelectEnd?.(e)
      }}
      {...rest}
    >
      {children}
    </Interactive>
  )
})
