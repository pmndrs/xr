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
 */
export function IfSessionVisible({ children }: SessionVisibleProps) {
  const state = useXRSessionVisibilityState()
  if (state != 'visible' && state != null) {
    return null
  }
  return <>{children}</>
}
