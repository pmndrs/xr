import { forwardHtmlEvents } from '@pmndrs/pointer-events'
import { addEffect, EventManager, useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export function PointerEvents() {
  const domElement = useThree((s) => s.gl.domElement)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const { destroy, update } = forwardHtmlEvents(domElement, () => camera, scene)
    const cleanupUpdate = addEffect(update)
    return () => {
      cleanupUpdate()
      destroy()
    }
  }, [domElement, camera, scene])
  return null
}

export const noEvents = (): EventManager<HTMLElement> => ({ enabled: false, priority: 0 })
