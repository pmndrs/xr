import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Group } from 'three'
import { useInteraction } from './hooks.js'

type XRInteractionHandler = Parameters<typeof useInteraction>[2]

/**
 * @deprecated just use <group onClick/... />
 */
export const Interactive = forwardRef<
  Group,
  {
    onHover?: XRInteractionHandler
    onBlur?: XRInteractionHandler
    onSelectStart?: XRInteractionHandler
    onSelectEnd?: XRInteractionHandler
    //onSelectMissed?: XRInteractionHandler
    onSelect?: XRInteractionHandler
    onSqueezeStart?: XRInteractionHandler
    onSqueezeEnd?: XRInteractionHandler
    //onSqueezeMissed?: XRInteractionHandler
    onSqueeze?: XRInteractionHandler
    onMove?: XRInteractionHandler
    children: React.ReactNode
  }
>(
  (
    {
      onHover,
      onBlur,
      onSelectStart,
      onSelectEnd,
      onSelect,
      onSqueezeStart,
      onSqueezeEnd,
      onSqueeze,
      onMove,
      children,
    },
    passedRef,
  ) => {
    const ref = useRef<Group>(null!)
    useImperativeHandle(passedRef, () => ref.current)

    useInteraction(ref, 'onHover', onHover)
    useInteraction(ref, 'onBlur', onBlur)
    useInteraction(ref, 'onSelectStart', onSelectStart)
    useInteraction(ref, 'onSelectEnd', onSelectEnd)
    //useInteraction(ref, 'onSelectMissed', onSelectMissed)
    useInteraction(ref, 'onSelect', onSelect)
    useInteraction(ref, 'onSqueezeStart', onSqueezeStart)
    useInteraction(ref, 'onSqueezeEnd', onSqueezeEnd)
    //useInteraction(ref, 'onSqueezeMissed', onSqueezeMissed)
    useInteraction(ref, 'onSqueeze', onSqueeze)
    useInteraction(ref, 'onMove', onMove)

    return <group ref={ref}>{children}</group>
  },
)
