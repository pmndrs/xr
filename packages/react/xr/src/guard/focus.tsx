import { ReactNode } from 'react'
import { useXRSessionVisibilityState } from '../index.js'

/**
 * guard that only makes its children visible when the session is not blurred or when not in a session
 */
export function ShowIfSessionVisible({ children }: { children?: ReactNode }) {
  const state = useXRSessionVisibilityState()
  return <group visible={state == null || state === 'visible'}>{children}</group>
}

/**
 * guard that only renders its children when the session is not blurred or when not in a session
 */
export function IfSessionVisible({ children }: { children?: ReactNode }) {
  const state = useXRSessionVisibilityState()
  if (state != 'visible' && state != null) {
    return null
  }
  return <>{children}</>
}
