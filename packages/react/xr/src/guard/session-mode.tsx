import { ReactNode } from 'react'
import { useXR } from '../index.js'

function useIsInSessionMode(
  allow?: XRSessionMode | ReadonlyArray<XRSessionMode | undefined>,
  deny?: XRSessionMode | ReadonlyArray<XRSessionMode | undefined>,
) {
  const mode = useXR((state) => state.mode)
  if (deny != null) {
    return Array.isArray(deny) ? !deny.includes(mode) : deny != mode
  }
  if (allow != null) {
    return Array.isArray(allow) ? allow.includes(mode) : allow === mode
  }
  return mode !== null
}

/**
 * guard that shows its children based on the current session mode
 */
export function ShowIfInSessionMode({
  children,
  allow,
  deny,
}: {
  children?: ReactNode
  allow?: XRSessionMode | ReadonlyArray<XRSessionMode | undefined>
  deny?: XRSessionMode | ReadonlyArray<XRSessionMode | undefined>
}) {
  const visible = useIsInSessionMode(allow, deny)
  return <group visible={visible}>{children}</group>
}

/**
 * guard that renders its children based on the current session mode
 */
export function IfInSessionMode({
  children,
  allow,
  deny,
}: {
  children?: ReactNode
  allow?: XRSessionMode | ReadonlyArray<XRSessionMode | undefined>
  deny?: XRSessionMode | ReadonlyArray<XRSessionMode | undefined>
}) {
  const visible = useIsInSessionMode(allow, deny)
  return visible ? <>{children}</> : null
}
