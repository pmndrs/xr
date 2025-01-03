import {
  setupTranslateControlsDelta,
  createTranslateControlsDeltaLineGeometry,
  controlsMaterialProperties,
} from '@pmndrs/handle'
import { useEffect, useRef } from 'react'
import { LineSegments, Mesh } from 'three'
import { useControlsContext } from '../context.js'

const geometry = createTranslateControlsDeltaLineGeometry()

export function TranslateControlsDelta() {
  const startRef = useRef<Mesh>(null)
  const endRef = useRef<Mesh>(null)
  const lineRef = useRef<LineSegments>(null)

  const context = useControlsContext()

  useEffect(() => {
    if (startRef.current == null || endRef.current == null || lineRef.current == null) {
      return
    }
    return setupTranslateControlsDelta(context, startRef.current, lineRef.current, endRef.current)
  }, [context])

  return (
    <>
      <mesh ref={startRef}>
        <octahedronGeometry args={[0.01, 2]} />
        <meshBasicMaterial {...controlsMaterialProperties} />
      </mesh>
      <mesh ref={endRef}>
        <octahedronGeometry args={[0.01, 2]} />
        <meshBasicMaterial {...controlsMaterialProperties} />
      </mesh>
      <lineSegments ref={lineRef} geometry={geometry}>
        <lineBasicMaterial {...controlsMaterialProperties} />
      </lineSegments>
    </>
  )
}
