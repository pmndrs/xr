import { ReactNode } from 'react'
import { useSessionSupported } from '../index.js'

/**
 * guard that only show its children if the session mode is supported
 */
export function ShowIfSessionSupported({ children, mode }: { children?: ReactNode; mode: XRSessionMode }) {
  const supported = useSessionSupported(mode)
  return <group visible={supported}>{children}</group>
}

/**
 * guard that only renders its visible if the session mode is supported
 */
export function IfSessionSupported({ children, mode }: { children?: ReactNode; mode: XRSessionMode }) {
  const supported = useSessionSupported(mode)
  if (!supported) {
    return null
  }
  return <>{children}</>
}
