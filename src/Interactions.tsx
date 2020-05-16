import React, { useRef, useEffect, useCallback } from 'react'
import { useXR, useXREvent, XRInteractionEvent, XREvent } from './XR'
import { XRHandedness } from './webxr'
import { Object3D } from 'three'

export function Hover({ onChange, children }: any) {
  const ref = useRef<Object3D>()
  const { addInteraction } = useXR()
  const hovering = useRef(new Set<XRHandedness | undefined>())

  useEffect(() => {
    addInteraction(ref.current as Object3D, 'onHover', (e: XRInteractionEvent) => {
      if (hovering.current.size === 0) {
        onChange(true)
      }
      hovering.current.add(e.controller.inputSource?.handedness)
    })
    addInteraction(ref.current as Object3D, 'onBlur', (e: XRInteractionEvent) => {
      hovering.current.delete(e.controller.inputSource?.handedness)
      if (hovering.current.size === 0) {
        onChange(false)
      }
    })
  }, [onChange, addInteraction])

  return <group ref={ref}>{children}</group>
}

export function Select({ onSelect, children }: any) {
  const ref = useRef<Object3D>()
  const { addInteraction } = useXR()

  const hoveredHandedness = useRef<Set<XRHandedness | undefined>>(new Set())

  const onEnd = useCallback(
    (e: XREvent) => {
      if (hoveredHandedness.current.has(e.controller.inputSource?.handedness)) {
        onSelect()
      }
    },
    [onSelect]
  )

  useXREvent('selectend', onEnd)

  useEffect(() => {
    addInteraction(ref.current as Object3D, 'onHover', (e: XRInteractionEvent) => {
      hoveredHandedness.current.add(e.controller.inputSource?.handedness)
    })
    addInteraction(ref.current as Object3D, 'onBlur', (e: XRInteractionEvent) => {
      hoveredHandedness.current.delete(e.controller.inputSource?.handedness)
    })
  }, [addInteraction])

  return <group ref={ref}>{children}</group>
}
