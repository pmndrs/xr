import React, { useRef, useEffect, useCallback } from 'react'
import { useXR, useXREvent, XRInteractionEvent } from './XR'
import { XRHandedness } from './webxr'

export function Hover({ onChange, children }: any) {
  const ref = useRef()
  const { addInteraction } = useXR()

  useEffect(() => {
    addInteraction(ref.current, 'onHover', () => onChange(true))
    addInteraction(ref.current, 'onBlur', () => onChange(false))
  }, [onChange, addInteraction])

  return <group ref={ref}>{children}</group>
}

export function Select({ onSelect, children }: any) {
  const ref = useRef()
  const { addInteraction } = useXR()

  const hovered = useRef(false)
  const hoveredWhenStarted = useRef(false)
  const hoveredHandedness = useRef<XRHandedness | undefined>(undefined)

  const onStart = useCallback((e: XRInteractionEvent) => {
    hoveredWhenStarted.current = hovered.current
    hoveredHandedness.current = e.controller.inputSource?.handedness
  }, [])

  const onEnd = useCallback(
    (e: XRInteractionEvent) => {
      if (hoveredWhenStarted.current && e.controller.inputSource?.handedness === hoveredHandedness.current) {
        onSelect()
      }
    },
    [onSelect]
  )

  useXREvent('selectstart', onStart)
  useXREvent('selectend', onEnd)

  useEffect(() => {
    addInteraction(ref.current, 'onHover', () => (hovered.current = true))
    addInteraction(ref.current, 'onBlur', () => (hovered.current = false))
  }, [addInteraction])

  return <group ref={ref}>{children}</group>
}
