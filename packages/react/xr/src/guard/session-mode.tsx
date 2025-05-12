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

interface InSessionModeProps {
  children?: ReactNode
  allow?: XRSessionMode | ReadonlyArray<XRSessionMode | undefined>
  deny?: XRSessionMode | ReadonlyArray<XRSessionMode | undefined>
}

/**
 * Guard that only **shows** its children by toggling their visibility based on the current session mode.
 * If neither `allow` nor `deny` are provided, the visiblity will be based on whether or not any mode is currently being used.
 *
 * @param props
 * #### `children?` - `ReactNode` The ReactNode elements to conditionally show.
 * #### `allow?` - `XRSessionMode | ReadonlyArray<XRSessionMode | undefined>` The session mode(s) where the children will be shown. If not provided, the children will be shown in all modes except the ones in `deny`.
 * #### `deny?` - `XRSessionMode | ReadonlyArray<XRSessionMode | undefined>` The session mode(s) where the children will be hidden.
 */
export function ShowIfInSessionMode({ children, allow, deny }: InSessionModeProps) {
  const visible = useIsInSessionMode(allow, deny)
  return <group visible={visible}>{children}</group>
}

/**
 * Guard that only **renders** its children to the scene based on the current session mode.
 * If neither `allow` nor `deny` are provided, the elements will be rendered based on whether or not any mode is currently being used.
 *
 * @param props
 * #### `children?` - `ReactNode` The ReactNode elements to conditionally render.
 * #### `allow?` - `XRSessionMode | ReadonlyArray<XRSessionMode | undefined>` The session mode(s) where the children will be rendered. If not provided, the children will be rendered in all modes except the ones in `deny`.
 * #### `deny?` - `XRSessionMode | ReadonlyArray<XRSessionMode | undefined>` The session mode(s) where the children will not be rendered.
 */
export function IfInSessionMode({ children, allow, deny }: InSessionModeProps) {
  const visible = useIsInSessionMode(allow, deny)
  return visible ? <>{children}</> : null
}
