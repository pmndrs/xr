import { ReactNode } from 'react'
import { useSessionModeSupported } from '../index.js'

/**
 * guard that only show its children if the session mode is supported
 */
export function ShowIfSessionModeSupported({ children, mode }: { children?: ReactNode; mode: XRSessionMode }) {
  const supported = useSessionModeSupported(mode)
  return <group visible={supported}>{children}</group>
}

/**
 * guard that only renders its visible if the session mode is supported
 */
export function IfSessionModeSupported({ children, mode }: { children?: ReactNode; mode: XRSessionMode }) {
  const supported = useSessionModeSupported(mode)
  if (!supported) {
    return null
  }
  return <>{children}</>
}
