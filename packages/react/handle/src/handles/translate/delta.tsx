import {
  setupTranslateHandleDelta,
  createTranslateHandleDeltaLineGeometry,
  handleXRayMaterialProperties,
} from '@pmndrs/handle'
import { useEffect, useRef } from 'react'
import { LineSegments, Mesh } from 'three'
import { useHandlesContext } from '../context.js'

const geometry = createTranslateHandleDeltaLineGeometry()

export function TranslateHandleDelta() {
  const startRef = useRef<Mesh>(null)
  const endRef = useRef<Mesh>(null)
  const lineRef = useRef<LineSegments>(null)

  const context = useHandlesContext()

  useEffect(() => {
    if (startRef.current == null || endRef.current == null || lineRef.current == null) {
      return
    }
    return setupTranslateHandleDelta(context, startRef.current, lineRef.current, endRef.current)
  }, [context])

  return (
    <>
      <mesh renderOrder={Infinity} ref={startRef}>
        <octahedronGeometry args={[0.01, 2]} />
        <meshBasicMaterial {...handleXRayMaterialProperties} />
      </mesh>
      <mesh renderOrder={Infinity} ref={endRef}>
        <octahedronGeometry args={[0.01, 2]} />
        <meshBasicMaterial {...handleXRayMaterialProperties} />
      </mesh>
      <lineSegments renderOrder={Infinity} ref={lineRef} geometry={geometry}>
        <lineBasicMaterial {...handleXRayMaterialProperties} />
      </lineSegments>
    </>
  )
}
