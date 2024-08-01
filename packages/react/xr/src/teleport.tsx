import { Pointer } from '@pmndrs/pointer-events'
import {
  makeTeleportTarget,
  TeleportPointerRayModel as TeleportPointerRayModelImpl,
  TeleportPointerRayModelOptions,
} from '@pmndrs/xr'
import { ThreeEvent, useFrame, useStore } from '@react-three/fiber'
import { forwardRef, ReactNode, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Group, Vector3 } from 'three'

/**
 * component that allows to declare its children as teleport targets.
 */
export function TeleportTarget({
  children,
  onTeleport,
}: {
  children?: ReactNode
  onTeleport?: (point: Vector3, event: ThreeEvent<MouseEvent>) => void
}) {
  const ref = useRef<Group>(null)
  const teleportRef = useRef(onTeleport)
  teleportRef.current = onTeleport
  const store = useStore()
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    return makeTeleportTarget(
      ref.current,
      () => store.getState().camera,
      (point, event) => teleportRef.current?.(point, event as any),
    )
  }, [store])
  return (
    <group pointerEventsType={{ allow: 'teleport' }} ref={ref}>
      {children}
    </group>
  )
}

export const TeleportPointerRayModel = forwardRef<
  TeleportPointerRayModelImpl,
  TeleportPointerRayModelOptions & { pointer: Pointer; linePoints: Array<Vector3> }
>(({ pointer, linePoints, ...options }, ref) => {
  const mesh = useMemo(() => new TeleportPointerRayModelImpl(linePoints), [linePoints])
  useImperativeHandle(ref, () => mesh, [mesh])
  mesh.options = options
  useFrame(() => mesh.update(pointer))
  return <primitive object={mesh} />
})
