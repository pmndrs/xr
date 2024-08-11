import { Pointer } from '@pmndrs/pointer-events'

export function bindXRInputSourceEvent(
  session: XRSession,
  inputSource: XRInputSource | 'all',
  event: 'select' | 'selectstart' | 'selectend' | 'squeeze' | 'squeezestart' | 'squeezeend',
  fn: (event: XRInputSourceEvent) => void,
) {
  const filterFn = (event: XRInputSourceEvent) => {
    if (inputSource != 'all' && event.inputSource != inputSource) {
      return
    }
    fn(event)
  }
  session.addEventListener(event, filterFn)
  return () => session.removeEventListener(event, filterFn)
}

export function bindPointerXRInputSourceEvent(
  pointer: Pointer,
  session: XRSession,
  inputSource: XRInputSource,
  event: 'select' | 'squeeze',
  missingEvents: ReadonlyArray<XRInputSourceEvent>,
  options: { button?: number } = {},
) {
  const downListener = (e: XRInputSourceEvent) => {
    if (e.inputSource === inputSource) {
      pointer.down(Object.assign(e, { button: options.button ?? 0 }))
    }
  }
  const upListener = (e: XRInputSourceEvent) => {
    if (e.inputSource === inputSource) {
      pointer.up(Object.assign(e, { button: options.button ?? 0 }))
    }
  }
  const downEventName = `${event}start` as const
  const upEventName = `${event}end` as const
  //missing events are required for transient pointers when the input source is registered asynchrounously
  //so that events directly emitted on initialization are still processed once the input source is created
  const length = missingEvents.length
  for (let i = 0; i < length; i++) {
    const event = missingEvents[i]
    switch (event.type) {
      case downEventName:
        downListener(event)
        break
      case upEventName:
        upListener(event)
        break
    }
  }

  session.addEventListener(downEventName, downListener)
  session.addEventListener(upEventName, upListener)
  return () => {
    session.removeEventListener(downEventName, downListener)
    session.removeEventListener(upEventName, upListener)
  }
}
