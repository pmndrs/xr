import { ReactNode } from 'react'
import { useXRSessionVisibilityState } from '../index.js'

interface SessionVisibleProps {
  children?: ReactNode
}

/**
 * Guard that only **shows** its children by toggling their visibility based on whether the current session is visible or not.
 * Typically used to hide/show content when operating system overlays are showing
 *
 * @param props ‎
 * #### `children?` - `ReactNode` The ReactNode elements to conditionally show.
 * @example
 * ```tsx
 * <ShowIfSessionVisible>
 *   <Box />
 * </ShowIfSessionVisible>
 * ```
 * @see [Guards Example](https://pmndrs.github.io/xr/examples/guards/)
 * @see [Guards Tutorial](https://pmndrs.github.io/xr/docs/tutorials/guards)
 */
export function ShowIfSessionVisible({ children }: SessionVisibleProps) {
  const state = useXRSessionVisibilityState()
  return <group visible={state == null || state === 'visible'}>{children}</group>
}

/**
 * Guard that only **renders** its children to the scene based on whether the current session is visible or not.
 * Typically used to hide/show content when operating system overlays are showing
 *
 * @param props ‎
 * #### `children?` - `ReactNode` The ReactNode elements to conditionally show.
 * @example
 * ```tsx
 * <IfSessionVisible>
 *   <Box />
 * </IfSessionVisible>
 * ```
 * @see [Guards Example](https://pmndrs.github.io/xr/examples/guards/)
 * @see [Guards Tutorial](https://pmndrs.github.io/xr/docs/tutorials/guards)
 */
export function IfSessionVisible({ children }: SessionVisibleProps) {
  const state = useXRSessionVisibilityState()
  if (state != 'visible' && state != null) {
    return null
  }
  return <>{children}</>
}
