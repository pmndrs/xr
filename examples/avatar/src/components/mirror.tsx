import { ReactNode } from 'react'

export function Mirror({ children }: { children?: ReactNode }) {
  return (
    <group position-z={-2} scale-z={-1}>
      {children}
    </group>
  )
}
